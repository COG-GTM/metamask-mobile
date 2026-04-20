import BigNumber from 'bignumber.js';
import {
  GAS_LIMIT_INCREMENT,
  GAS_LIMIT_MIN,
  GAS_PRICE_INCREMENT,
  GAS_PRICE_MIN,
} from './gasUtils';

describe('gasUtils constants', () => {
  it('exports BigNumber increments and minimums', () => {
    expect(GAS_LIMIT_INCREMENT).toBeInstanceOf(BigNumber);
    expect(GAS_LIMIT_INCREMENT.toString()).toBe('1000');
    expect(GAS_PRICE_INCREMENT.toString()).toBe('1');
    expect(GAS_LIMIT_MIN.toString()).toBe('21000');
    expect(GAS_PRICE_MIN.toString()).toBe('0');
  });
});
