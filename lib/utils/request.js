import requestLib from 'got';
import throttled from './throttle.js';
import { CookieJar } from 'tough-cookie';
import createDebug from 'debug';

const cookieJar = new CookieJar();
const debug = createDebug('google-play-scraper');

/** One throttled client per `limit` so the sliding window applies across requests, not per call. */
const throttledRequestByLimit = new Map();

function getThrottledRequest(limit) {
  let wrapped = throttledRequestByLimit.get(limit);
  if (!wrapped) {
    wrapped = throttled(requestLib, {
      interval: 1000,
      limit,
    });
    throttledRequestByLimit.set(limit, wrapped);
  }
  return wrapped;
}

/**
 * Map legacy Got v11-style options to shapes and names Got ≥12 accepts.
 * Applies to merged options (including user `requestOptions`).
 * @param {Record<string, unknown>} opts
 */
function normalizeLegacyGotOptions(opts) {
  if (typeof opts.timeout === 'number') {
    opts.timeout = { request: opts.timeout };
  }
  if (typeof opts.retry === 'number') {
    opts.retry = { limit: opts.retry };
  }
  if (Object.hasOwn(opts, 'followAllRedirects')) {
    if (!Object.hasOwn(opts, 'followRedirect')) {
      opts.followRedirect = opts.followAllRedirects;
    }
    delete opts.followAllRedirects;
  }
}

function doRequest(opts, limit) {
  let req;

  normalizeLegacyGotOptions(opts);

  // cookies are necessary for pagination to work consistently across requests
  opts.cookieJar = cookieJar;

  if (limit) {
    req = getThrottledRequest(limit);
  } else {
    req = requestLib;
  }

  return new Promise((resolve, reject) => {
    req(opts)
      .then((response) => resolve(response.body))
      .catch((error) => reject(error));
  });
}

async function request(opts, limit) {
  debug('Making request: %j', opts);
  try {
    const response = await doRequest(opts, limit);
    debug('Request finished');
    return response;
  } catch (reason) {
    const reasonMsg =
      reason != null && typeof reason.message === 'string'
        ? reason.message
        : String(reason);
    debug(
      'Request error:',
      reasonMsg,
      reason &&
        typeof reason === 'object' &&
        reason.response &&
        reason.response.statusCode
    );

    let message = 'Error requesting Google Play:' + reasonMsg;
    if (
      reason &&
      typeof reason === 'object' &&
      reason.response &&
      reason.response.statusCode === 404
    ) {
      message = 'App not found (404)';
    }
    const err = Error(message);
    err.status =
      reason &&
      typeof reason === 'object' &&
      reason.response &&
      reason.response.statusCode;
    throw err;
  }
}

export default request;
