"""Goal parser: transforms natural-language goals into structured requirements."""

import json
import logging
import re
from backend.orchestrator import model
from backend.orchestrator.state import REQUIRED_REQUIREMENTS_KEYS

logger = logging.getLogger("orchestrator.goal_parser")


class GoalParsingError(Exception):
    """Raised when the model fails to return valid structured requirements."""
    pass


LIST_KEYS = {
    "requested_features",
    "constraints",
    "data_requirements",
    "ui_requirements",
    "technical_requirements",
    "verification_requirements",
}

STRING_KEYS = {
    "objective",
    "domain",
    "expected_output",
}


def _clean_json_text(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _extract_and_normalize(raw_text: str) -> dict:
    cleaned = _clean_json_text(raw_text)
    data = json.loads(cleaned)
    if not isinstance(data, dict):
        raise ValueError("Model output is not a JSON object")

    normalized = {}
    for key in REQUIRED_REQUIREMENTS_KEYS:
        val = data.get(key)
        if key in LIST_KEYS:
            if val is None:
                normalized[key] = []
            elif isinstance(val, list):
                normalized[key] = [str(x) for x in val]
            elif isinstance(val, str):
                normalized[key] = [val] if val.strip() else []
            else:
                normalized[key] = []
        elif key in STRING_KEYS:
            if val is None:
                normalized[key] = ""
            else:
                normalized[key] = str(val)
    return normalized


def parse(goal: str) -> dict:
    """Parse a natural-language goal into a structured requirements dictionary.
    
    Calls the local model with retry on invalid JSON.
    Raises GoalParsingError if parsing fails twice.
    """
    base_prompt = f"""You are an expert requirements analyst.
Analyze the following goal and output a JSON object containing structured requirements.
You must return ONLY valid JSON with exactly the following 9 fields (no markdown fences, no explanatory text):
- objective (string)
- domain (string)
- requested_features (array of strings)
- expected_output (string)
- constraints (array of strings)
- data_requirements (array of strings)
- ui_requirements (array of strings)
- technical_requirements (array of strings)
- verification_requirements (array of strings)

Goal:
{goal}
"""

    system_instruction = "You are a requirements analyst that responds exclusively with raw JSON objects."

    # Attempt 1
    raw_response = model.generate_json(base_prompt, system=system_instruction)
    try:
        return _extract_and_normalize(raw_response)
    except (json.JSONDecodeError, ValueError) as err:
        logger.warning(
            "Goal parsing attempt 1 failed: %s. Raw model output:\n%s",
            err,
            raw_response,
        )

    # Attempt 2 (retry with corrective instruction)
    retry_prompt = (
        base_prompt
        + "\n\nCRITICAL: Your previous response was not valid JSON. Respond with raw JSON ONLY. Do not wrap in markdown fences or include explanations."
    )
    raw_response_2 = model.generate_json(retry_prompt, system=system_instruction)
    try:
        return _extract_and_normalize(raw_response_2)
    except (json.JSONDecodeError, ValueError) as err:
        logger.error(
            "Goal parsing attempt 2 failed: %s. Raw model output:\n%s",
            err,
            raw_response_2,
        )
        raise GoalParsingError("model returned invalid requirements") from err
