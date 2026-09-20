/**
 * Resilient Health Check & Connection Service for NEXUS.
 * Implements CONNECTING -> RETRYING -> CONNECTED state machine
 * with AbortController timeouts and cold-start wake-up retry logic.
 */

export async function checkHealthWithRetry({
  apiBase,
  timeoutMs = 8000,
  maxRetries = 3,
  onStateChange = () => {},
}) {
  if (!apiBase) {
    onStateChange({
      state: 'UNCONFIGURED',
      message: 'VITE_API_URL is not configured for production deployment.',
      attempt: 0,
      maxRetries,
    });
    return {
      ok: false,
      errorType: 'UNCONFIGURED',
      message: 'VITE_API_URL environment variable is missing in production.',
    };
  }

  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;
    const isRetry = attempt > 1;

    onStateChange({
      state: isRetry ? 'RETRYING' : 'CONNECTING',
      attempt,
      maxRetries: maxRetries + 1,
      message: isRetry
        ? `Waking backend service (attempt ${attempt} of ${maxRetries + 1})...`
        : 'Connecting to NEXUS orchestrator backend...',
    });

    const startTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${apiBase}/health`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timer);

      const latency = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        onStateChange({
          state: 'CONNECTED',
          attempt,
          maxRetries,
          data,
          latency,
          message: data.model_reachable
            ? 'Connected to NEXUS backend (Ollama active)'
            : 'Connected to NEXUS backend (Deterministic fallback active)',
        });
        return {
          ok: true,
          data,
          latency,
        };
      }

      // 502, 503, 504 are classic Render boot/wake-up status codes
      const isGatewayWake = [502, 503, 504].includes(response.status);
      if (isGatewayWake && attempt <= maxRetries) {
        const delay = Math.min(2000 * attempt, 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(`Server returned status ${response.status}`);
    } catch (err) {
      clearTimeout(timer);
      const isAbort = err.name === 'AbortError';

      if (attempt <= maxRetries) {
        // Wait before next retry (e.g. 2s, 3s, 4s)
        const delay = Math.min(2000 * attempt, 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Max retries exceeded
      const finalMsg = isAbort
        ? `Connection timed out after ${timeoutMs / 1000}s while contacting ${apiBase}`
        : `Unable to reach ${apiBase} (${err.message || 'network error'})`;

      onStateChange({
        state: 'UNREACHABLE',
        attempt,
        maxRetries,
        message: finalMsg,
        rawError: err,
      });

      return {
        ok: false,
        errorType: 'UNREACHABLE',
        message: finalMsg,
        rawError: err,
      };
    }
  }

  return {
    ok: false,
    errorType: 'UNREACHABLE',
    message: 'Max retry attempts exhausted.',
  };
}
