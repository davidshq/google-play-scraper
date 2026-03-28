import { expect } from 'vitest';
import validator from 'validator';

function assertValidUrl(url) {
  expect(validator.isURL(url, { allow_protocol_relative_urls: true })).toBe(
    true
  );
}

function assertValidApp(app) {
  expect(app.appId).toBeTypeOf('string');
  expect(app.title).toBeTypeOf('string');
  expect(app.summary).toBeTypeOf('string');
  assertValidUrl(app.url);
  assertValidUrl(app.icon);

  if (app.score !== undefined) {
    // would fail for new apps without score
    expect(app.score).toBeTypeOf('number');
    expect(app.score >= 0).toBe(true);
    expect(app.score <= 5).toBe(true);
  }

  expect(app.free).toBeTypeOf('boolean');

  // Pre-register and some edge listings omit or reshape price copy; only assert when present.
  if (app.priceText !== undefined) {
    expect(app.priceText).toBeTypeOf('string');
  }

  return app;
}

function assertIdsInArray(apps, ...ids) {
  expect(ids.every((id) => apps.some((app) => app.appId === id))).toBe(true);
}

export { assertValidUrl, assertValidApp, assertIdsInArray };
