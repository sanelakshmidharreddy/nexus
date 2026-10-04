"""Multi-provider LLM interface for NEXUS: OmniRoute, Gemini, Anthropic, Ollama, and Offline Demo.

Supports:
- OmniRoute (OpenAI-compatible gateway via OMNIROUTE_BASE_URL and OMNIROUTE_API_KEY)
- Gemini (via google.genai or REST API with GEMINI_API_KEY)
- Anthropic (via REST API with ANTHROPIC_API_KEY)
- Ollama (via local HTTP with OLLAMA_HOST / OLLAMA_MODEL)
- Offline deterministic fallback (clearly labelled demo mode)
"""

import json
import logging
import os
import re
import time
import requests

logger = logging.getLogger("nexus.model")

DEFAULT_OMNIROUTE_MODEL = "ddgw/gpt-5.4-mini"
DEFAULT_OLLAMA_MODEL = "qwen2.5:7b-instruct"
DEFAULT_OLLAMA_HOST = "http://localhost:11434"
DEFAULT_GEMINI_MODEL = "gemini-3.8-flash"


class ModelConnectionError(Exception):
    """Raised when the configured LLM provider service is unreachable."""
    pass


class ModelRateLimitError(Exception):
    """Raised when the LLM provider returns rate limit (429)."""
    pass


def get_llm_provider() -> str:
    """Return active LLM provider: 'omniroute', 'gemini', 'anthropic', 'ollama', or 'offline'."""
    explicit = os.environ.get("LLM_PROVIDER", "").strip().lower()
    if explicit:
        return explicit
    if os.environ.get("OMNIROUTE_API_KEY") or os.environ.get("OMNIROUTE_BASE_URL"):
        return "omniroute"
    if os.environ.get("GEMINI_API_KEY"):
        return "gemini"
    if os.environ.get("ANTHROPIC_API_KEY"):
        return "anthropic"
    if os.environ.get("OLLAMA_HOST"):
        return "ollama"
    return "omniroute"


def get_configured_model() -> str:
    """Return model name for the active provider."""
    provider = get_llm_provider()
    if provider == "omniroute":
        return os.environ.get("OMNIROUTE_MODEL", DEFAULT_OMNIROUTE_MODEL)
    if provider == "gemini":
        return os.environ.get("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)
    if provider == "anthropic":
        return os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    return os.environ.get("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL)


def get_ollama_host() -> str:
    """Return configured host URL from OLLAMA_HOST environment variable."""
    return os.environ.get("OLLAMA_HOST", DEFAULT_OLLAMA_HOST).rstrip("/")


def clean_json_text(raw: str) -> str:
    """Extract valid JSON from markdown fences or text wrappers."""
    cleaned = raw.strip()
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if fence_match:
        cleaned = fence_match.group(1).strip()
    
    start_brace = cleaned.find("{")
    start_bracket = cleaned.find("[")
    if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
        end_brace = cleaned.rfind("}")
        if end_brace != -1:
            cleaned = cleaned[start_brace:end_brace + 1]
    elif start_bracket != -1:
        end_bracket = cleaned.rfind("]")
        if end_bracket != -1:
            cleaned = cleaned[start_bracket:end_bracket + 1]

    cleaned = re.sub(r",\s*([\]}])", r"\1", cleaned)
    return cleaned.strip()


def call_omniroute(prompt: str, system: str = "") -> str:
    """Send chat completion request to OmniRoute OpenAI-compatible gateway with 1 retry on 429/timeout."""
    base_url = os.environ.get("OMNIROUTE_BASE_URL", "http://localhost:20128/v1").rstrip("/")
    api_key = os.environ.get("OMNIROUTE_API_KEY", "").strip()
    model_name = get_configured_model()

    chat_url = f"{base_url}/chat/completions" if base_url.endswith("/v1") else f"{base_url}/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": 0.2,
    }

    # Attempt call with 1 retry on 429 or timeout
    max_attempts = 2
    for attempt in range(1, max_attempts + 1):
        try:
            res = requests.post(chat_url, headers=headers, json=payload, timeout=25)
            if res.status_code == 429:
                if attempt < max_attempts:
                    logger.warning("OmniRoute rate limit (429) hit, retrying in 1.5s...")
                    time.sleep(1.5)
                    continue
                raise ModelRateLimitError("OmniRoute rate limit exceeded (429). Please try again in a moment.")
            
            res.raise_for_status()
            data = res.json()
            choices = data.get("choices", [])
            if choices and "message" in choices[0] and "content" in choices[0]["message"]:
                return choices[0]["message"]["content"]
            raise ModelConnectionError(f"OmniRoute returned unexpected response schema: {data}")
        except requests.Timeout:
            if attempt < max_attempts:
                logger.warning("OmniRoute timeout, retrying once...")
                time.sleep(1.0)
                continue
            raise ModelConnectionError("OmniRoute request timed out after retry.")
        except requests.RequestException as e:
            if attempt < max_attempts and getattr(e.response, "status_code", None) == 429:
                time.sleep(1.5)
                continue
            raise ModelConnectionError(f"OmniRoute connection failed: {e}")


def call_gemini(prompt: str, system: str = "") -> str:
    """Call Google Gemini using google.genai SDK or REST API."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ModelConnectionError("GEMINI_API_KEY not configured")

    model_name = get_configured_model()
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        full_prompt = f"System Instruction: {system}\n\nTask:\n{prompt}" if system else prompt
        response = client.models.generate_content(
            model=model_name,
            contents=full_prompt,
        )
        return response.text or ""
    except Exception as e:
        logger.warning(f"google.genai call failed ({e}), attempting Gemini REST fallback...")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {"parts": [{"text": f"{system}\n\n{prompt}" if system else prompt}]}
            ]
        }
        res = requests.post(url, headers=headers, json=payload, timeout=30)
        res.raise_for_status()
        data = res.json()
        candidates = data.get("candidates", [])
        if candidates and "content" in candidates[0]:
            parts = candidates[0]["content"].get("parts", [])
            if parts:
                return parts[0].get("text", "")
        raise ModelConnectionError(f"Gemini returned unexpected structure: {data}")


def call_anthropic(prompt: str, system: str = "") -> str:
    """Call Anthropic Claude API via REST."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise ModelConnectionError("ANTHROPIC_API_KEY not configured")

    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": get_configured_model(),
        "max_tokens": 4096,
        "system": system or "You are an expert AI software architect and developer.",
        "messages": [{"role": "user", "content": prompt}],
    }
    res = requests.post(url, headers=headers, json=payload, timeout=40)
    res.raise_for_status()
    data = res.json()
    content = data.get("content", [])
    if content and "text" in content[0]:
        return content[0]["text"]
    raise ModelConnectionError(f"Anthropic returned unexpected structure: {data}")


