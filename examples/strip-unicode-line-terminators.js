/**
 * Replace U+2028/U+2029 so JSON written to disk does not trip editors that flag
 * “LS/PS line terminators” inside string values.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
export function stripUnicodeLineTerminators(value) {
  if (typeof value === 'string') {
    return value.replaceAll('\u2028', '\n').replaceAll('\u2029', '\n');
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(stripUnicodeLineTerminators);
  }
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, stripUnicodeLineTerminators(v)])
  );
}
