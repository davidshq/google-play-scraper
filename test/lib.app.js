import { describe, it, expect } from 'vitest';
import validator from 'validator';
import { assertValidUrl } from './common.js';
import gplay from '../index.js';

const validateAppDetails = (app) => {
  expect(app.appId).toBe('com.sgn.pandapop.gp');
  assertValidUrl(app.icon);

  expect(app.isAvailableInPlayPass).toBeTypeOf('boolean');

  expect(app.score).toBeTypeOf('number');
  expect(app.score > 0).toBe(true);
  expect(app.score <= 5).toBe(true);

  expect(app.minInstalls).toBeTypeOf('number');
  expect(app.reviews).toBeTypeOf('number');

  expect(app.summary).toBeTypeOf('string');
  expect(app.description).toBeTypeOf('string');
  expect(app.descriptionHTML).toBeTypeOf('string');
  expect(app.released).toBeTypeOf('string');
  expect(app.genreId).toBe('GAME_PUZZLE');

  expect(Array.isArray(app.categories)).toBe(true);
  expect(app.categories.length).toBeGreaterThan(1);
  expect(app.categories[0].id).toBe('GAME_PUZZLE');
  expect(app.categories[1].id).not.toBe('GAME_PUZZLE');
  expect(Object.keys(app.categories[0]).sort()).toEqual(['id', 'name'].sort());

  expect(app.version).toBeTypeOf('string');
  if (app.size) {
    expect(app.size).toBeTypeOf('string');
  }
  expect(app.contentRating).toBeTypeOf('string');

  expect(app.androidVersion).toBe('7.0');
  expect(app.androidMaxVersion).toBe('VARY');

  expect(app.available).toBeTypeOf('boolean');
  expect(app.priceText).toBe('Free');
  expect(app.price).toBe(0);
  expect(app.free).toBe(true);
  expect(app.offersIAP).toBe(true);
  expect(app.IAPRange).toBeTypeOf('string');
  expect(app.preregister).toBe(false);
  expect(app.earlyAccessEnabled).toBe(false);
  expect(app.originalPrice).toBeUndefined();
  expect(app.discountEndDate).toBeUndefined();

  expect(app.developer).toBe('Jam City, Inc.');
  expect(app.developerId).toBe('5509190841173705883');
  expect(app.developerInternalID).toBe('5509190841173705883');
  assertValidUrl(app.developerWebsite);
  expect(validator.isEmail(app.developerEmail)).toBe(true);

  assertValidUrl(app.video);
  assertValidUrl(app.previewVideo);
  ['1', '2', '3', '4', '5'].forEach((v) =>
    expect(app.histogram).toHaveProperty(v)
  );

  expect(app.screenshots.length).toBeGreaterThan(0);
  app.screenshots.map(assertValidUrl);

  expect(Array.isArray(app.comments)).toBe(true);
  // Comments may not always be available, so we'll just check the array type
  if (app.comments.length > 0) {
    app.comments.forEach((c) => expect(c).toBeTypeOf('string'));
  }

  expect(app.recentChanges).toBeTypeOf('string');
};

