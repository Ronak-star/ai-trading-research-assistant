from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ---------- STEP 2: Question Understanding ----------

class ExtractedFacts(BaseModel):
    """Fields explicitly stated by the user (None if not stated)."""
    instrument: Optional[str] = None
    market: Optional[str] = None
    timeframe: Optional[str] = None
    entry_condition: Optional[str] = None
    exit_condition: Optional[str] = None
    holding_period: Optional[str] = None
    test_period: Optional[str] = None
    filters: List[str] = Field(default_factory=list)
    hypothesis: Optional[str] = None
    explicit_statements: List[str] = Field(default_factory=list)


class AnalyzeRequest(BaseModel):
    question: str


class AnalyzeResponse(BaseModel):
    research_question_id: int
    raw_question: str
    extracted: ExtractedFacts
    missing_fields: List[Dict[str, str]]  # [{field, prompt}]
    needs_clarification: bool


# ---------- STEP 3: Clarification ----------

class ClarificationAnswer(BaseModel):
    field: str
    value: str


class ClarifyRequest(BaseModel):
    research_question_id: int
    answers: List[ClarificationAnswer]


class ClarifyResponse(BaseModel):
    research_question_id: int
    merged_facts: ExtractedFacts
    status: str


# ---------- STEP 4: Experiment Definition ----------

class ExperimentCreate(BaseModel):
    research_question_id: int
    market: str
    timeframe: str
    condition: str
    entry_rule: str
    exit_rule: str
    holding_period_days: int
    test_period_start: str
    test_period_end: str
    filters: List[str] = Field(default_factory=list)
    transaction_cost_pct: float = 0.10
    slippage_pct: float = 0.05
    hypothesis: str
    assumptions: List[str] = Field(default_factory=list)


class ExperimentOut(BaseModel):
    id: int
    research_question_id: int
    market: str
    timeframe: str
    condition: str
    entry_rule: str
    exit_rule: str
    holding_period_days: int
    test_period_start: str
    test_period_end: str
    filters: List[str]
    transaction_cost_pct: float
    slippage_pct: float
    hypothesis: str
    assumptions: List[str]
    status: str

    class Config:
        from_attributes = True


class ValidationIssue(BaseModel):
    field: str
    message: str


# ---------- STEP 6/7: Test + Results ----------

class TradeOut(BaseModel):
    entry_date: str
    exit_date: str
    entry_price: float
    exit_price: float
    return_pct: float
    outcome: str  # "win" | "loss"


class ExperimentResultOut(BaseModel):
    experiment_id: int
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    average_return_pct: float
    total_return_pct: float
    max_drawdown_pct: float
    equity_curve: List[Dict[str, Any]]
    trades: List[TradeOut]
    data_summary: str
    ai_conclusion: str
    next_questions: List[str]
    is_simulated: bool

    class Config:
        from_attributes = True


class HistoryItem(BaseModel):
    experiment_id: int
    research_question_id: int
    raw_question: str
    status: str
    created_at: str
    market: str
    key_metrics: Optional[Dict[str, Any]] = None
