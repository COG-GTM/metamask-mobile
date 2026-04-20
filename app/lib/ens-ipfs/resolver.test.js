// Keep mocks lightweight so the test only exercises the resolver logic.
jest.mock('eth-ens-namehash', () => ({ hash: jest.fn(() => '0xhash') }));

const mockContract = jest.fn();
jest.mock('@metamask/ethjs-query', () => jest.fn().mockImplementation(() => ({})));
jest.mock('@metamask/ethjs-contract', () =>
  jest.fn().mockImplementation(() => mockContract),
);

jest.mock('./contracts/registry', () => ({}));
jest.mock('./contracts/resolver', () => ({}));

jest.mock('content-hash', () => ({
  decode: jest.fn(() => 'decoded-hash'),
  getCodec: jest.fn(() => 'ipfs-ns'),
}));

jest.mock('multihashes', () => ({
  fromHexString: jest.fn(() => 'buf'),
  toB58String: jest.fn(() => 'b58-content'),
  encode: jest.fn((buf) => buf),
}));

jest.mock('../../core/Engine', () => ({
  context: {
    PreferencesController: { state: { isIpfsGatewayEnabled: true } },
  },
}));

jest.mock('../../components/Views/BrowserTab/constants', () => ({
  IPFS_GATEWAY_DISABLED_ERROR: 'IPFS_GATEWAY_DISABLED',
}));

import resolveEnsToIpfsContentId, { isGatewayUrl } from './resolver';
import Engine from '../../core/Engine';

const zeroAddr = '0x0000000000000000000000000000000000000000000000000000000000000000';

const setContract = ({ resolverAddress, supportsEip1577, supportsLegacy, rawContent, legacyContent }) => {
  mockContract.mockReset();
  mockContract.mockImplementation(() => ({
    at: () => ({
      resolver: jest.fn().mockResolvedValue([resolverAddress]),
      supportsInterface: jest
        .fn()
        .mockResolvedValueOnce([supportsEip1577])
        .mockResolvedValueOnce([supportsLegacy]),
      contenthash: jest.fn().mockResolvedValue([rawContent]),
      content: jest.fn().mockResolvedValue([legacyContent]),
    }),
  }));
};

describe('isGatewayUrl', () => {
  it('recognises /ipfs/ /ipns/ and /bzz:/ paths', () => {
    expect(isGatewayUrl({ pathname: '/ipfs/abc' })).toBe(true);
    expect(isGatewayUrl({ pathname: '/ipns/abc' })).toBe(true);
    expect(isGatewayUrl({ pathname: '/bzz:/abc' })).toBe(true);
  });

  it('returns false for other paths', () => {
    expect(isGatewayUrl({ pathname: '/other' })).toBe(false);
  });
});

describe('resolveEnsToIpfsContentId', () => {
  beforeEach(() => {
    Engine.context.PreferencesController.state.isIpfsGatewayEnabled = true;
  });

  it('throws for unknown chain ids', async () => {
    await expect(
      resolveEnsToIpfsContentId({ provider: {}, name: 'foo.eth', chainId: '0xdeadbeef' }),
    ).rejects.toThrow('no known ens-ipfs registry');
  });

  it('resolves an EIP-1577 compliant record', async () => {
    setContract({
      resolverAddress: '0xabc',
      supportsEip1577: true,
      supportsLegacy: false,
      rawContent: '0xraw',
    });

    const out = await resolveEnsToIpfsContentId({
      provider: {},
      name: 'foo.eth',
      chainId: '0x1',
    });

    expect(out).toEqual({ type: 'ipfs-ns', hash: 'decoded-hash' });
  });

  it('throws when the resolver is empty', async () => {
    setContract({ resolverAddress: zeroAddr });
    await expect(
      resolveEnsToIpfsContentId({ provider: {}, name: 'foo.eth', chainId: '0x1' }),
    ).rejects.toThrow('no resolver found');
  });

  it('throws when the IPFS gateway is disabled for an EIP-1577 record', async () => {
    setContract({
      resolverAddress: '0xabc',
      supportsEip1577: true,
      supportsLegacy: false,
      rawContent: '0xraw',
    });
    Engine.context.PreferencesController.state.isIpfsGatewayEnabled = false;

    await expect(
      resolveEnsToIpfsContentId({ provider: {}, name: 'foo.eth', chainId: '0x1' }),
    ).rejects.toThrow('IPFS_GATEWAY_DISABLED');
  });

  it('resolves a legacy resolver record', async () => {
    setContract({
      resolverAddress: '0xabc',
      supportsEip1577: false,
      supportsLegacy: true,
      legacyContent: '0xdeadbeefdeadbeef',
    });

    const out = await resolveEnsToIpfsContentId({
      provider: {},
      name: 'foo.eth',
      chainId: '0x1',
    });

    expect(out).toEqual({ type: 'ipfs-ns', hash: 'b58-content' });
  });

  it('throws for a legacy resolver with empty content', async () => {
    setContract({
      resolverAddress: '0xabc',
      supportsEip1577: false,
      supportsLegacy: true,
      legacyContent: '0x',
    });

    await expect(
      resolveEnsToIpfsContentId({ provider: {}, name: 'foo.eth', chainId: '0x1' }),
    ).rejects.toThrow('no content ID found');
  });

  it('throws when the resolver is non-standard', async () => {
    setContract({
      resolverAddress: '0xabc',
      supportsEip1577: false,
      supportsLegacy: false,
    });

    await expect(
      resolveEnsToIpfsContentId({ provider: {}, name: 'foo.eth', chainId: '0x1' }),
    ).rejects.toThrow('not standard');
  });
});
