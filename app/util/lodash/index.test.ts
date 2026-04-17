import { isZero, lte, gte, lt, gt, isString } from './index';

describe('lodash utils', () => {
  describe('isZero', () => {
    it('returns true for 0', () => {
      expect(isZero(0)).toBe(true);
    });
    it('returns true for "0"', () => {
      expect(isZero('0')).toBe(true);
    });
    it('returns true for "0x0"', () => {
      expect(isZero('0x0')).toBe(true);
    });
    it('returns false for 1', () => {
      expect(isZero(1)).toBe(false);
    });
    it('returns false for null', () => {
      expect(isZero(null)).toBe(false);
    });
  });

  describe('lte', () => {
    it('returns true when less', () => {
      expect(lte(1, 2)).toBe(true);
    });
    it('returns true when equal', () => {
      expect(lte(2, 2)).toBe(true);
    });
    it('returns false when greater', () => {
      expect(lte(3, 2)).toBe(false);
    });
  });

  describe('gte', () => {
    it('returns true when greater', () => {
      expect(gte(3, 2)).toBe(true);
    });
    it('returns true when equal', () => {
      expect(gte(2, 2)).toBe(true);
    });
    it('returns false when less', () => {
      expect(gte(1, 2)).toBe(false);
    });
  });

  describe('lt', () => {
    it('returns true when less', () => {
      expect(lt(1, 2)).toBe(true);
    });
    it('returns false when equal', () => {
      expect(lt(2, 2)).toBe(false);
    });
    it('returns false when greater', () => {
      expect(lt(3, 2)).toBe(false);
    });
  });

  describe('gt', () => {
    it('returns true when greater', () => {
      expect(gt(3, 2)).toBe(true);
    });
    it('returns false when equal', () => {
      expect(gt(2, 2)).toBe(false);
    });
    it('returns false when less', () => {
      expect(gt(1, 2)).toBe(false);
    });
  });

  describe('isString', () => {
    it('returns true for string primitive', () => {
      expect(isString('hello')).toBe(true);
    });
    it('returns true for String object', () => {
      // eslint-disable-next-line no-new-wrappers
      expect(isString(new String('hello'))).toBe(true);
    });
    it('returns false for number', () => {
      expect(isString(123)).toBe(false);
    });
    it('returns false for null', () => {
      expect(isString(null)).toBe(false);
    });
    it('returns false for array', () => {
      expect(isString([])).toBe(false);
    });
    it('returns false for undefined', () => {
      expect(isString(undefined)).toBe(false);
    });
  });
});
