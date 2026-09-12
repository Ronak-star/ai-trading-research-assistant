from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column, JSON


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    display_name: str = "Demo User"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ResearchQuestion(SQLModel, table=True):
    __tablename__ = "research_questions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    raw_question: str
    # LLM-extracted structured understanding
    parsed_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    # missing fields detected by MissingInformationDetector
    missing_fields_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    status: str = Field(default="parsed")  # parsed -> clarified -> defined
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Experiment(SQLModel, table=True):
    __tablename__ = "experiments"

    id: Optional[int] = Field(default=None, primary_key=True)
    research_question_id: int = Field(foreign_key="research_questions.id")
    market: str
    timeframe: str
    condition: str
    entry_rule: str
    exit_rule: str
    holding_period_days: int
    test_period_start: str
    test_period_end: str
    filters_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    transaction_cost_pct: float = 0.10
    slippage_pct: float = 0.05
    hypothesis: str
    assumptions_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    status: str = Field(default="draft")  # draft -> validated -> tested
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ExperimentResult(SQLModel, table=True):
    __tablename__ = "experiment_results"

    id: Optional[int] = Field(default=None, primary_key=True)
    experiment_id: int = Field(foreign_key="experiments.id", unique=True)
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    average_return_pct: float
    total_return_pct: float
    max_drawdown_pct: float
    equity_curve_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    trades_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    data_summary: str  # "WHAT THE DATA SHOWS" - factual
    ai_conclusion: str  # "WHAT WE CAN REASONABLY CONCLUDE" - cautious interpretation
    next_questions_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    is_simulated: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
