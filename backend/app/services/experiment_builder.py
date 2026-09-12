import re
from app.config import settings
from app.schemas import ExtractedFacts, ExperimentCreate
from app.services.ai_client import call_ai_json
from app.services.prompts import EXPERIMENT_BUILDER_SYSTEM
import json

DEFAULT_TX_COST_PCT = 0.10
DEFAULT_SLIPPAGE_PCT = 0.05


def _parse_holding_days(holding_period: str) -> int:
    if not holding_period:
        return 5
    m = re.search(r"(\d+)\s*(day|week)", holding_period, re.I)
    if not m:
        return 5
    n = int(m.group(1))
    return n * 7 if "week" in m.group(2).lower() else n


def _parse_test_period(test_period: str):
    if not test_period:
        return "2016-01-01", "2026-01-01"
    m = re.search(r"(\d{4}).*?(\d{4}|present)", test_period)
    if m:
        start = f"{m.group(1)}-01-01"
        end = "2026-01-01" if m.group(2) == "present" else f"{m.group(2)}-01-01"
        return start, end
    return "2016-01-01", "2026-01-01"


def _mock_build(research_question_id: int, facts: ExtractedFacts) -> ExperimentCreate:
    assumptions = []

    entry_rule = facts.entry_condition or "Daily fall >= 2%"
    if not facts.entry_condition:
        assumptions.append("Assumed default entry condition: daily fall >= 2% (not stated by user)")

    holding_days = _parse_holding_days(facts.holding_period)
    if not facts.holding_period:
        assumptions.append("Assumed default holding period: 5 trading days (not stated by user)")

    exit_rule = f"Exit after {holding_days} trading days"

    start, end = _parse_test_period(facts.test_period)
    if not facts.test_period:
        assumptions.append("Assumed default test period: 2016-2026 (not stated by user)")

    assumptions.append(f"Assumed transaction cost: {DEFAULT_TX_COST_PCT}% per trade (industry-typical estimate)")
    assumptions.append(f"Assumed slippage: {DEFAULT_SLIPPAGE_PCT}% per trade (industry-typical estimate)")

    return ExperimentCreate(
        research_question_id=research_question_id,
        market=facts.market or "India",
        timeframe=facts.timeframe or "Daily",
        condition=entry_rule,
        entry_rule=f"Buy at next session open when: {entry_rule}",
        exit_rule=exit_rule,
        holding_period_days=holding_days,
        test_period_start=start,
        test_period_end=end,
        filters=facts.filters,
        transaction_cost_pct=DEFAULT_TX_COST_PCT,
        slippage_pct=DEFAULT_SLIPPAGE_PCT,
        hypothesis=facts.hypothesis or "Buying after a decline may produce a short-term edge.",
        assumptions=assumptions,
    )


def build_experiment(research_question_id: int, facts: ExtractedFacts) -> ExperimentCreate:
    if settings.AI_PROVIDER == "openai":
        result = call_ai_json(EXPERIMENT_BUILDER_SYSTEM, json.dumps(facts.model_dump()))
        if result and "__error__" not in result:
            try:
                result["research_question_id"] = research_question_id
                return ExperimentCreate(**result)
            except Exception:
                pass
    return _mock_build(research_question_id, facts)