def call_ollama(prompt: str, system: str = "") -> str:
    """Send prompt to local Ollama model."""
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

    timeout = int(os.environ.get("OLLAMA_TIMEOUT", "30"))
    res = requests.post(url, json=payload, timeout=timeout)
    res.raise_for_status()
    data = res.json()
    return data.get("response", "")


def generate_text(prompt: str, system: str = "") -> str:
    """Dispatch prompt to configured LLM provider."""
    provider = get_llm_provider()
    if provider == "omniroute":
        return call_omniroute(prompt, system)
    elif provider == "gemini":
        return call_gemini(prompt, system)
    elif provider == "anthropic":
        return call_anthropic(prompt, system)
    elif provider == "ollama":
        return call_ollama(prompt, system)
    else:
        raise ModelConnectionError(f"Unknown provider '{provider}'")


def generate_json(prompt: str, system: str = "") -> str:
    """Generate structured text from LLM and return raw JSON string."""
    sys_instruction = (
        (system + "\n\n") if system else ""
    ) + "IMPORTANT: Output ONLY valid, parseable JSON. Do not include conversational commentary."
    raw = generate_text(prompt, system=sys_instruction)
    return clean_json_text(raw)


def check_connection() -> tuple[bool, str, str]:
    """Check connectivity to configured LLM provider.
    
    Returns (is_reachable, model_name, provider_name).
    """
    provider = get_llm_provider()
    model_name = get_configured_model()

    if provider == "omniroute":
        base_url = os.environ.get("OMNIROUTE_BASE_URL", "http://localhost:20128/v1").rstrip("/")
        api_key = os.environ.get("OMNIROUTE_API_KEY", "").strip()
        if not api_key:
            return False, model_name, "omniroute (missing key)"
        try:
            models_url = f"{base_url}/models" if base_url.endswith("/v1") else f"{base_url}/v1/models"
            res = requests.get(models_url, headers={"Authorization": f"Bearer {api_key}"}, timeout=2.5)
            return (res.status_code == 200), model_name, "omniroute"
        except Exception:
            return False, model_name, "omniroute (unreachable)"

    if provider == "gemini":
        key = os.environ.get("GEMINI_API_KEY", "")
        if not key:
            return False, model_name, "gemini (missing key)"
        return True, model_name, "gemini"

    if provider == "anthropic":
        key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not key:
            return False, model_name, "anthropic (missing key)"
        return True, model_name, "anthropic"

    if provider == "ollama":
        host = get_ollama_host()
        timeout = float(os.environ.get("OLLAMA_PROBE_TIMEOUT", "1.5"))
        try:
            res = requests.get(f"{host}/api/tags", timeout=timeout)
            res.raise_for_status()
            return True, model_name, "ollama"
        except Exception:
            return False, model_name, "ollama (unreachable)"

    return False, "deterministic-demo", "offline-demo"
