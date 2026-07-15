import { isZero, lte, gte, lt, gt, isString } from '.';

describe('lodash utils', () => {
  describe('isZero', () => {
    it('returns true for the number 0', () => {
      expect(isZero(0)).toBe(true);
    });

    it('returns true for the string "0"', () => {
      expect(isZero('0')).toBe(true);
    });

    it('returns true for the hex string "0x0"', () => {
      expect(isZero('0x0')).toBe(true);
    });

    it('returns true for an object whose toString is "0"', () => {
      expect(isZero({ toString: () => '0' })).toBe(true);
    });

    it('returns false for non-zero numbers', () => {
      expect(isZero(1)).toBe(false);
      expect(isZero(-1)).toBe(false);
    });

    it('returns false for non-zero strings', () => {
      expect(isZero('1')).toBe(false);
      expect(isZero('0x1')).toBe(false);
    });

    it('returns false for null and undefined', () => {
      expect(isZero(null)).toBe(false);
      expect(isZero(undefined)).toBe(false);
    });
  });

  describe('lte', () => {
    it('returns true when value is less than other', () => {
      expect(lte(1, 2)).toBe(true);
    });

    it('returns true when value equals other', () => {
      expect(lte(2, 2)).toBe(true);
    });

    it('returns false when value is greater than other', () => {
      expect(lte(3, 2)).toBe(false);
    });

    it('coerces numeric strings', () => {
      expect(lte('2' as unknown as number, '2' as unknown as number)).toBe(
        true,
      );
    });
  });

  describe('gte', () => {
    it('returns true when value is greater than other', () => {
      expect(gte(3, 2)).toBe(true);
    });

    it('returns true when value equals other', () => {
      expect(gte(2, 2)).toBe(true);
    });

    it('returns false when value is less than other', () => {
      expect(gte(1, 2)).toBe(false);
    });
  });

  describe('lt', () => {
    it('returns true when value is less than other', () => {
      expect(lt(1, 2)).toBe(true);
    });

    it('returns false when value equals other', () => {
      expect(lt(2, 2)).toBe(false);
    });

    it('returns false when value is greater than other', () => {
      expect(lt(3, 2)).toBe(false);
    });
  });

  describe('gt', () => {
    it('returns true when value is greater than other', () => {
      expect(gt(3, 2)).toBe(true);
    });

    it('returns false when value equals other', () => {
      expect(gt(2, 2)).toBe(false);
    });

    it('returns false when value is less than other', () => {
      expect(gt(1, 2)).toBe(false);
    });
  });

  describe('isString', () => {
    it('returns true for string primitives', () => {
      expect(isString('')).toBe(true);
      expect(isString('hello')).toBe(true);
    });

    it('returns true for String objects', () => {
      // eslint-disable-next-line no-new-wrappers
      expect(isString(new String('boxed'))).toBe(true);
    });

    it('returns false for non-string values', () => {
      expect(isString(1)).toBe(false);
      expect(isString(true)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString(['a'])).toBe(false);
    });
  });
});
