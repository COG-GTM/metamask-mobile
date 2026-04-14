import { GAS_LIMIT_INCREMENT, GAS_PRICE_INCREMENT, GAS_LIMIT_MIN, GAS_PRICE_MIN } from './gasUtils';
import BigNumber from 'bignumber.js';

describe('gasUtils', () => {
  it('should export GAS_LIMIT_INCREMENT as BigNumber(1000)', () => {
    expect(GAS_LIMIT_INCREMENT).toBeInstanceOf(BigNumber);
    expect(GAS_LIMIT_INCREMENT.toNumber()).toBe(1000);
  });

  it('should export GAS_PRICE_INCREMENT as BigNumber(1)', () => {
    expect(GAS_PRICE_INCREMENT).toBeInstanceOf(BigNumber);
    expect(GAS_PRICE_INCREMENT.toNumber()).toBe(1);
  });

  it('should export GAS_LIMIT_MIN as BigNumber(21000)', () => {
    expect(GAS_LIMIT_MIN).toBeInstanceOf(BigNumber);
    expect(GAS_LIMIT_MIN.toNumber()).toBe(21000);
  });

  it('should export GAS_PRICE_MIN as BigNumber(0)', () => {
    expect(GAS_PRICE_MIN).toBeInstanceOf(BigNumber);
    expect(GAS_PRICE_MIN.toNumber()).toBe(0);
  });
});
