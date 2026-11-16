import Engine from '../../core/Engine';
import { IPFS_GATEWAY_DISABLED_ERROR } from '../../components/Views/BrowserTab/constants';
import registryAbi from './contracts/registry';
import resolverAbi from './contracts/resolver';
import resolveEnsToIpfsContentId, { isGatewayUrl } from './resolver';

const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const RESOLVER_ADDRESS = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
const EIP1577_INTERFACE_ID = '0xbc1c58d1';
const LEGACY_INTERFACE_ID = '0xd8389dc5';

const IPFS_CID = 'QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4';
const IPFS_SHA256_DIGEST =
  '29f2d17be6139079dc48696d1f582a8530eb9805b561eda517e22a892c7e3f1f';
// EIP-1577 contenthash values: <protoCode varint><CIDv1 0x01><multicodec><multihash>
const IPFS_CONTENTHASH = `0xe3010170${'1220'}${IPFS_SHA256_DIGEST}`;
const IPNS_CONTENTHASH = `0xe5010170${'1220'}${IPFS_SHA256_DIGEST}`;
const SWARM_HASH =
  'd1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162';
const SWARM_CONTENTHASH = `0xe40101fa011b20${SWARM_HASH}`;

const NAME = 'metamask.eth';
// namehash('metamask.eth')
const NAME_NODE =
  '0xe650784434622eeb4ffbbb3220ebb371e26ad1a77f388680d42d8b1624baa6df';
const MAINNET = '0x1';
const SEPOLIA = '0xaa36a7';

jest.mock('../../core/Engine', () => ({
  context: {
    PreferencesController: {
      state: {
        isIpfsGatewayEnabled: true,
      },
    },
  },
}));

jest.mock('@metamask/ethjs-query', () => jest.fn());

const mockRegistry = {
  resolver: jest.fn(),
};
const mockResolver = {
  supportsInterface: jest.fn(),
  contenthash: jest.fn(),
  content: jest.fn(),
};
const mockAt = jest.fn();
const mockContract = jest.fn();

jest.mock('@metamask/ethjs-contract', () =>
  jest.fn().mockImplementation(() => mockContract),
);

const preferencesState = Engine.context.PreferencesController.state as {
  isIpfsGatewayEnabled: boolean;
};

const mockSupportedInterfaces = ({
  eip1577,
  legacy,
}: {
  eip1577: boolean;
  legacy: boolean;
}) => {
  mockResolver.supportsInterface.mockImplementation(
    async (interfaceId: string) => {
      if (interfaceId === EIP1577_INTERFACE_ID) return [eip1577];
      if (interfaceId === LEGACY_INTERFACE_ID) return [legacy];
      return [false];
    },
  );
};

const resolve = (chainId = MAINNET, name = NAME) =>
  resolveEnsToIpfsContentId({ provider: {}, name, chainId });

