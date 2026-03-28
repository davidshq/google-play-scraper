import { describe, it, expect } from 'vitest';
import gplay from '../index.js';
import * as R from 'ramda';

describe('Categories method', () => {
  it('should fetch valid list of categories', () => {
    return gplay.categories().then((categories) => {
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length > 0).toBe(true);
    });
  });

  it('should have all categories from constant list of categories', () => {
    return gplay.categories().then((categories) => {
      const categoriesConst = Object.keys(gplay.category);
      expect(R.difference(categories, categoriesConst)).toEqual([]);
    });
  });
});
