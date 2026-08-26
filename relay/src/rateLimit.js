class TokenBucket {
  constructor({ limit, windowMs, now = () => Date.now() }) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.now = now;
    this.tokens = limit;
    this.updatedAt = now();
    this.lastUsedAt = this.updatedAt;
  }

  consume() {
    const current = this.now();
    this.lastUsedAt = current;
    const elapsed = Math.max(0, current - this.updatedAt);
    this.tokens = Math.min(
      this.limit,
      this.tokens + (elapsed * this.limit) / this.windowMs
    );
    this.updatedAt = current;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

function createRateLimiter(options) {
  return new TokenBucket(options);
}

module.exports = { TokenBucket, createRateLimiter };
