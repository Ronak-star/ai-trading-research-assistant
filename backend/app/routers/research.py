from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.database import get_session
from app.models import ResearchQuestion, Experiment, ExperimentResult
from app.schemas import (
    AnalyzeRequest, AnalyzeResponse, ExtractedFacts,
    ClarifyRequest, ClarifyResponse,
    ExperimentCreate, ExperimentOut,
    ExperimentResultOut, HistoryItem,
)
from app.services.question_parser import parse_question
from app.services.missing_info_detector import detect_missing_fields
from app.services.clarification_engine import merge_clarifications
from app.services.experiment_validator import validate_experiment
from app.services.mock_test_engine import run_mock_backtest
from app.services.result_analyzer import analyze_result
from app.services.next_question_generator import generate_next_questions

router = APIRouter(prefix="/api/research", tags=["research"])


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest, session: Session = Depends(get_session)):
    if not req.question or not req.question.strip():
        raise HTTPException(400, "Question cannot be empty.")

    facts = parse_question(req.question)
    missing = detect_missing_fields(facts)

    rq = ResearchQuestion(
        raw_question=req.question,
        parsed_json=facts.model_dump(),
        missing_fields_json={"missing": missing},
        status="parsed",
    )
    session.add(rq)
    session.commit()
    session.refresh(rq)

    return AnalyzeResponse(
        research_question_id=rq.id,
        raw_question=req.question,
        extracted=facts,
        missing_fields=missing,
        needs_clarification=len(missing) > 0,
    )


@router.post("/clarify", response_model=ClarifyResponse)
def clarify(req: ClarifyRequest, session: Session = Depends(get_session)):
    rq = session.get(ResearchQuestion, req.research_question_id)
    if not rq:
        raise HTTPException(404, "Research question not found.")

    facts = ExtractedFacts(**rq.parsed_json)
    merged = merge_clarifications(facts, req.answers)

    rq.parsed_json = merged.model_dump()
    rq.status = "clarified"
    session.add(rq)
    session.commit()

    return ClarifyResponse(research_question_id=rq.id, merged_facts=merged, status=rq.status)


@router.post("/experiments", response_model=ExperimentOut)
def create_experiment(exp_in: ExperimentCreate, session: Session = Depends(get_session)):
    rq = session.get(ResearchQuestion, exp_in.research_question_id)
    if not rq:
        raise HTTPException(404, "Research question not found.")

    issues = validate_experiment(exp_in)
    if issues:
        raise HTTPException(422, detail=[i.model_dump() for i in issues])

    exp = Experiment(
        research_question_id=exp_in.research_question_id,
        market=exp_in.market,
        timeframe=exp_in.timeframe,
        condition=exp_in.condition,
        entry_rule=exp_in.entry_rule,
        exit_rule=exp_in.exit_rule,
        holding_period_days=exp_in.holding_period_days,
        test_period_start=exp_in.test_period_start,
        test_period_end=exp_in.test_period_end,
        filters_json={"filters": exp_in.filters},
        transaction_cost_pct=exp_in.transaction_cost_pct,
        slippage_pct=exp_in.slippage_pct,
        hypothesis=exp_in.hypothesis,
        assumptions_json={"assumptions": exp_in.assumptions},
        status="validated",
    )
    session.add(exp)
    rq.status = "defined"
    session.add(rq)
    session.commit()
    session.refresh(exp)

    return _experiment_to_out(exp)


