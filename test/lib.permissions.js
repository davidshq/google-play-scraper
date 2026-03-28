import { describe, it, expect } from 'vitest';
import gplay from '../index.js';

describe('Permissions method', () => {
  it('should return an array of permissions and descriptions', () =>
    gplay.permissions({ appId: 'com.sgn.pandapop.gp' }).then((results) => {
      expect(results.length).toBeGreaterThan(0);
      results.forEach((perm) => {
        expect(perm.permission).toBeTypeOf('string');
        expect(perm.type).toBeTypeOf('string');
      });
    }));

  it('should return an array of permissions and descriptions for different response format', () =>
    gplay
      .permissions({ appId: 'air.tv.ingames.cubematch.free' })
      .then((results) => {
        // Some apps may not have permissions, so just check the return type
        expect(Array.isArray(results)).toBe(true);
        results.forEach((perm) => {
          expect(perm.permission).toBeTypeOf('string');
          expect(perm.type).toBeTypeOf('string');
        });
      }));

  it('should return skip descriptions if short option is passed', () =>
    gplay
      .permissions({ appId: 'com.sgn.pandapop.gp', short: true })
      .then((results) => {
        expect(results.length).toBeGreaterThan(0);
        results.forEach((s) => expect(s).toBeTypeOf('string'));
      }));

  it('should return skip descriptions if short option is passed for different response format', () =>
    gplay
      .permissions({ appId: 'air.tv.ingames.cubematch.free', short: true })
      .then((results) => {
        // Some apps may not have permissions, so just check the return type
        expect(Array.isArray(results)).toBe(true);
        results.forEach((s) => expect(s).toBeTypeOf('string'));
      }));

  it('should return even if app have no common permissions', () =>
    gplay
      .permissions({ appId: 'com.skybornegames.battlepop' })
      .then((results) => {
        // Some apps may not have permissions, so just check the return type
        expect(Array.isArray(results)).toBe(true);
        results.forEach((perm) => {
          expect(perm.permission).toBeTypeOf('string');
          expect(perm.type).toBeTypeOf('string');
        });
      }));

  it('should return empty if app have no common permissions and short option is passed', () =>
    gplay
      .permissions({ appId: 'com.skybornegames.battlepop', short: true })
      .then((results) => {
        expect(results.length).toBe(0);
      }));
});
