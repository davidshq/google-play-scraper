import requestLib from 'got';
import throttled from '../lib/utils/throttle.js';
import { describe, it, expect } from 'vitest';

describe('Throttle tests', () => {
  const url = 'https://yesno.wtf/api';

  it('Should make three requests with 2000ms interval. (Throttle function)', () => {
    const req = throttled(requestLib, {
      limit: 1,
      interval: 2000,
    });
    return Promise.all([req({ url }), req({ url }), req({ url })])
      .then((response) =>
        response.map((req) => new Date(req.headers.date).getTime())
      )
      .then((dates) => {
        const firstAndSecondReq = dates[1] - dates[0];
        const secondAndThirdReq = dates[2] - dates[1];

        expect(firstAndSecondReq).toBeGreaterThanOrEqual(1000);
        expect(firstAndSecondReq).toBeLessThanOrEqual(3000);
        expect(secondAndThirdReq).toBeGreaterThanOrEqual(1000);
        expect(secondAndThirdReq).toBeLessThanOrEqual(3000);
      });
  }, 6000);
});
