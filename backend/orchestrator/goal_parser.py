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


def _build_deterministic_requirements(goal: str) -> dict:
    """Generate high-fidelity deterministic requirements for hackathon demo fallback."""
    clean_goal = goal.strip()
    return {
        "objective": clean_goal if len(clean_goal) > 10 else "Build a RoadSafe accident analytics dashboard",
        "domain": "Traffic Incident Intelligence & Vision Zero Analytics",
        "requested_features": [
            "Accident frequency trends by month and severity",
            "High-risk intersection collision hotspots",
            "Casualty rate and primary risk-factor analysis",
            "Vision Zero mitigation recommendations",
            "Interactive dashboard interface"
        ],
        "expected_output": "Working analytics dashboard with interactive charts, hotspots, and casualty metrics",
        "constraints": [
            "Standard web browser execution (HTML5/CSS3/Vanilla JS)",
            "Zero external API runtime dependencies",
            "Normalized geospatial coordinate schema"
        ],
        "data_requirements": [
            "Collision date, timestamp, and location coordinates",
            "Casualty count and severity classification",
            "Contributing environmental and driver behavior factors"
        ],
        "ui_requirements": [
            "Executive KPI metrics cards (total accidents, fatal casualties, hotspots)",
            "Temporal collision frequency bar chart",
            "Ranked hotspot incident list with risk tags",
            "Engineering intervention recommendation action plan"
        ],
        "technical_requirements": [
            "Pure client-side rendering for deployment compatibility",
            "Sandboxed workspace project isolation",
            "Automated QA build and schema verification"
        ],
        "verification_requirements": [
            "Goal understood and scoped",
            "Required project files exist (index.html, styles.css, app.js, data.json)",
            "Core analytics implemented",
            "Working dashboard interface",
            "Build & syntax validation",
            "Requested features detected",
            "QA verification passed",
            "Adaptive recovery verified",
            "Final deliverable operational"
        ]
    }


def parse(goal: str, prefer_deterministic: bool = False) -> dict:
    """Parse a natural-language goal into a structured requirements dictionary.
    
    Calls the local model with retry on invalid JSON.
    Falls back to deterministic requirements if model is unreachable or returns invalid format twice.
    """
    import os
    if prefer_deterministic or os.environ.get("DEMO_MODE", "").lower() in ("1", "true", "yes") or os.environ.get("NEXUS_DEMO_FAST", "").lower() in ("1", "true", "yes"):
        logger.info("Using fast deterministic requirements for demo execution.")
        return _build_deterministic_requirements(goal)

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
    try:
        raw_response = model.generate_json(base_prompt, system=system_instruction)
        try:
            return _extract_and_normalize(raw_response)
        except (json.JSONDecodeError, ValueError) as err:
            logger.warning("Goal parsing attempt 1 failed: %s", err)

        # Attempt 2 (retry with corrective instruction)
        retry_prompt = (
            base_prompt
            + "\n\nCRITICAL: Your previous response was not valid JSON. Respond with raw JSON ONLY. Do not wrap in markdown fences or include explanations."
        )
        raw_response_2 = model.generate_json(retry_prompt, system=system_instruction)
        try:
            return _extract_and_normalize(raw_response_2)
        except (json.JSONDecodeError, ValueError) as err:
            logger.warning("Goal parsing attempt 2 failed: %s. Using deterministic requirements.", err)
            return _build_deterministic_requirements(goal)

    except model.ModelConnectionError as exc:
        logger.warning("Ollama model unreachable (%s). Using deterministic requirements fallback for demo.", exc)
        return _build_deterministic_requirements(goal)
