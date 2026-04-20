import { NETWORK_CHAIN_ID } from '../../../../../util/networks/customNetworks';
import { CustomNetworkNativeImgMapping } from './CustomNetworkNativeImgMapping';

describe('CustomNetworkNativeImgMapping', () => {
  it('exposes mappings for every supported custom network chain id', () => {
    const expectedChainIds = [
      NETWORK_CHAIN_ID.FLARE_MAINNET,
      NETWORK_CHAIN_ID.SONGBIRD_TESTNET,
      NETWORK_CHAIN_ID.APE_CHAIN_TESTNET,
      NETWORK_CHAIN_ID.APE_CHAIN_MAINNET,
      NETWORK_CHAIN_ID.GRAVITY_ALPHA_MAINNET,
      NETWORK_CHAIN_ID.KAIA_MAINNET,
      NETWORK_CHAIN_ID.KAIA_KAIROS_TESTNET,
      NETWORK_CHAIN_ID.SONEIUM_MAINNET,
      NETWORK_CHAIN_ID.SONEIUM_MINATO_TESTNET,
      NETWORK_CHAIN_ID.XRPLEVM_TESTNET,
    ];

    expectedChainIds.forEach((chainId) => {
      expect(CustomNetworkNativeImgMapping[chainId]).toBeDefined();
    });
  });

  it('maps both Ape Chain variants to the same image source', () => {
    expect(CustomNetworkNativeImgMapping[NETWORK_CHAIN_ID.APE_CHAIN_TESTNET]).toBe(
      CustomNetworkNativeImgMapping[NETWORK_CHAIN_ID.APE_CHAIN_MAINNET],
    );
  });

  it('maps both Kaia variants to the same image source', () => {
    expect(CustomNetworkNativeImgMapping[NETWORK_CHAIN_ID.KAIA_MAINNET]).toBe(
      CustomNetworkNativeImgMapping[NETWORK_CHAIN_ID.KAIA_KAIROS_TESTNET],
    );
  });

  it('maps both Soneium variants to the same image source', () => {
    expect(CustomNetworkNativeImgMapping[NETWORK_CHAIN_ID.SONEIUM_MAINNET]).toBe(
      CustomNetworkNativeImgMapping[NETWORK_CHAIN_ID.SONEIUM_MINATO_TESTNET],
    );
  });

  it('returns undefined for an unknown chain id', () => {
    expect(CustomNetworkNativeImgMapping['0xdeadbeef']).toBeUndefined();
  });
});