@router.post("/experiments/{experiment_id}/test", response_model=ExperimentResultOut)
def test_experiment(experiment_id: int, session: Session = Depends(get_session)):
    exp = session.get(Experiment, experiment_id)
    if not exp:
        raise HTTPException(404, "Experiment not found.")

    try:
        metrics = run_mock_backtest(
            instrument=exp.market if exp.market.upper() in ("NIFTY", "BANKNIFTY", "SENSEX") else "NIFTY",
            condition=exp.condition,
            holding_period_days=exp.holding_period_days,
            test_period_start=exp.test_period_start,
            test_period_end=exp.test_period_end,
            transaction_cost_pct=exp.transaction_cost_pct,
            slippage_pct=exp.slippage_pct,
        )
    except FileNotFoundError as e:
        raise HTTPException(400, str(e))

    analysis = analyze_result(metrics, exp.hypothesis)
    next_qs = generate_next_questions(exp.market, metrics)

    existing = session.exec(
        select(ExperimentResult).where(ExperimentResult.experiment_id == experiment_id)
    ).first()
    if existing:
        session.delete(existing)
        session.commit()

    result = ExperimentResult(
        experiment_id=exp.id,
        total_trades=metrics["total_trades"],
        winning_trades=metrics["winning_trades"],
        losing_trades=metrics["losing_trades"],
        win_rate=metrics["win_rate"],
        average_return_pct=metrics["average_return_pct"],
        total_return_pct=metrics["total_return_pct"],
        max_drawdown_pct=metrics["max_drawdown_pct"],
        equity_curve_json={"points": metrics["equity_curve"]},
        trades_json={"trades": metrics["trades"]},
        data_summary=analysis["data_summary"],
        ai_conclusion=analysis["ai_conclusion"],
        next_questions_json={"questions": next_qs},
        is_simulated=True,
    )
    session.add(result)
    exp.status = "tested"
    session.add(exp)
    session.commit()
    session.refresh(result)

    return _result_to_out(result)


@router.get("/experiments/{experiment_id}", response_model=ExperimentOut)
def get_experiment(experiment_id: int, session: Session = Depends(get_session)):
    exp = session.get(Experiment, experiment_id)
    if not exp:
        raise HTTPException(404, "Experiment not found.")
    return _experiment_to_out(exp)


@router.get("/experiments/{experiment_id}/result", response_model=ExperimentResultOut)
def get_experiment_result(experiment_id: int, session: Session = Depends(get_session)):
    result = session.exec(
        select(ExperimentResult).where(ExperimentResult.experiment_id == experiment_id)
    ).first()
    if not result:
        raise HTTPException(404, "Result not found. Run the test first.")
    return _result_to_out(result)


@router.get("/history", response_model=List[HistoryItem])
def get_history(session: Session = Depends(get_session)):
    experiments = session.exec(select(Experiment).order_by(Experiment.created_at.desc())).all()
    items = []
    for exp in experiments:
        rq = session.get(ResearchQuestion, exp.research_question_id)
        result = session.exec(
            select(ExperimentResult).where(ExperimentResult.experiment_id == exp.id)
        ).first()
        key_metrics = None
        if result:
            key_metrics = {
                "win_rate": result.win_rate,
                "total_return_pct": result.total_return_pct,
                "total_trades": result.total_trades,
            }
        items.append(HistoryItem(
            experiment_id=exp.id,
            research_question_id=exp.research_question_id,
            raw_question=rq.raw_question if rq else "",
            status=exp.status,
            created_at=exp.created_at.isoformat(),
            market=exp.market,
            key_metrics=key_metrics,
        ))
    return items


def _experiment_to_out(exp: Experiment) -> ExperimentOut:
    return ExperimentOut(
        id=exp.id,
        research_question_id=exp.research_question_id,
        market=exp.market,
        timeframe=exp.timeframe,
        condition=exp.condition,
        entry_rule=exp.entry_rule,
        exit_rule=exp.exit_rule,
        holding_period_days=exp.holding_period_days,
        test_period_start=exp.test_period_start,
        test_period_end=exp.test_period_end,
        filters=exp.filters_json.get("filters", []),
        transaction_cost_pct=exp.transaction_cost_pct,
        slippage_pct=exp.slippage_pct,
        hypothesis=exp.hypothesis,
        assumptions=exp.assumptions_json.get("assumptions", []),
        status=exp.status,
    )


def _result_to_out(result: ExperimentResult) -> ExperimentResultOut:
    return ExperimentResultOut(
        experiment_id=result.experiment_id,
        total_trades=result.total_trades,
        winning_trades=result.winning_trades,
        losing_trades=result.losing_trades,
        win_rate=result.win_rate,
        average_return_pct=result.average_return_pct,
        total_return_pct=result.total_return_pct,
        max_drawdown_pct=result.max_drawdown_pct,
        equity_curve=result.equity_curve_json.get("points", []),
        trades=result.trades_json.get("trades", []),
        data_summary=result.data_summary,
        ai_conclusion=result.ai_conclusion,
        next_questions=result.next_questions_json.get("questions", []),
        is_simulated=result.is_simulated,
    )
