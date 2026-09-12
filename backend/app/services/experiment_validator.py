from typing import List
from datetime import datetime
from app.schemas import ExperimentCreate, ValidationIssue
from app.services.question_parser import SUPPORTED_INSTRUMENTS


def validate_experiment(exp: ExperimentCreate) -> List[ValidationIssue]:
    issues: List[ValidationIssue] = []

    if not exp.market:
        issues.append(ValidationIssue(field="market", message="Market/instrument is required."))

    if exp.holding_period_days <= 0:
        issues.append(ValidationIssue(field="holding_period_days", message="Holding period must be a positive number of days."))

    if exp.transaction_cost_pct < 0 or exp.transaction_cost_pct > 5:
        issues.append(ValidationIssue(field="transaction_cost_pct", message="Transaction cost % looks invalid (expected 0-5%)."))

    if exp.slippage_pct < 0 or exp.slippage_pct > 5:
        issues.append(ValidationIssue(field="slippage_pct", message="Slippage % looks invalid (expected 0-5%)."))

    try:
        start = datetime.fromisoformat(exp.test_period_start)
        end = datetime.fromisoformat(exp.test_period_end)
        if start >= end:
            issues.append(ValidationIssue(field="test_period", message="Test period start must be before end."))
    except ValueError:
        issues.append(ValidationIssue(field="test_period", message="Test period dates must be valid ISO dates (YYYY-MM-DD)."))

    if not exp.entry_rule:
        issues.append(ValidationIssue(field="entry_rule", message="Entry rule is required."))
    if not exp.exit_rule:
        issues.append(ValidationIssue(field="exit_rule", message="Exit rule is required."))

    return issues
