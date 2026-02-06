import { isZero, lte, gte, lt, gt, isString } from './index';

describe('lodash utilities', () => {
  describe('isZero', () => {
    it('returns true for number 0', () => {
      expect(isZero(0)).toBe(true);
    });

    it('returns true for string "0"', () => {
      expect(isZero('0')).toBe(true);
    });

    it('returns true for hex string "0x0"', () => {
      expect(isZero('0x0')).toBe(true);
    });

    it('returns false for non-zero numbers', () => {
      expect(isZero(1)).toBe(false);
      expect(isZero(-1)).toBe(false);
      expect(isZero(100)).toBe(false);
    });

    it('returns false for non-zero strings', () => {
      expect(isZero('1')).toBe(false);
      expect(isZero('0x1')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isZero(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isZero(undefined)).toBe(false);
    });

    it('handles objects with toString method', () => {
      const obj = { toString: () => '0' };
      expect(isZero(obj)).toBe(true);
    });
  });

  describe('lte (less than or equal)', () => {
    it('returns true when value is less than other', () => {
      expect(lte(1, 2)).toBe(true);
    });

    it('returns true when value equals other', () => {
      expect(lte(2, 2)).toBe(true);
    });

    it('returns false when value is greater than other', () => {
      expect(lte(3, 2)).toBe(false);
    });

    it('handles negative numbers', () => {
      expect(lte(-1, 0)).toBe(true);
      expect(lte(-2, -1)).toBe(true);
    });

    it('handles decimal numbers', () => {
      expect(lte(1.5, 1.6)).toBe(true);
      expect(lte(1.5, 1.5)).toBe(true);
    });
  });

  describe('gte (greater than or equal)', () => {
    it('returns true when value is greater than other', () => {
      expect(gte(3, 2)).toBe(true);
    });

    it('returns true when value equals other', () => {
      expect(gte(2, 2)).toBe(true);
    });

    it('returns false when value is less than other', () => {
      expect(gte(1, 2)).toBe(false);
    });

    it('handles negative numbers', () => {
      expect(gte(0, -1)).toBe(true);
      expect(gte(-1, -2)).toBe(true);
    });
  });

  describe('lt (less than)', () => {
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

  describe('gt (greater than)', () => {
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
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
    });

    it('returns true for String objects', () => {
      // eslint-disable-next-line no-new-wrappers
      expect(isString(new String('hello'))).toBe(true);
    });

    it('returns false for numbers', () => {
      expect(isString(123)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isString(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isString(undefined)).toBe(false);
    });

    it('returns false for arrays', () => {
      expect(isString(['a', 'b'])).toBe(false);
    });

    it('returns false for objects', () => {
      expect(isString({ value: 'test' })).toBe(false);
    });

    it('returns false for booleans', () => {
      expect(isString(true)).toBe(false);
      expect(isString(false)).toBe(false);
    });
  });
});