describe('resolveEnsToIpfsContentId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    preferencesState.isIpfsGatewayEnabled = true;
    mockContract.mockImplementation((abi: unknown) => ({
      at: (address: string) => {
        mockAt(abi, address);
        return abi === registryAbi ? mockRegistry : mockResolver;
      },
    }));
    mockRegistry.resolver.mockResolvedValue([RESOLVER_ADDRESS]);
    mockSupportedInterfaces({ eip1577: true, legacy: false });
    mockResolver.contenthash.mockResolvedValue([IPFS_CONTENTHASH]);
    mockResolver.content.mockResolvedValue([`0x${IPFS_SHA256_DIGEST}`]);
  });

  describe('registry lookup', () => {
    it.each([
      ['mainnet', MAINNET],
      ['sepolia', SEPOLIA],
    ])(
      'queries the ENS registry on %s with the namehash of the name',
      async (_network, chainId) => {
        await resolve(chainId);

        expect(mockAt).toHaveBeenCalledWith(registryAbi, ENS_REGISTRY_ADDRESS);
        expect(mockRegistry.resolver).toHaveBeenCalledWith(NAME_NODE);
        expect(mockAt).toHaveBeenCalledWith(resolverAbi, RESOLVER_ADDRESS);
      },
    );

    it.each(['0x5', '0x89', '0xe708', '1', undefined])(
      'throws for unsupported chainId %s without querying the network',
      async (chainId) => {
        await expect(
          resolveEnsToIpfsContentId({ provider: {}, name: NAME, chainId }),
        ).rejects.toThrow(
          `EnsIpfsResolver - no known ens-ipfs registry for chainId "${chainId}"`,
        );
        expect(mockRegistry.resolver).not.toHaveBeenCalled();
      },
    );

    it.each([undefined, null, '0x', '0x0', ZERO_BYTES32])(
      'throws when the registry returns empty resolver address %s',
      async (resolverAddress) => {
        mockRegistry.resolver.mockResolvedValue([resolverAddress]);

        await expect(resolve()).rejects.toThrow(
          `EnsIpfsResolver - no resolver found for name "${NAME}"`,
        );
        expect(mockResolver.supportsInterface).not.toHaveBeenCalled();
      },
    );

    it('does not treat the 20-byte zero address as empty', async () => {
      mockRegistry.resolver.mockResolvedValue([ZERO_ADDRESS]);

      await resolve();

      expect(mockAt).toHaveBeenCalledWith(resolverAbi, ZERO_ADDRESS);
    });
  });

  describe('EIP-1577 contenthash resolver', () => {
    it('checks both resolver interfaces', async () => {
      await resolve();

      expect(mockResolver.supportsInterface).toHaveBeenCalledWith(
        EIP1577_INTERFACE_ID,
      );
      expect(mockResolver.supportsInterface).toHaveBeenCalledWith(
        LEGACY_INTERFACE_ID,
      );
    });

    it.each([
      ['ipfs-ns', IPFS_CONTENTHASH, IPFS_CID],
      ['ipns-ns', IPNS_CONTENTHASH, IPFS_CID],
      ['swarm-ns', SWARM_CONTENTHASH, SWARM_HASH],
    ])(
      'decodes a %s contenthash when the IPFS gateway is enabled',
      async (type, rawContentHash, hash) => {
        mockResolver.contenthash.mockResolvedValue([rawContentHash]);

        await expect(resolve()).resolves.toStrictEqual({ type, hash });
        expect(mockResolver.contenthash).toHaveBeenCalledWith(NAME_NODE);
        expect(mockResolver.content).not.toHaveBeenCalled();
      },
    );

    it('prefers contenthash() over content() when both are supported', async () => {
      mockSupportedInterfaces({ eip1577: true, legacy: true });

      await expect(resolve()).resolves.toStrictEqual({
        type: 'ipfs-ns',
        hash: IPFS_CID,
      });
      expect(mockResolver.content).not.toHaveBeenCalled();
    });

    it('throws IPFS_GATEWAY_DISABLED_ERROR when the IPFS gateway is disabled', async () => {
      preferencesState.isIpfsGatewayEnabled = false;

      await expect(resolve()).rejects.toThrow(IPFS_GATEWAY_DISABLED_ERROR);
    });

    it('throws when the contenthash cannot be decoded', async () => {
      mockResolver.contenthash.mockResolvedValue(['0x']);

      await expect(resolve()).rejects.toThrow();
    });
  });

  describe('legacy content() resolver', () => {
    beforeEach(() => {
      mockSupportedInterfaces({ eip1577: false, legacy: true });
    });

    it('encodes the content hash as a base58 sha2-256 multihash when the IPFS gateway is enabled', async () => {
      await expect(resolve()).resolves.toStrictEqual({
        type: 'ipfs-ns',
        hash: IPFS_CID,
      });
      expect(mockResolver.content).toHaveBeenCalledWith(NAME_NODE);
      expect(mockResolver.contenthash).not.toHaveBeenCalled();
    });

    it.each([undefined, null, '0x', '0x0', ZERO_BYTES32])(
      'throws when content() returns empty value %s',
      async (content) => {
        mockResolver.content.mockResolvedValue([content]);

        await expect(resolve()).rejects.toThrow(
          `EnsIpfsResolver - no content ID found for name "${NAME}"`,
        );
      },
    );

    it('throws IPFS_GATEWAY_DISABLED_ERROR when the IPFS gateway is disabled', async () => {
      preferencesState.isIpfsGatewayEnabled = false;

      await expect(resolve()).rejects.toThrow(IPFS_GATEWAY_DISABLED_ERROR);
    });

    it('reports a missing content ID before the gateway setting', async () => {
      preferencesState.isIpfsGatewayEnabled = false;
      mockResolver.content.mockResolvedValue([ZERO_BYTES32]);

      await expect(resolve()).rejects.toThrow(
        `EnsIpfsResolver - no content ID found for name "${NAME}"`,
      );
    });
  });

  it('throws when the resolver supports neither contenthash() nor content()', async () => {
    mockSupportedInterfaces({ eip1577: false, legacy: false });

    await expect(resolve()).rejects.toThrow(
      `EnsIpfsResolver - the resolver for name "${NAME}" is not standard, it should either supports contenthash() or content()`,
    );
    expect(mockResolver.contenthash).not.toHaveBeenCalled();
    expect(mockResolver.content).not.toHaveBeenCalled();
  });

  it('propagates registry lookup errors', async () => {
    mockRegistry.resolver.mockRejectedValue(new Error('rpc failure'));

    await expect(resolve()).rejects.toThrow('rpc failure');
  });
});

describe('isGatewayUrl', () => {
  it.each([
    [
      'https://ipfs.io/ipfs/QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4',
      true,
    ],
    ['https://cloudflare-ipfs.com/ipfs/bafybeigdyrzt/index.html', true],
    ['https://ipfs.io/ipns/metamask.eth/', true],
    ['https://swarm-gateways.net/bzz:/theswarm.eth/', true],
    ['https://metamask.io/', false],
    ['https://example.com/ipfs', false],
    ['https://example.com/docs/ipfs/QmHash', false],
    ['https://example.com/IPFS/QmHash', false],
    ['https://example.com/bzz/hash', false],
    ['https://example.com/?path=/ipfs/QmHash', false],
  ])('returns the expected classification for %s', (url, expected) => {
    expect(isGatewayUrl(new URL(url))).toBe(expected);
  });
});
