import { describe, it, expect } from 'vitest';
import gplay from '../index.js';
import { assertValidApp, assertValidUrl } from './common.js';
import validator from 'validator';

describe('Developer method', () => {
  it('should fetch a valid application list for the given developer with string id', () => {
    return gplay
      .developer({ devId: 'Jam City, Inc.' })
      .then((apps) => apps.map(assertValidApp))
      .then((apps) =>
        apps.forEach((app) => expect(app.developer).toBe('Jam City, Inc.'))
      );
  });

  it('should fetch a valid application list for the given developer with numeric id', () => {
    return gplay
      .developer({ devId: '5700313618786177705' })
      .then((apps) => apps.map(assertValidApp))
      .then((apps) =>
        apps.forEach((app) => {
          if (app.developerId) {
            expect(app.developerId).toBe('5700313618786177705');
          }
        })
      );
  });

  it('should not throw an error if too many apps requested', () => {
    return gplay
      .developer({ devId: '5700313618786177705', num: 500 })
      .then((apps) => {
        // Just check that we get some apps, not a specific number
        // The number of available apps may change over time
        expect(apps.length > 0).toBe(true);
      });
  });

  it(
    'should fetch a valid application list with full detail',
    () => {
      return gplay
        .developer({ devId: '5700313618786177705', num: 10, fullDetail: true })
        .then((apps) => {
          apps.forEach((app) => {
            expect(app.minInstalls).toBeTypeOf('number');
            // IF APP IS NOT RELEASED
            // THIS MEANS THAT IT SHOULDN'T HAVE REVIEWS
            if (app.released) {
              expect(app.reviews).toBeTypeOf('number');
            }

            expect(app.description).toBeTypeOf('string');
            expect(app.descriptionHTML).toBeTypeOf('string');
            expect(app.updated).toBeTypeOf('number');

            expect(app).toHaveProperty('genre');
            expect(app).toHaveProperty('genreId');

            expect(app.version || '').toBeTypeOf('string');
            expect(app.size || '').toBeTypeOf('string');
            expect(app.androidVersionText).toBeTypeOf('string');
            expect(app.androidVersion).toBeTypeOf('string');
            expect(app.contentRating).toBeTypeOf('string');

            expect(app).toHaveProperty('priceText');
            expect(app).toHaveProperty('free');

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
          });
        });
    },
    15 * 1000
  );
});
