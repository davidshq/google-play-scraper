/**
 * Minimal Play-style HTML for {@link ../../lib/utils/scriptData.js} `parse()` so
 * {@link ../../lib/app.js} `MAPPINGS` can run without throwing. Used by memoized
 * tests with a mocked HTTP layer.
 */

function setDeep(arr, path, value) {
  let cur = arr;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    if (cur[k] == null) cur[k] = [];
    cur = cur[k];
  }
  cur[path[path.length - 1]] = value;
}

/**
 * Nested array at `ds:5[1][2]` (the usual app "search" blob).
 */
function buildSearchArray() {
  const s = [];
  const set = (path, v) => setDeep(s, path, v);

  set([0, 0], 'Fixture App');
  set([12, 0, 0, 1], 'Fixture description');
  set([72, 0, 1], '<p>Fixture description</p>');
  set([73, 0, 1], 'Short summary');
  set([13, 0], '1');
  set([13, 1], 1000);
  set([13, 2], 5000);
  set([51, 0, 1], 4.2);
  set([51, 0, 0], '4.2');
  set([51, 2, 1], 10000);
  set([51, 3, 1], 500);
  set([51, 1], {
    1: [null, 1],
    2: [null, 2],
    3: [null, 3],
    4: [null, 4],
    5: [null, 5],
  });
  set([57, 0, 0, 0, 0, 1, 0, 0], 0);
  set([57, 0, 0, 0, 0, 1, 0, 1], 'USD');
  set([57, 0, 0, 0, 0, 1, 0, 2], 'Free');
  set([18, 0], true);
  set([19, 0], 'None');
  set([140, 1, 1, 0, 0, 1], '8.0');
  set([140, 1, 1, 0, 1, 1], 'VARY');
  set([68, 0], 'Fixture Dev');
  set([68, 1, 4, 2], 'https://play.google.com/store/apps/dev?id=fixturedev');
  set([69, 1, 0], 'dev@example.com');
  set([69, 0, 5, 2], 'https://example.com');
  set([69, 4, 0], 'Fixture Legal');
  set([69, 4, 1, 0], 'legal@example.com');
  set([69, 4, 3], '+1 555-0100');
  set([99, 0, 5, 2], 'https://example.com/privacy');
  set([79, 0, 0, 0], 'Puzzle');
  set([79, 0, 0, 2], 'GAME_PUZZLE');
  set([95, 0, 3, 2], 'https://example.com/icon.png');
  set([96, 0, 3, 2], 'https://example.com/header.png');
  set([78, 0], []);
  set([100, 0, 0, 3, 2], 'https://example.com/v.mp4');
  set([100, 1, 0, 3, 2], 'https://example.com/vi.jpg');
  set([100, 1, 2, 0, 2], 'https://example.com/prev.mp4');
  set([9, 0], 'Everyone');
  set([9, 2, 1], 'Mild');
  set([48], false);
  set([10, 0], 'Jan 1, 2020');
  set([145, 0, 1, 0], 1700000000);
  set([140, 0, 0, 0], '1.0');
  set([144, 1, 1], 'Recent changes');
  set([62], null);

  return s;
}

/**
 * Full HTML document with one `AF_initDataCallback` block for `ds:5`.
 */
export function minimalAppPlayHtml() {
  const ds5 = [null, [null, null, buildSearchArray()]];
  const json = JSON.stringify(ds5);
  return `<!doctype html><html><body><script>AF_initDataCallback({key: 'ds:5', hash: '1', data:${json}, sideChannel: {}});</script></body></html>`;
}
