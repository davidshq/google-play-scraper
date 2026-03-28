import { describe, it, expect } from 'vitest';
import helper from '../lib/utils/mappingHelpers.js';

describe('mappingHelpers', () => {
  describe('normalizeAndroidVersion', () => {
    it('returns VARY for empty input', () => {
      expect(helper.normalizeAndroidVersion()).toBe('VARY');
      expect(helper.normalizeAndroidVersion('')).toBe('VARY');
    });

    it('returns leading numeric token when present', () => {
      expect(helper.normalizeAndroidVersion('8.0 and up')).toBe('8.0');
    });

    it('returns VARY when the first token is not numeric', () => {
      expect(helper.normalizeAndroidVersion('Varies with device')).toBe('VARY');
    });
  });

  describe('extractDeveloperId', () => {
    it('returns empty string for null or non-string', () => {
      expect(helper.extractDeveloperId(null)).toBe('');
      expect(helper.extractDeveloperId(1)).toBe('');
    });

    it('parses id query param from Play developer links', () => {
      expect(
        helper.extractDeveloperId('/store/apps/developer?id=Acme&hl=en')
      ).toBe('Acme');
    });
  });

  describe('priceText', () => {
    it('returns Free for falsy values', () => {
      expect(helper.priceText()).toBe('Free');
      expect(helper.priceText('')).toBe('Free');
    });

    it('passes through non-empty strings', () => {
      expect(helper.priceText('$1.99')).toBe('$1.99');
    });
  });

  describe('buildHistogram', () => {
    it('returns zeros when container is missing', () => {
      expect(helper.buildHistogram(null)).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      });
    });

    it('maps bucket counts from the Play container shape', () => {
      const container = {
        1: [0, 10],
        2: [0, 20],
        3: [0, 30],
        4: [0, 40],
        5: [0, 50],
      };
      expect(helper.buildHistogram(container)).toEqual({
        1: 10,
        2: 20,
        3: 30,
        4: 40,
        5: 50,
      });
    });
  });

  describe('descriptionText', () => {
    it('converts br tags to line breaks before stripping HTML', () => {
      expect(helper.descriptionText('a<br>b')).toContain('a');
      expect(helper.descriptionText('a<br>b')).toContain('b');
    });
  });
});
