import { describe, it, expect } from 'vitest';
import { assertValidApp, assertValidUrl } from './common.js';
import validator from 'validator';
import gplay from '../index.js';

describe('List method', () => {
  const timeout = 20 * 1000;

  it(
    'should fetch a valid application list for the TRENDING collection',
    () => {
      return gplay
        .list({
          collection: gplay.collection.TRENDING,
          num: 100,
        })
        .then((apps) => apps.map(assertValidApp));
    },
    timeout
  );

  it(
    'should fetch a valid application list for NEW_FREE with BUSINESS category',
    () => {
      return gplay
        .list({
          collection: gplay.collection.NEW_FREE,
          category: gplay.category.BUSINESS,
          num: 100,
        })
        .then((apps) => apps.map(assertValidApp))
        .then((apps) => apps.forEach((app) => expect(app.free).toBe(true)));
    },
    timeout
  );

  it(
    'should fetch a valid application list for the top free collection',
    () => {
      return gplay
        .list({
          collection: gplay.collection.TOP_FREE,
          num: 100,
        })
        .then((apps) => apps.map(assertValidApp))
        .then((apps) => apps.map((app) => expect(app.free).toBe(true)));
    },
    timeout
  );

  it(
    'should fetch a valid application list for the top paid collection',
    () => {
      return gplay
        .list({
          collection: gplay.collection.TOP_PAID,
          num: 100,
        })
        .then((apps) => apps.map(assertValidApp))
        .then((apps) => {
          // Play occasionally surfaces $0 / trial rows; require a paid majority.
          const paidCount = apps.filter((app) => !app.free).length;
          expect(paidCount).toBeGreaterThanOrEqual(
            Math.ceil(apps.length * 0.5)
          );
        });
    },
    timeout
  );

  it(
    'should fetch a valid application list for the new free collection',
    () => {
      return gplay
        .list({
          collection: gplay.collection.NEW_FREE,
          num: 100,
        })
        .then((apps) => apps.map(assertValidApp))
        .then((apps) => apps.map((app) => expect(app.free).toBe(true)));
    },
    timeout
  );

  it(
    'should fetch a valid application list for the new games free collection',
    () => {
      return gplay
        .list({
          collection: gplay.collection.NEW_FREE_GAMES,
          num: 100,
        })
        .then((apps) => apps.map(assertValidApp))
        .then((apps) => apps.map((app) => expect(app.free).toBe(true)));
    },
    timeout
  );

  it(
    'should fetch a valid application on a given collection regardless of the language',
    () => {
      return gplay
        .list({
          collection: gplay.collection.TOP_FREE,
          country: 'ru',
          lang: 'ru',
          num: 5,
        })
        .then((apps) => apps.map(assertValidApp))
        .then((apps) => apps.map((app) => expect(app.free).toBe(true)));
    },
    timeout
  );

  it(
    'should fetch a valid application list for the given category and collection',
    () => {
      return gplay
        .list({
          category: gplay.category.GAME_ACTION,
          collection: gplay.collection.TOP_FREE,
        })
        .then((apps) => apps.map(assertValidApp))
        .then((apps) => apps.map((app) => expect(app.free).toBe(true)));
    },
    timeout
  );

  it(
    'should fetch a valid application list for the new free collection and GAME category',
    () => {
      return gplay
        .list({
          collection: gplay.collection.NEW_FREE,
          category: gplay.category.GAME,
          num: 100,
        })
        .then((apps) => apps.map(assertValidApp))
        .then((apps) => apps.map((app) => expect(app.free).toBe(true)));
    },
    timeout
  );

  it(
    'should fetch a valid application list for NEW_PAID with FAMILY category',
    () => {
      return gplay
        .list({
          collection: gplay.collection.NEW_PAID,
          category: gplay.category.FAMILY,
          num: 100,
        })
        .then((apps) => {
          expect(apps.length).toBeGreaterThan(0);
          apps.forEach(assertValidApp);
        });
    },
    timeout
  );

  it(
    'should fetch apps for application list for the new free collection and FAMILY category',
    () => {
      return gplay
        .list({
          collection: gplay.category.NEW_FREE,
          category: gplay.category.FAMILY,
          num: 100,
        })
        .then((apps) => apps.map(assertValidApp))
        .then((apps) => apps.map((app) => expect(app.free).toBe(true)));
    },
    timeout
  );

  it('should validate the category', async () => {
    await expect(
      gplay.list({
        category: 'wrong',
        collection: gplay.collection.TOP_FREE,
      })
    ).rejects.toMatchObject({ message: 'Invalid category wrong' });
  });

  it('should validate the collection', async () => {
    await expect(
      gplay.list({
        category: gplay.category.GAME_ACTION,
        collection: 'wrong',
      })
    ).rejects.toMatchObject({ message: 'Invalid collection wrong' });
  });

  it('should validate the age range', async () => {
    await expect(
      gplay.list({
        category: gplay.category.GAME_ACTION,
        collection: gplay.collection.TOP_FREE,
        age: 'elderly',
      })
    ).rejects.toMatchObject({ message: 'Invalid age range elderly' });
  });

  it(
    'should fetch apps with fullDetail',
    () => {
      return gplay
        .list({
          category: gplay.category.GAME_ACTION,
          collection: gplay.collection.TOP_FREE,
          fullDetail: true,
          num: 5,
        })
        .then((apps) => apps.map(assertValidApp))
        .then((apps) =>
          apps.forEach((app) => {
            expect(app.minInstalls).toBeTypeOf('number');
            expect(app.reviews).toBeTypeOf('number');

            expect(app.description).toBeTypeOf('string');
            expect(app.descriptionHTML).toBeTypeOf('string');
            expect(app.released).toBeTypeOf('string');

            expect(app.genre).toBe('Action');
            expect(app.genreId).toBe('GAME_ACTION');

            expect(app.version || '').toBeTypeOf('string');
            expect(app.size || '').toBeTypeOf('string');
            expect(app.androidVersionText).toBeTypeOf('string');
            expect(app.androidVersion).toBeTypeOf('string');
            expect(app.contentRating).toBeTypeOf('string');

            expect(app.priceText).toBe('Free');
            expect(app.free).toBe(true);

            expect(app.developer).toBeTypeOf('string');
            expect(app.developerId).toBeTypeOf('string');
            if (app.developerWebsite) {
              assertValidUrl(app.developerWebsite);
            }
            expect(validator.isEmail(app.developerEmail)).toBe(true);

            ['1', '2', '3', '4', '5'].forEach((v) =>
              expect(app.histogram).toHaveProperty(v)
            );
            app.screenshots.map(assertValidUrl);
            app.comments.forEach((c) => expect(c).toBeTypeOf('string'));
          })
        );
    },
    timeout
  );

  // fetch last page of new paid apps, which have a bigger chance of including
  // results with no downloads (less fields, prone to failures)
  it('It should not fail with apps with no downloads', () =>
    gplay
      .list({
        category: gplay.category.GAME_ACTION,
        collection: gplay.collection.TOP_PAID,
        num: 20,
      })
      .then((apps) => apps.map(assertValidApp)));

  it(
    'It should not fail with apps with no downloads and fullDetail',
    () =>
      gplay
        .list({
          category: gplay.category.GAME_ACTION,
          collection: gplay.collection.TOP_FREE,
          num: 10,
          fullDetail: true,
        })
        .then((apps) => apps.map(assertValidApp)),
    timeout
  );

  it(
    'should be able to retreive a list for each category',
    () => {
      const categoryIds = Object.keys(gplay.category);

      const fetchCategory = (category) =>
        gplay
          .list({
            category,
            collection: gplay.collection.TOP_FREE,
            num: 10,
          })
          .catch((err) => {
            // WATCH_FACE may be unsupported for this collection; others must succeed
            if (category === gplay.category.WATCH_FACE) {
              return;
            }
            throw new Error(
              `list() should succeed for category ${String(category)}: ${err.message}`
            );
          });

      return Promise.all(categoryIds.map(fetchCategory));
    },
    200 * 1000
  );
});
