from typing import List
from app.schemas import ExtractedFacts, ClarificationAnswer


def merge_clarifications(facts: ExtractedFacts, answers: List[ClarificationAnswer]) -> ExtractedFacts:
    """Merges user-provided clarification answers into the facts object.
    These are USER-PROVIDED values (not AI assumptions) once merged here."""
    data = facts.model_dump()
    for ans in answers:
        if ans.field in data:
            data[ans.field] = ans.value
        elif ans.field == "filters":
            data.setdefault("filters", []).append(ans.value)
    return ExtractedFacts(**data)
