import { describe, it, expect } from 'vitest';
import gplay from '../index.js';

describe('Suggest method', () => {
  it('should return five suggestion for a common term', () =>
    gplay.suggest({ term: 'p' }).then((results) => {
      expect(results.length).toBe(5);
      results.forEach((r) => expect(r.toLowerCase()).toContain('p'));
    }));

  it('should return different results for different languages', () =>
    Promise.all([
      gplay.suggest({ term: 'p' }),
      gplay.suggest({ term: 'p', country: 'fr', lang: 'fr' }),
    ]).then(([resultsEn, resultsFr]) => {
      expect(resultsEn).not.toEqual(resultsFr);
    }));
});
