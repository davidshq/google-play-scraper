import { describe, it, expect, vi, beforeEach } from 'vitest';
import gplay from '../index.js';
import { minimalAppPlayHtml } from './fixtures/minimalAppPlayHtml.js';

const { mockRequest } = vi.hoisted(() => {
  const mockRequest = vi.fn();
  return { mockRequest };
});

vi.mock('../lib/utils/request.js', () => ({
  default: mockRequest,
}));

describe('memoized()', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRequest.mockResolvedValue(minimalAppPlayHtml());
  });

  it('returns the public API plus memoized app and wrapped methods', () => {
    const m = gplay.memoized({ maxAge: 60 * 1000, max: 100 });
    expect(m.app).toBeTypeOf('function');
    expect(m.search).toBeTypeOf('function');
    expect(m.list).toBeTypeOf('function');
    expect(m.memoized).toBeUndefined();
  });

  it('caches app() so identical options hit the HTTP layer once', async () => {
    const m = gplay.memoized({ maxAge: 60 * 1000, max: 100 });
    const opts = { appId: 'com.fixture.app' };
    const [a, b] = await Promise.all([m.app(opts), m.app(opts)]);
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(a.appId).toBe('com.fixture.app');
    expect(b.appId).toBe('com.fixture.app');
    expect(a.title).toBe(b.title);
  });

  it('does not share cache with the non-memoized default export', async () => {
    const m = gplay.memoized({ maxAge: 60 * 1000, max: 100 });
    await m.app({ appId: 'com.cache.split' });
    await gplay.app({ appId: 'com.cache.split' });
    expect(mockRequest.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
