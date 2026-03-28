import { describe, it, expect } from 'vitest';
import scriptData from '../lib/utils/scriptData.js';

describe('scriptData', () => {
  describe('parseServiceRequests', () => {
    it('parses AF_dataServiceRequests object literal (sandboxed vm)', () => {
      const html =
        "pre; var AF_dataServiceRequests = {'ds:3':{'nested':true}}; var AF_initDataChunkQueue";
      expect(scriptData.parseServiceRequests(html)).toEqual({
        'ds:3': { nested: true },
      });
    });

    it('returns {} when the blob is not valid object literal syntax', () => {
      const html =
        'pre; var AF_dataServiceRequests = {broken; var AF_initDataChunkQueue';
      expect(scriptData.parseServiceRequests(html)).toEqual({});
    });
  });

  describe('parse', () => {
    it('returns {} when no AF_initDataCallback scripts are present', () => {
      expect(scriptData.parse('<html></html>')).toEqual({});
    });

    it('extracts ds:* keys and JSON data from AF_initDataCallback blocks', () => {
      const payload = { hello: 'world', n: 42 };
      const html = `<html><script>AF_initDataCallback({key: 'ds:7', hash: 'x', data:${JSON.stringify(
        payload
      )}, sideChannel: {}});</script></html>`;
      const out = scriptData.parse(html);
      expect(out['ds:7']).toEqual(payload);
      expect(out.serviceRequestData).toEqual({});
    });
  });

  describe('extractor', () => {
    it('reads array specs as Ramda paths', () => {
      const data = { a: { b: [10, 20, 30] } };
      const ex = scriptData.extractor([['a', 'b', 2]]);
      expect(ex(data)).toEqual([30]);
    });

    it('invokes object specs with path + fun', () => {
      const data = { x: { y: 3 } };
      const ex = scriptData.extractor([
        { path: ['x', 'y'], fun: (n) => n * 2 },
      ]);
      expect(ex(data)).toEqual([6]);
    });

    it('uses fallbackPath when primary path is missing', () => {
      const data = { only: { here: 'ok' } };
      const ex = scriptData.extractor([
        {
          path: ['missing'],
          fallbackPath: ['only', 'here'],
          fun: (s) => s.toUpperCase(),
        },
      ]);
      expect(ex(data)).toEqual(['OK']);
    });
  });

  describe('extractDataWithServiceRequestId', () => {
    it('prefixes path with the matching service request key', () => {
      const parsedData = {
        serviceRequestData: {
          'ds:4': { id: 'other' },
          'ds:9': { id: 'wanted' },
        },
        'ds:9': { items: [1, 2, 3] },
      };
      const spec = { useServiceRequestId: 'wanted', path: ['items', 1] };
      expect(scriptData.extractDataWithServiceRequestId(parsedData, spec)).toBe(
        2
      );
    });

    it('falls back to spec.path when no service id matches', () => {
      const parsedData = {
        serviceRequestData: {},
        flat: { leaf: 'x' },
      };
      const spec = { useServiceRequestId: 'nope', path: ['flat', 'leaf'] };
      expect(scriptData.extractDataWithServiceRequestId(parsedData, spec)).toBe(
        'x'
      );
    });
  });
});
