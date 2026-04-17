import FIRST_PARTY_CONTRACT_NAMES from './first-party-contracts';
import { NETWORKS_CHAIN_ID } from './network';

describe('first-party-contracts', () => {
  it('exports an object', () => {
    expect(typeof FIRST_PARTY_CONTRACT_NAMES).toBe('object');
  });

  it('contains Validator Staking contract', () => {
    expect(FIRST_PARTY_CONTRACT_NAMES['Validator Staking']).toBeDefined();
    expect(FIRST_PARTY_CONTRACT_NAMES['Validator Staking'][NETWORKS_CHAIN_ID.MAINNET]).toBeDefined();
  });

  it('contains Pooled Staking contract', () => {
    expect(FIRST_PARTY_CONTRACT_NAMES['Pooled Staking']).toBeDefined();
    expect(FIRST_PARTY_CONTRACT_NAMES['Pooled Staking'][NETWORKS_CHAIN_ID.MAINNET]).toBeDefined();
  });

  it('contains Third Party Staking contract', () => {
    expect(FIRST_PARTY_CONTRACT_NAMES['Third Party Staking']).toBeDefined();
  });

  it('contains Pool Staking (v1) contract', () => {
    expect(FIRST_PARTY_CONTRACT_NAMES['Pool Staking (v1)']).toBeDefined();
  });

  it('contains Bridge contract on multiple chains', () => {
    const bridge = FIRST_PARTY_CONTRACT_NAMES['Bridge'];
    expect(bridge).toBeDefined();
    expect(bridge[NETWORKS_CHAIN_ID.MAINNET]).toBeDefined();
    expect(bridge[NETWORKS_CHAIN_ID.OPTIMISM]).toBeDefined();
    expect(bridge[NETWORKS_CHAIN_ID.BSC]).toBeDefined();
    expect(bridge[NETWORKS_CHAIN_ID.POLYGON]).toBeDefined();
    expect(bridge[NETWORKS_CHAIN_ID.BASE]).toBeDefined();
    expect(bridge[NETWORKS_CHAIN_ID.ARBITRUM]).toBeDefined();
  });

  it('contains Swaps contract on multiple chains', () => {
    const swaps = FIRST_PARTY_CONTRACT_NAMES['Swaps'];
    expect(swaps).toBeDefined();
    expect(swaps[NETWORKS_CHAIN_ID.MAINNET]).toBeDefined();
    expect(swaps[NETWORKS_CHAIN_ID.BSC]).toBeDefined();
    expect(swaps[NETWORKS_CHAIN_ID.POLYGON]).toBeDefined();
  });

  it('all addresses are hex strings starting with 0x', () => {
    Object.values(FIRST_PARTY_CONTRACT_NAMES).forEach((chainMap) => {
      Object.values(chainMap).forEach((address) => {
        expect(address).toMatch(/^0x[0-9a-fA-F]+$/);
      });
    });
  });
});
