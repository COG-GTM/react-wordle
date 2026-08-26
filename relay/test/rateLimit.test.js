const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter } = require('../src/rateLimit');

test('token bucket allows its limit and refills over time', () => {
  let now = 0;
  const limiter = createRateLimiter({
    limit: 2,
    windowMs: 1000,
    now: () => now,
  });
  assert.equal(limiter.consume(), true);
  assert.equal(limiter.consume(), true);
  assert.equal(limiter.consume(), false);
  now = 500;
  assert.equal(limiter.consume(), true);
  assert.equal(limiter.consume(), false);
  now = 1000;
  assert.equal(limiter.consume(), true);
});
