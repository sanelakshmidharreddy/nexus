"""Single interface for calling the local Ollama model.

This is the only file that interacts with the LLM provider.
"""

import os
import requests

DEFAULT_MODEL = "qwen2.5:7b-instruct"
DEFAULT_HOST = "http://localhost:11434"


class ModelConnectionError(Exception):
    """Raised when Ollama local model service is unreachable."""
    pass


def get_configured_model() -> str:
    """Return configured model name from OLLAMA_MODEL environment variable."""
    return os.environ.get("OLLAMA_MODEL", DEFAULT_MODEL)


def get_ollama_host() -> str:
    """Return configured host URL from OLLAMA_HOST environment variable."""
    return os.environ.get("OLLAMA_HOST", DEFAULT_HOST).rstrip("/")


def generate_json(prompt: str, system: str = "") -> str:
    """Send prompt to local Ollama model and return the raw text response.
    
    Uses format='json' and stream=False to ensure structured JSON output.
    """
    host = get_ollama_host()
    model = get_configured_model()
    url = f"{host}/api/generate"

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }
    if system:
        payload["system"] = system

    timeout = int(os.environ.get("OLLAMA_TIMEOUT", "15"))
    try:
        response = requests.post(url, json=payload, timeout=timeout)
        response.raise_for_status()
        data = response.json()
        return data.get("response", "")
    except requests.RequestException as e:
        raise ModelConnectionError(f"Local model unreachable: {e}") from e


def is_ollama_enabled() -> bool:
    """Return whether Ollama integration is enabled via environment."""
    return os.environ.get("OLLAMA_ENABLED", "true").lower() in ("true", "1", "yes")


def check_connection() -> tuple[bool, str]:
    """Check if the local Ollama host is reachable.
    
    Returns (is_reachable, model_name).
    When Ollama is disabled or in demo mode without a custom host,
    uses a tight timeout to prevent blocking health checks.
    """
    model = get_configured_model()
    if not is_ollama_enabled():
        return False, model

    host = get_ollama_host()
    # If DEMO_MODE is active and OLLAMA_HOST is the default localhost, probe with a fast timeout
    timeout = float(os.environ.get("OLLAMA_PROBE_TIMEOUT", "1.5"))
    try:
        response = requests.get(f"{host}/api/tags", timeout=timeout)
        response.raise_for_status()
        return True, model
    except requests.RequestException:
        return False, model
