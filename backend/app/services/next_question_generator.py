import json
from typing import List
from app.config import settings
from app.services.ai_client import call_ai_json
from app.services.prompts import NEXT_QUESTION_SYSTEM


def _mock_generate(instrument: str, metrics: dict) -> List[str]:
    return [
        f"Does the {instrument} strategy survive higher transaction costs (e.g. 0.25% instead of 0.10%)?",
        "Does performance change during high-volatility periods versus calm periods?",
        "Does the result remain positive if tested on a different, non-overlapping time period?",
    ]


def generate_next_questions(instrument: str, metrics: dict) -> List[str]:
    if settings.AI_PROVIDER == "openai":
        payload = json.dumps({"instrument": instrument, "metrics": metrics})
        result = call_ai_json(NEXT_QUESTION_SYSTEM, payload)
        if result and "__error__" not in result and "next_questions" in result:
            return result["next_questions"]
    return _mock_generate(instrument, metrics)
