import BigNumber from 'bignumber.js';
import {
  GAS_LIMIT_INCREMENT,
  GAS_PRICE_INCREMENT,
  GAS_LIMIT_MIN,
  GAS_PRICE_MIN,
} from './gasUtils';

describe('gasUtils', () => {
  it('GAS_LIMIT_INCREMENT is 1000', () => {
    expect(GAS_LIMIT_INCREMENT).toEqual(new BigNumber(1000));
  });

  it('GAS_PRICE_INCREMENT is 1', () => {
    expect(GAS_PRICE_INCREMENT).toEqual(new BigNumber(1));
  });

  it('GAS_LIMIT_MIN is 21000', () => {
    expect(GAS_LIMIT_MIN).toEqual(new BigNumber(21000));
  });

  it('GAS_PRICE_MIN is 0', () => {
    expect(GAS_PRICE_MIN).toEqual(new BigNumber(0));
  });

  it('GAS_LIMIT_MIN is greater than GAS_LIMIT_INCREMENT', () => {
    expect(GAS_LIMIT_MIN.isGreaterThan(GAS_LIMIT_INCREMENT)).toBe(true);
  });
});