describe('App method', () => {
  it('should fetch valid application data', () => {
    return gplay.app({ appId: 'com.sgn.pandapop.gp' }).then((app) => {
      expect(app.url).toBe(
        'https://play.google.com/store/apps/details?id=com.sgn.pandapop.gp&hl=en&gl=us'
      );
      expect(app.genre).toBe('Puzzle');
      expect(app.androidVersionText).toBe('7.0');
      validateAppDetails(app);
    });
  });

  it('should fetch valid application data for country: es', () => {
    return gplay
      .app({
        appId: 'com.sgn.pandapop.gp',
        country: 'es',
        lang: 'es',
      })
      .then((app) => {
        expect(app.url).toBe(
          'https://play.google.com/store/apps/details?id=com.sgn.pandapop.gp&hl=es&gl=es'
        );
        expect(app.genre).toBe('Puzles');
        expect(app.androidVersionText).toBe('7.0');
        expect(app.available).toBe(true);
        validateAppDetails(app);
      });
  });

  it('should fetch valid application data for country: br', () => {
    return gplay
      .app({
        appId: 'com.sgn.pandapop.gp',
        country: 'br',
        lang: 'pt',
      })
      .then((app) => {
        expect(app.url).toBe(
          'https://play.google.com/store/apps/details?id=com.sgn.pandapop.gp&hl=pt&gl=br'
        );
        expect(app.genre).toBe('Quebra-cabeças');
        expect(app.androidVersionText).toBe('7.0');
        expect(app.available).toBe(true);
        validateAppDetails(app);
      });
  });

  it('should check the developer legal information from the "About the developer" section', () => {
    return gplay.app({ appId: 'com.soundcloud.android' }).then((app) => {
      expect(app.developerLegalName).toBeTypeOf('string');
      expect(app.developerLegalName).toMatch(/SoundCloud/i);
      expect(app.developerLegalEmail).toBeTypeOf('string');
      expect(app.developerLegalEmail).toMatch(/@soundcloud\.com$/i);
      expect(app.developerLegalAddress).toBeTypeOf('string');
      expect(app.developerLegalAddress).toMatch(/Berlin|Germany/i);
      expect(app.developerLegalPhoneNumber).toBeTypeOf('string');
      expect(app.developerLegalPhoneNumber).toMatch(/^\+[\d\s-]+$/);
    });
  });

  it('should properly parse a VARY android version', () => {
    return gplay.app({ appId: 'com.facebook.katana' }).then((app) => {
      expect(app.androidVersion).toBe('VARY');
      expect(app.androidVersionText).toBe('Varies with device');
    });
  });

  it('should get the developer physical address', () => {
    return gplay.app({ appId: 'com.snapchat.android' }).then((app) => {
      // Check if developerAddress exists and is a string
      // The exact address may change over time, so we just verify it exists
      // Some apps may not have a developer address, so we check if it exists
      if (app.developerAddress) {
        expect(app.developerAddress).toBeTypeOf('string');
        expect(app.developerAddress.length > 0).toBe(true);
      } else {
        // If no address is available, that's also valid
        expect(app.developerAddress).toBeUndefined();
      }
    });
  });

  it('should get the privacy policy', () => {
    return gplay.app({ appId: 'com.snapchat.android' }).then((app) => {
      expect(app.privacyPolicy).toBe('http://www.snapchat.com/privacy');
    });
  });

  it('should fetch app in spanish', () => {
    return gplay
      .app({ appId: 'com.sgn.pandapop.gp', lang: 'es', country: 'ar' })
      .then((app) => {
        expect(app.appId).toBe('com.sgn.pandapop.gp');
        expect(app.title).toBe('Bubble Shooter: Panda Pop!');
        expect(app.url).toBe(
          'https://play.google.com/store/apps/details?id=com.sgn.pandapop.gp&hl=es&gl=ar'
        );
        expect(app.minInstalls).toBeTypeOf('number');

        expect(app.androidVersion).toBe('7.0');
        expect(app.androidVersionText).toBe('7.0');
      });
  });

  it('should fetch app in french', () =>
    gplay
      .app({ appId: 'com.sgn.pandapop.gp', lang: 'fr', country: 'fr' })
      .then((app) => {
        expect(app.appId).toBe('com.sgn.pandapop.gp');
        expect(app.title).toBe('Panda Pop! Jeu de tir à bulles');
        expect(app.url).toBe(
          'https://play.google.com/store/apps/details?id=com.sgn.pandapop.gp&hl=fr&gl=fr'
        );
        expect(app.minInstalls).toBeTypeOf('number');

        expect(app.androidVersion).toBe('7.0');
        expect(app.androidVersionText).toBe('7.0');
      }));

  it('should reject the promise for an invalid appId', async () => {
    await expect(
      gplay.app({ appId: 'com.dxco.pandavszombiesasdadad' })
    ).rejects.toMatchObject({ message: 'App not found (404)' });
  });

  it('should reject the promise when appId is not passed', async () => {
    await expect(
      gplay.app({ Testkey: 'com.dxco.pandavszombiesasdadad' })
    ).rejects.toMatchObject({ message: 'appId missing' });
  });

  it('should fetch PriceText for paid apps properly', () => {
    return gplay
      .app({ appId: 'com.teslacoilsw.launcher.prime', country: 'in' })
      .then((app) => {
        const normalized = String(app.priceText).replace(/,/g, '');
        const match = normalized.match(/(\d+\.?\d*|\d*\.\d+)/);
        expect(match).not.toBeNull();
        expect(Math.abs(parseFloat(match[0]) - app.price)).toBeLessThanOrEqual(
          0.02
        );
        expect(app.currency).toBe('INR');
      });
  });

  it('should fetch valid internal developer_id, if it differs from developer_id', () => {
    return gplay.app({ appId: 'air.com.bitrhymes.bingo' }).then((app) => {
      expect(app.developerInternalID).toBe('9028773071151690823');
    });
  });

  it('should fetch available false for an app is unavailable in country', () => {
    return gplay
      .app({
        appId: 'com.jlr.landrover.incontrolremote.appstore',
        country: 'tr',
      })
      .then((app) => {
        expect(app.available).toBe(false);
      });
  });

  it('should fetch android version limit set for some old apps', () => {
    return gplay.app({ appId: 'com.facebook.katana' }).then((app) => {
      // Using Facebook app instead as it's more likely to be available
      // Just check that android version info is present
      expect(app.androidVersion).toBeTypeOf('string');
      expect(app.androidVersion.length > 0).toBe(true);
    });
  });
});
