import { describe, it, expect } from 'vitest';
import gplay from '../index.js';
import { assertValidApp } from './common.js';

describe('Search method', () => {
  it('should fetch a valid application list', () => {
    return gplay
      .search({ term: 'Panda vs Zombies' })
      .then((apps) => apps.map(assertValidApp));
  });

  describe('additional properties', () => {
    it('should fetch a valid application list with developer property', () => {
      return gplay
        .search({
          term: 'com.google.android.gm',
        })
        .then((apps) =>
          apps.map((app) => expect(app.developer).toBeTypeOf('string'))
        );
    });

    it('should fetch a valid application list with developerId property', () => {
      return gplay
        .search({
          term: 'com.google.android.gm',
        })
        .then((apps) =>
          apps.map((app) => expect(app.developerId).toBeTypeOf('string'))
        );
    });
  });

  it('should filter by price when set to paid', () =>
    gplay.search({ term: 'game', num: 5, price: 'paid' }).then((apps) => {
      expect(apps.length).toBeGreaterThanOrEqual(1);
      const paidCount = apps.filter((app) => !app.free).length;
      expect(paidCount).toBeGreaterThanOrEqual(Math.ceil(apps.length / 2));
    }));

  it('should validate the results number', () => {
    const count = 5;
    return gplay
      .search({
        term: 'vr',
        num: count,
      })
      .then((apps) => {
        apps.map(assertValidApp);
        expect(apps.length).toBe(count);
      });
  });

  // preregister tend to have some fields missing, increasing chances of failure
  // by searching "preregister" we have more chances of getting some in the results
  it('should search for pre register', () =>
    gplay
      .search({ term: 'preregister', num: 10 })
      .then((apps) => apps.map(assertValidApp)));

  it(
    'should search for pre register with fullDetail',
    () =>
      gplay
        .search({ term: 'preregister', num: 10, fullDetail: true })
        .then((apps) => apps.map(assertValidApp)),
    5 * 1000
  );

  it('should fetch multiple pages of distinct results', () =>
    gplay.search({ term: 'p', num: 55 }).then((apps) => {
      expect(apps.length).toBeGreaterThanOrEqual(30);
      expect(apps.length).toBeLessThanOrEqual(55);
    }));

  it('should fetch multiple pages of when not starting from cluster of subsections', () =>
    gplay.search({ term: 'p', num: 65 }).then((apps) => {
      expect(apps.length).toBeGreaterThanOrEqual(30);
      expect(apps.length).toBeLessThanOrEqual(65);
    }));

  describe('country and language specific', () => {
    describe('without more results section', () => {
      it('should fetch a valid application list for eu country', () => {
        return gplay
          .search({ term: 'Panda vs Zombies', country: 'GH' })
          .then((apps) => apps.map(assertValidApp));
      });

      it('should fetch a valid application list for non eu country', () => {
        return gplay
          .search({ term: 'Facebook', country: 'GE' })
          .then((apps) => apps.map(assertValidApp));
      });

      it('should fetch a valid application list for eu country with specific language', () => {
        return gplay
          .search({ term: 'Panda vs Zombies', country: 'BE', lang: 'it' })
          .then((apps) => apps.map(assertValidApp));
      });
    });
  });

  describe('more results mapping', () => {
    it('should return few netflix apps', () => {
      return gplay.search({ term: 'netflix' }).then((apps) => {
        expect(apps.length).toBeGreaterThan(0);
        expect(
          apps.some((a) => a.title.toLowerCase().includes('netflix'))
        ).toBe(true);
      });
    });

    it('should return few netflix apps from german store with german language', () => {
      return gplay
        .search({ term: 'netflix', lang: 'de', country: 'DE' })
        .then((apps) => {
          expect(apps.length).toBeGreaterThan(1);
          expect(
            apps.some((a) => a.title.toLowerCase().includes('netflix'))
          ).toBe(true);
        });
    });

    it('should return few google mail apps', () => {
      return gplay.search({ term: 'gmail' }).then((apps) => {
        expect(
          apps.some(
            (a) =>
              a.appId === 'com.google.android.gm' ||
              a.appId === 'com.google.android.gm.lite'
          )
        ).toBe(true);
      });
    });

    it('should return apps for search with a category as query', () => {
      return gplay.search({ term: 'games' }).then((apps) => {
        expect(apps.length).toBeGreaterThan(0);
        apps.forEach(assertValidApp);
        expect(
          apps.some((a) =>
            /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(a.appId)
          )
        ).toBe(true);
      });
    });

    it('should return empty set when no results found', () => {
      return gplay
        .search({ term: 'asdasdyxcnmjysalsaflaslf' })
        .then((apps) => expect(apps).toHaveLength(0));
    });

    it('should return empty set when no results found in eu country store', () => {
      return gplay
        .search({ term: 'ASyyDASDyyASDASD', country: 'DE', lang: 'SP' })
        .then((apps) => expect(apps).toHaveLength(0));
    });

    it('should return empty set when no results found in us store with other language', () => {
      return gplay
        .search({ term: 'ASyyDASDyyASDASD', country: 'US', lang: 'FR' })
        .then((apps) => expect(apps).toHaveLength(0));
    });
  });

  describe('suggested search', () => {
    it('should return apps from suggested search', () => {
      return gplay.search({ term: 'runing app' }).then((apps) => {
        expect(apps.length).toBeGreaterThanOrEqual(2);
        apps.forEach(assertValidApp);
        const ids = apps.map((a) => a.appId.toLowerCase());
        expect(
          ids.some(
            (id) =>
              id.includes('run') ||
              id.includes('fitness') ||
              id.includes('track')
          )
        ).toBe(true);
      });
    });

    it('should return apps from suggested search in european country', () => {
      return gplay
        .search({ term: 'runing tracker', country: 'GR' })
        .then((apps) => {
          expect(apps.length).toBeGreaterThanOrEqual(1);
          apps.forEach(assertValidApp);
          const ids = apps.map((a) => a.appId.toLowerCase());
          expect(
            ids.some((id) => id.includes('run') || id.includes('track'))
          ).toBe(true);
        });
    });
  });
});
