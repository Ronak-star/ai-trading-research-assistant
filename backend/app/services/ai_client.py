"""
AI Client abstraction.

Two modes controlled by AI_PROVIDER env var:
  - "mock":   deterministic, rule-based extraction. No API key needed.
              This keeps the demo runnable offline and makes core logic
              testable without depending on live LLM output.
  - "openai": calls OpenAI's chat completions with response_format=json_object
              to force structured JSON output, per prompt template.

IMPORTANT: The rest of the application NEVER trusts free-form AI text for
control flow. Every AI call here returns parsed JSON matching an expected
shape, validated before being used downstream (see services/*).
"""
import json
from app.config import settings

try:
    from openai import OpenAI
    _client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
except Exception:
    _client = None


def call_ai_json(system_prompt: str, user_prompt: str) -> dict:
    """Calls the configured AI provider and returns parsed JSON (dict).
    Falls back to mock behavior if openai is selected but unavailable."""
    if settings.AI_PROVIDER == "openai" and _client is not None:
        try:
            resp = _client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            content = resp.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            # Never let the app crash if the AI provider fails -- degrade to mock.
            return {"__error__": str(e)}
    # mock mode: caller (services) implements deterministic logic separately.
    return {}
