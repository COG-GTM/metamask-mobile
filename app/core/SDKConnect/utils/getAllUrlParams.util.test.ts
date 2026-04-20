import getAllUrlParams, {
  getAllUrlParams as namedGetAllUrlParams,
} from './getAllUrlParams.util';

describe('getAllUrlParams', () => {
  it('returns an empty object when there is no query string', () => {
    expect(getAllUrlParams('https://example.com')).toEqual({});
  });

  it('parses a single query parameter', () => {
    expect(getAllUrlParams('https://example.com?foo=bar')).toEqual({
      foo: 'bar',
    });
  });

  it('parses multiple query parameters', () => {
    expect(getAllUrlParams('scheme://host?a=1&b=2&c=3')).toEqual({
      a: '1',
      b: '2',
      c: '3',
    });
  });

  it('stores undefined for bare keys without values', () => {
    const result = getAllUrlParams('https://example.com?flag');
    expect(result).toHaveProperty('flag');
    expect(result.flag).toBeUndefined();
  });

  it('exports the same function as default and named export', () => {
    expect(namedGetAllUrlParams).toBe(getAllUrlParams);
  });
});
