import { EthMethod } from '@metamask/keyring-api';
import { ETH_EOA_METHODS } from './eth-methods';

describe('eth-methods constants', () => {
  it('exports ETH_EOA_METHODS as a non-empty array', () => {
    expect(Array.isArray(ETH_EOA_METHODS)).toBe(true);
    expect(ETH_EOA_METHODS.length).toBeGreaterThan(0);
  });

  it('includes PersonalSign', () => {
    expect(ETH_EOA_METHODS).toContain(EthMethod.PersonalSign);
  });

  it('includes SignTransaction', () => {
    expect(ETH_EOA_METHODS).toContain(EthMethod.SignTransaction);
  });

  it('includes typed data signing methods', () => {
    expect(ETH_EOA_METHODS).toContain(EthMethod.SignTypedDataV1);
    expect(ETH_EOA_METHODS).toContain(EthMethod.SignTypedDataV3);
    expect(ETH_EOA_METHODS).toContain(EthMethod.SignTypedDataV4);
  });
});
