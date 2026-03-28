import { describe, it, expect } from 'vitest';
import gplay from '../index.js';
import { assertValidUrl } from './common.js';

function assertValidDataSafetyObject() {
  return (entry) => {
    expect(entry.data).toBeTypeOf('string');
    expect(entry.purpose).toBeTypeOf('string');
    expect(entry.type).toBeTypeOf('string');
    expect(entry.optional).toBeTypeOf('boolean');
  };
}

describe('Data Safety method', () => {
  it('should return arrays of data shared, data collected, security practices and a privacy url', () =>
    gplay.datasafety({ appId: 'com.sgn.pandapop.gp' }).then((dataSafety) => {
      expect(Array.isArray(dataSafety.sharedData)).toBe(true);
      expect(Array.isArray(dataSafety.collectedData)).toBe(true);
      expect(Array.isArray(dataSafety.securityPractices)).toBe(true);
      // privacyPolicyUrl might not always be available
      if (dataSafety.privacyPolicyUrl) {
        assertValidUrl(dataSafety.privacyPolicyUrl);
      }
    }));

  it('should return a valid shared and collected data object', () =>
    gplay.datasafety({ appId: 'com.sgn.pandapop.gp' }).then((dataSafety) => {
      dataSafety.sharedData.map(assertValidDataSafetyObject());
      dataSafety.collectedData.map(assertValidDataSafetyObject());
    }));

  it('should return a valid security practices object', () =>
    gplay.datasafety({ appId: 'com.sgn.pandapop.gp' }).then((dataSafety) => {
      dataSafety.securityPractices.forEach((practice) => {
        expect(practice.practice).toBeTypeOf('string');
        expect(practice.description).toBeTypeOf('string');
      });
    }));

  it('should return empty return for non existing app', () =>
    gplay.datasafety({ appId: 'app.foo.bar' }).then((dataSafety) => {
      expect(dataSafety.sharedData).toHaveLength(0);
      expect(dataSafety.collectedData).toHaveLength(0);
      expect(dataSafety.securityPractices).toHaveLength(0);
      expect(dataSafety.privacyPolicyUrl).toBeUndefined();
    }));
});
