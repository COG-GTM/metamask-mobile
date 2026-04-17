import {
  tlc,
  capitalize,
  toLowerCaseEquals,
  shallowEqual,
  renderShortText,
  getURLProtocol,
  isIPFSUri,
  deepJSONParse,
  getUniqueList,
  findRouteNameFromNavigatorState,
} from './index';

describe('general utils', () => {
  describe('tlc', () => {
    it('lowercases a string', () => {
      expect(tlc('HELLO')).toBe('hello');
    });
    it('returns undefined for undefined', () => {
      expect(tlc(undefined)).toBeUndefined();
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });
    it('returns false for empty string', () => {
      expect(capitalize('')).toBe(false);
    });
  });

  describe('toLowerCaseEquals', () => {
    it('returns true for matching strings', () => {
      expect(toLowerCaseEquals('Hello', 'hello')).toBe(true);
    });
    it('returns false for non-matching strings', () => {
      expect(toLowerCaseEquals('Hello', 'world')).toBe(false);
    });
    it('returns false for both undefined', () => {
      expect(toLowerCaseEquals(undefined, undefined)).toBe(false);
    });
  });

  describe('shallowEqual', () => {
    it('returns true for equal objects', () => {
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });
    it('returns false for different values', () => {
      expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
    });
    it('returns false for different keys', () => {
      expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });
  });

  describe('renderShortText', () => {
    it('returns full text if short enough', () => {
      expect(renderShortText('short')).toBe('short');
    });
    it('truncates long text', () => {
      const long = '0x1234567890abcdef1234567890abcdef';
      const result = renderShortText(long, 4);
      expect(result).toContain('...');
      expect(result.length).toBeLessThan(long.length);
    });
    it('handles undefined gracefully', () => {
      expect(renderShortText(undefined)).toBeUndefined();
    });
  });

  describe('getURLProtocol', () => {
    it('returns http for http url', () => {
      expect(getURLProtocol('http://example.com')).toBe('http');
    });
    it('returns https for https url', () => {
      expect(getURLProtocol('https://example.com')).toBe('https');
    });
    it('returns empty string for empty input', () => {
      expect(getURLProtocol('')).toBe('');
    });
  });

  describe('isIPFSUri', () => {
    it('returns true for /ipfs/ uri', () => {
      expect(isIPFSUri('/ipfs/QmTest123')).toBe(true);
    });
    it('returns true for ipfs:// uri', () => {
      expect(isIPFSUri('ipfs://QmTest123')).toBe(true);
    });
    it('returns false for https uri', () => {
      expect(isIPFSUri('https://example.com')).toBe(false);
    });
    it('returns false for empty', () => {
      expect(isIPFSUri('')).toBe(false);
    });
    it('returns false for null', () => {
      expect(isIPFSUri(null)).toBe(false);
    });
  });

  describe('deepJSONParse', () => {
    it('parses simple JSON', () => {
      const result = deepJSONParse({ jsonString: '{"a": 1}' });
      expect(result).toEqual({ a: 1 });
    });
    it('parses nested stringified JSON', () => {
      const result = deepJSONParse({
        jsonString: '{"a": "{\\"b\\": 2}"}',
      });
      expect(result).toEqual({ a: { b: 2 } });
    });
    it('skips numbers by default', () => {
      const result = deepJSONParse({ jsonString: '{"a": "123"}' });
      expect(result).toEqual({ a: '123' });
    });
  });

  describe('getUniqueList', () => {
    it('returns unique items from single array', () => {
      expect(getUniqueList([1, 2, 2, 3])).toEqual([1, 2, 3]);
    });
    it('returns unique items from multiple arrays', () => {
      expect(getUniqueList([1, 2], [2, 3])).toEqual([1, 2, 3]);
    });
    it('throws for no arguments', () => {
      expect(() => getUniqueList()).toThrow();
    });
    it('throws for non-array argument', () => {
      expect(() => getUniqueList('not an array')).toThrow(TypeError);
    });
  });

  describe('findRouteNameFromNavigatorState', () => {
    it('returns route name from simple state', () => {
      const routes = [{ name: 'Settings' }];
      expect(findRouteNameFromNavigatorState(routes)).toBe('Settings');
    });
    it('maps Main to WalletView', () => {
      const routes = [{ name: 'Main' }];
      expect(findRouteNameFromNavigatorState(routes)).toBe('WalletView');
    });
    it('maps Home to WalletView', () => {
      const routes = [{ name: 'Home' }];
      expect(findRouteNameFromNavigatorState(routes)).toBe('WalletView');
    });
    it('maps TransactionsHome to TransactionsView', () => {
      const routes = [{ name: 'TransactionsHome' }];
      expect(findRouteNameFromNavigatorState(routes)).toBe('TransactionsView');
    });
  });
});
