// Retry only explicit model failures: the backend rolls back these transactions.
// A network timeout or generic gateway error cannot confirm whether saving occurred.
export async function withModelRetry<T>(
  operation: () => Promise<T>,
  onRetry: () => void,
  options = { maxAttempts: 16, maxWaitMs: 10 * 60_000, delayMs: 15_000 },
): Promise<T> {
  const started = Date.now();
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { code?: string } } })?.response;
      const retryable = (response?.status === 502 || response?.status === 503)
        && (response.data?.code === "ML_CONNECTION" || response.data?.code === "ML_UPSTREAM_ERROR");
      if (!retryable || attempt >= options.maxAttempts
          || Date.now() - started + options.delayMs >= options.maxWaitMs) throw error;
      onRetry();
      await new Promise(resolve => setTimeout(resolve, options.delayMs));
    }
  }
}
