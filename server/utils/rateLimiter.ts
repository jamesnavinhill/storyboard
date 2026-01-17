export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitState {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

interface BucketState {
  count: number;
  resetAt: number;
}

export const createRateLimiter = (options: RateLimiterOptions) => {
  const windowMs = Math.max(1, Math.floor(options.windowMs));
  const maxRequests = Math.max(1, Math.floor(options.maxRequests));
  const buckets = new Map<string, BucketState>();

  const consume = (key: string): RateLimitState => {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      const resetAt = now + windowMs;
      buckets.set(key, { count: 1, resetAt });
      return {
        ok: true,
        remaining: Math.max(0, maxRequests - 1),
        resetAt,
        retryAfterMs: 0,
      };
    }

    if (bucket.count >= maxRequests) {
      return {
        ok: false,
        remaining: 0,
        resetAt: bucket.resetAt,
        retryAfterMs: Math.max(0, bucket.resetAt - now),
      };
    }

    bucket.count += 1;
    return {
      ok: true,
      remaining: Math.max(0, maxRequests - bucket.count),
      resetAt: bucket.resetAt,
      retryAfterMs: 0,
    };
  };

  return { consume };
};
