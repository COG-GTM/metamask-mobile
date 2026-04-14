import { getAllUrlParams } from './getAllUrlParams.util';

describe('getAllUrlParams', () => {
  it('should parse query parameters from URL', () => {
    const result = getAllUrlParams('https://example.com?foo=bar&baz=qux');
    expect(result).toEqual({ foo: 'bar', baz: 'qux' });
  });

  it('should return empty object for URL without query string', () => {
    const result = getAllUrlParams('https://example.com');
    expect(result).toEqual({});
  });

  it('should handle single parameter', () => {
    const result = getAllUrlParams('https://example.com?key=value');
    expect(result).toEqual({ key: 'value' });
  });

  it('should handle empty query string', () => {
    const result = getAllUrlParams('https://example.com?');
    expect(result).toEqual({});
  });
});
