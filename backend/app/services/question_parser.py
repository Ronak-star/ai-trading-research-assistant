import re
import json
from app.config import settings
from app.schemas import ExtractedFacts
from app.services.ai_client import call_ai_json
from app.services.prompts import QUESTION_PARSER_SYSTEM

SUPPORTED_INSTRUMENTS = ["NIFTY", "BANKNIFTY", "SENSEX"]


def _mock_parse(question: str) -> ExtractedFacts:
    """Deterministic, rule-based extraction. Only fills fields that are
    clearly, explicitly present in the text -- never guesses critical params."""
    q = question.upper()
    facts = ExtractedFacts()

    for inst in SUPPORTED_INSTRUMENTS:
        if inst in q:
            facts.instrument = inst
            facts.market = "India"
            break

    # explicit fall/rise % pattern e.g. "2% fall", "falls by 3%"
    pct_match = re.search(r"(\d+(?:\.\d+)?)\s*%", question)
    fall_match = re.search(r"(fall|drop|decline|down)", q)
    rise_match = re.search(r"(rise|rally|up|gain)", q)
    if pct_match and fall_match:
        facts.entry_condition = f"Daily fall >= {pct_match.group(1)}%"
        facts.explicit_statements.append(f"User specified a {pct_match.group(1)}% fall threshold")
    elif fall_match:
        facts.explicit_statements.append("User mentioned buying after a 'sharp fall' without a defined threshold")
    elif pct_match and rise_match:
        facts.entry_condition = f"Daily rise >= {pct_match.group(1)}%"

    # holding period e.g. "hold for 5 days", "5-day"
    hold_match = re.search(r"(?:hold(?:ing)?(?: for)?|for)\s*(\d+)\s*(day|days|week|weeks)", question, re.I)
    if hold_match:
        facts.holding_period = f"{hold_match.group(1)} {hold_match.group(2)}"

    # test period e.g. "2016-2026", "since 2018"
    period_match = re.search(r"(\d{4})\s*(?:-|to|–)\s*(\d{4})", question)
    since_match = re.search(r"since\s*(\d{4})", question, re.I)
    if period_match:
        facts.test_period = f"{period_match.group(1)}-{period_match.group(2)}"
    elif since_match:
        facts.test_period = f"{since_match.group(1)}-present"

    # volatility filter mention
    if "volatil" in q:
        facts.filters.append("volatility regime mentioned")
        facts.explicit_statements.append("User referenced volatility as a possible filter")

    facts.hypothesis = question.strip()
    if facts.instrument:
        facts.explicit_statements.insert(0, f"User asked about instrument: {facts.instrument}")

    return facts


def parse_question(question: str) -> ExtractedFacts:
    if settings.AI_PROVIDER == "openai":
        result = call_ai_json(QUESTION_PARSER_SYSTEM, question)
        if result and "__error__" not in result:
            try:
                return ExtractedFacts(**result)
            except Exception:
                pass
    # fallback: mock/rule-based
    return _mock_parse(question)
