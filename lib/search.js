import * as R from 'ramda';
import url from 'url';
import request from './utils/request.js';
import { BASE_URL } from './constants.js';
import { processFullDetailApps, checkFinished } from './utils/processPages.js';
import scriptData from './utils/scriptData.js';
import helper from './utils/mappingHelpers.js';

/*
 * Make the first search request as in the browser and call `checkfinished` to
 * process the next pages.
 */
function initialRequest(opts) {
  // Use /store/search for price filter support (free/paid/all). /work/search ignores price.
  function skipClusterPage(html) {
    const match = html.match(
      /href="(\/store\/apps\/collection\/search_collection_more_results_cluster[^"]*)"/
    );
    if (match) {
      const innerUrl = BASE_URL + match[0].split('"')[1];
      return request(
        Object.assign({ url: innerUrl }, opts.requestOptions),
        opts.throttle
      );
    }
    return html;
  }

  const searchUrl = `${BASE_URL}/store/search?c=apps&q=${opts.term}&hl=${opts.lang}&gl=${opts.country}&price=${opts.price}`;
  return request(
    Object.assign({ url: searchUrl }, opts.requestOptions),
    opts.throttle
  )
    .then(skipClusterPage)
    .then((html) => processFirstPage(html, opts, [], INITIAL_MAPPINGS));
}

async function processFirstPage(html, opts, savedApps, mappings) {
  if (R.is(String, html)) {
    html = scriptData.parse(html);
  }

  // Store search (ds:4) uses different structure than work search (ds:1)
  const sections = R.path(mappings.sections, html) || [];
  if (noResultsFound(sections, opts)) return [];

  const moreResultsSection = sections.filter((s) => isMoreSection(s))[0];
  const appsSection = R.path(mappings.apps, html);
  const tokenSection = sections.filter((s) => isTokenSection(s))[0];

  let processedApps;
  let token;

  if (
    moreResultsSection &&
    R.path(STORE_SECTIONS_MAPPING.apps, moreResultsSection)
  ) {
    // Store search structure (ds:4): apps in section[22][0], token at ds:4[1][0]
    const storeApps =
      R.path(STORE_SECTIONS_MAPPING.apps, moreResultsSection) || [];
    processedApps = R.map(scriptData.extractor(STORE_APP_MAPPING), storeApps);
    token =
      R.path(STORE_SECTIONS_MAPPING.token, moreResultsSection) ||
      R.path(['ds:4', 1, 0], html);
  } else if (appsSection) {
    // Work search structure (ds:1): flat apps array
    processedApps = R.map(scriptData.extractor(WORK_APP_MAPPING), appsSection);
    token = R.path(SECTIONS_MAPPING.token, tokenSection);
  } else {
    return savedApps;
  }

  const apps = opts.fullDetail
    ? await processFullDetailApps(processedApps, opts)
    : processedApps;

  return checkFinished(opts, [...savedApps, ...apps], token);
}

function isTokenSection(section) {
  const sectionToken =
    R.is(Array, section) && R.path(SECTIONS_MAPPING.token, section);
  return R.is(String, sectionToken);
}

function isMoreSection(section) {
  const apps = R.path(STORE_SECTIONS_MAPPING.apps, section);
  return Array.isArray(apps) && apps.length > 0;
}

function noResultsFound(sections, opts) {
  if (!sections || sections.length === 0) return true;
  const noResult = sections.some((s) => {
    const msg = R.path(STORE_SECTIONS_MAPPING.noResults, s);
    return R.is(String, msg) && opts?.plainTerm && msg.includes(opts.plainTerm);
  });
  return noResult;
}

/** Store search (ds:4): section[22][0]=apps, section[22][1][3][1]=token */
const STORE_SECTIONS_MAPPING = {
  apps: [22, 0],
  token: [22, 1, 3, 1],
  noResults: [25, 0, 0, 0, 1],
};

/** Store app: nested structure with [0][3]=title, [0][0][0]=appId */
const STORE_APP_MAPPING = {
  title: [0, 3],
  appId: [0, 0, 0],
  url: {
    path: [0, 10, 4, 2],
    fun: (path) => (path ? new url.URL(path, BASE_URL).toString() : ''),
  },
  icon: [0, 1, 3, 2],
  developer: [0, 14],
  developerId: {
    path: [0, 14, 1, 4, 2],
    fun: (path) =>
      path
        ? helper.extractDeveloperId(new url.URL(path, BASE_URL).toString())
        : '',
  },
  currency: [0, 8, 1, 0, 1],
  price: {
    path: [0, 8, 1, 0, 0],
    fun: (p) => (typeof p === 'number' ? p / 1000000 : 0),
  },
  free: {
    path: [0, 8, 1, 0, 0],
    fun: (p) => p === 0 || p === undefined,
  },
  summary: [0, 13, 1],
  scoreText: [0, 4, 0],
  score: [0, 4, 1],
};

/** Work search (ds:1): flat structure */
const WORK_APP_MAPPING = {
  title: [2],
  appId: [12, 0],
  url: {
    path: [9, 4, 2],
    fun: (path) => new url.URL(path, BASE_URL).toString(),
  },
  icon: [1, 1, 0, 3, 2],
  developer: [4, 0, 0, 0],
  developerId: {
    path: [4, 0, 0, 1, 4, 2],
    fun: helper.extractDeveloperId,
  },
  currency: [7, 0, 3, 2, 1, 0, 1],
  price: {
    path: [7, 0, 3, 2, 1, 0, 0],
    fun: (p) => (typeof p === 'number' ? p / 1000000 : 0),
  },
  free: {
    path: [7, 0, 3, 2, 1, 0, 0],
    fun: (p) => p === 0,
  },
  summary: [4, 1, 1, 1, 1],
  scoreText: [6, 0, 2, 1, 0],
  score: [6, 0, 2, 1, 1],
};

const INITIAL_MAPPINGS = {
  apps: ['ds:1', 0, 1, 0, 0, 0],
  sections: ['ds:4', 0, 1],
};

const SECTIONS_MAPPING = {
  token: [1],
};

function getPriceGoogleValue(value) {
  switch (value.toLowerCase()) {
    case 'free':
      return 1;
    case 'paid':
      return 2;
    case 'all':
    default:
      return 0;
  }
}

/**
 * @param _appMethod Injected from index for API parity; full detail is loaded in
 *   processFirstPage / processPages via processFullDetailApps (no second pass).
 */
function search(_appMethod, opts) {
  return new Promise(function (resolve, reject) {
    if (!opts || !opts.term) {
      throw Error('Search term missing');
    }

    if (opts.num && opts.num > 250) {
      throw Error("The number of results can't exceed 250");
    }

    const plainTerm = opts.term;
    opts = {
      term: encodeURIComponent(opts.term),
      plainTerm,
      lang: opts.lang || 'en',
      country: opts.country || 'us',
      num: opts.num || 20,
      fullDetail: opts.fullDetail,
      price: opts.price ? getPriceGoogleValue(opts.price) : 0,
      throttle: opts.throttle,
      cache: opts.cache,
      requestOptions: opts.requestOptions,
    };

    initialRequest(opts).then(resolve).catch(reject);
  });
}

export default search;
