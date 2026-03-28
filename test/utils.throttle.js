import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import throttled from '../lib/utils/throttle.js';

describe('Throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('limits concurrent executions and spaces them by interval (no network)', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const req = throttled(fn, { limit: 1, interval: 1000 });

    const p1 = req();
    const p2 = req();
    const p3 = req();

    await vi.runAllTimersAsync();

    const results = await Promise.all([p1, p2, p3]);

    expect(results).toEqual(['ok', 'ok', 'ok']);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
