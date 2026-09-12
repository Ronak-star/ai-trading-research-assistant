from typing import List, Dict
from app.config import settings
from app.schemas import ExtractedFacts
from app.services.ai_client import call_ai_json
from app.services.prompts import MISSING_INFO_SYSTEM
import json

# The important fields required to build a testable experiment.
REQUIRED_FIELDS = {
    "instrument": "Which instrument should be tested? (e.g. NIFTY, BANKNIFTY, SENSEX)",
    "entry_condition": "What exact condition defines the entry? (e.g. what % qualifies as a 'sharp fall'?)",
    "holding_period": "How long should the position be held before exiting?",
    "test_period": "What historical period should be tested? (e.g. 2016-2026)",
}


def _mock_detect(facts: ExtractedFacts) -> List[Dict[str, str]]:
    missing = []
    facts_dict = facts.model_dump()
    for field, prompt in REQUIRED_FIELDS.items():
        if not facts_dict.get(field):
            missing.append({"field": field, "prompt": prompt})
    return missing


def detect_missing_fields(facts: ExtractedFacts) -> List[Dict[str, str]]:
    if settings.AI_PROVIDER == "openai":
        result = call_ai_json(MISSING_INFO_SYSTEM, json.dumps(facts.model_dump()))
        if result and "__error__" not in result and "missing_fields" in result:
            return result["missing_fields"]
    return _mock_detect(facts)
