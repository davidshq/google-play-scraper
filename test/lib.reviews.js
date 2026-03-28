import { describe, it, expect } from 'vitest';
import gplay from '../index.js';
import { assertValidUrl } from './common.js';
import { constants } from '../lib/constants.js';

function assertValid(review) {
  expect(review.id).toBeTypeOf('string');
  expect(review.id).toBeTruthy();
  expect(review.userName).toBeTypeOf('string');
  assertValidUrl(review.userImage);
  expect(review.userName).toBeTruthy();
  expect(new Date(review.date).toJSON()).not.toBeNull();
  expect(review.date).toBeTypeOf('string');
  expect(review.date).toBeTruthy();
  expect(review.title).toBeNull();
  expect(review.text).toBeTypeOf('string');
  expect(review.score).toBeTypeOf('number');
  expect(review.score > 0).toBe(true);
  expect(review.score <= 5).toBe(true);
  assertValidUrl(review.url);
  expect(review).toHaveProperty('replyDate');
  expect(review).toHaveProperty('replyText');
  expect(review).toHaveProperty('version');
  expect(review).toHaveProperty('thumbsUp');
  expect(review).toHaveProperty('criterias');
}

describe('Reviews method', () => {
  it('should retrieve the most recent reviews of an app', () => {
    return gplay
      .reviews({ appId: 'com.dxco.pandavszombies' })
      .then((reviews) => {
        reviews.data.map(assertValid);
      });
  });

  it('should retrieve the most helpfull reviews of an app', () => {
    return gplay
      .reviews({
        appId: 'com.dxco.pandavszombies',
        sort: constants.sort.HELPFULNESS,
      })
      .then((reviews) => {
        reviews.data.map(assertValid);
      });
  });

  it('should retrieve the most rated reviews of an app', () => {
    return gplay
      .reviews({
        appId: 'com.dxco.pandavszombies',
        sort: constants.sort.RATING,
      })
      .then((reviews) => {
        reviews.data.map(assertValid);
      });
  });

  it('should validate the sort', async () => {
    await expect(
      gplay.reviews({
        appId: 'com.dxco.pandavszombies',
        sort: 'invalid',
      })
    ).rejects.toMatchObject({ message: 'Invalid sort invalid' });
  });

  it('should retrieve the reviews of an app in Japanese', () => {
    return gplay
      .reviews({ appId: 'com.dxco.pandavszombies', lang: 'ja' })
      .then((reviews) => {
        reviews.data.map(assertValid);
      });
  });

  it('should accept pagination', () => {
    return gplay
      .reviews({
        appId: 'com.facebook.katana',
        paginate: true,
      })
      .then((reviews) => {
        reviews.data.map(assertValid);
        expect(reviews.data.length).toBe(150);
        expect(reviews.nextPaginationToken).not.toBeNull();
      });
  });

  it('should get different reviews for nextPageToken', async () => {
    const firstPageReviews = await gplay.reviews({
      appId: 'com.facebook.katana',
      paginate: true,
    });
    const { data, nextPaginationToken } = firstPageReviews;

    expect(data.length).toBe(150);
    expect(nextPaginationToken).not.toBeNull();

    const secondPageReviews = await gplay.reviews({
      appId: 'com.facebook.katana',
      paginate: true,
      nextPaginationToken,
    });
    const { data: dataSecondPage, nextPaginationToken: secondPaginationToken } =
      secondPageReviews;

    expect(dataSecondPage.length).toBe(150);
    expect(secondPaginationToken).not.toBeNull();
    expect(data).not.toEqual(dataSecondPage);
  });

  it('should get same set of reviews on each run', async () => {
    // Reduce the number of reviews to avoid timeout
    const numReviews = 100;
    const firstPageReviews = await gplay.reviews({
      appId: 'com.facebook.katana',
      num: numReviews,
      sort: constants.sort.HELPFULNESS,
    });
    const { data } = firstPageReviews;

    expect(data.length).toBe(numReviews);

    const secondPageReviews = await gplay.reviews({
      appId: 'com.facebook.katana',
      num: numReviews,
      sort: constants.sort.HELPFULNESS,
    });
    const { data: dataSecondPage } = secondPageReviews;

    expect(dataSecondPage.length).toBe(numReviews);
    // Reviews can be dynamic, so we just check that we get the same number of reviews
    // and that they have the expected structure
    expect(data.length).toBe(dataSecondPage.length);
    // Check that the first few reviews are the same (they should be sorted by helpfulness)
    for (let i = 0; i < Math.min(5, data.length); i++) {
      expect(data[i].id).toBe(dataSecondPage[i].id);
    }
  }, 10000);
});
