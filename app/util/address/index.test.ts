import { NetworkState, RpcEndpointType } from '@metamask/network-controller';
import {
  isENS,
  renderSlightlyLongAddress,
  formatAddress,
  isValidHexAddress,
  isValidAddressInputViaQRCode,
  stripHexPrefix,
  getAddress,
  shouldShowBlockExplorer,
  isQRHardwareAccount,
  getAddressAccountType,
  isHardwareAccount,
  resemblesAddress,
  getKeyringByAddress,
  getLabelTextByAddress,
  isSnapAccount,
  toFormattedAddress,
  isHDOrFirstPartySnapAccount,
  renderAccountName,
  validateAddressOrENS,
} from '.';
import {
  mockHDKeyringAddress,
  mockQrKeyringAddress,
  mockSecondHDKeyringAddress,
  mockSimpleKeyringAddress,
  mockSnapAddress1,
  mockSolanaAddress,
} from '../test/keyringControllerTestUtils';
import {
  internalAccount1,
  MOCK_SOLANA_ACCOUNT,
} from '../test/accountsControllerTestUtils';
import { KeyringTypes } from '@metamask/keyring-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { AddressBookControllerState } from '@metamask/address-book-controller';
import type { Hex } from '@metamask/utils';
import Engine from '../../core/Engine';
import {
  doENSLookup as mockedDoENSLookup,
  doENSReverseLookup as mockedDoENSReverseLookup,
} from '../../util/ENSUtils';
import { CONTACT_ALREADY_SAVED, SYMBOL_ERROR } from '../../constants/error';
import { strings } from '../../../locales/i18n';

jest.mock('../../store', () => ({
  store: {
    getState: jest.fn().mockReturnValue({
      engine: {
        backgroundState: {
          NetworkController: {
            provider: {
              chainId: '0x1',
            },
          },
        },
      },
    }),
  },
}));

jest.mock('../../core/Engine', () => {
  const { MOCK_KEYRING_CONTROLLER_STATE } = jest.requireActual(
    '../test/keyringControllerTestUtils',
  );
  const { MOCK_ACCOUNTS_CONTROLLER_STATE_WITH_KEYRING_TYPES } =
    jest.requireActual('../test/accountsControllerTestUtils');
  return {
    context: {
      KeyringController: {
        ...MOCK_KEYRING_CONTROLLER_STATE,
        state: {
          keyrings: [...MOCK_KEYRING_CONTROLLER_STATE.keyrings],
          keyringsMetadata: [...MOCK_KEYRING_CONTROLLER_STATE.keyringsMetadata],
        },
      },
      AccountsController: {
        ...MOCK_ACCOUNTS_CONTROLLER_STATE_WITH_KEYRING_TYPES,
        state: MOCK_ACCOUNTS_CONTROLLER_STATE_WITH_KEYRING_TYPES,
      },
      AssetsContractController: {
        getERC721AssetSymbol: jest.fn(),
      },
    },
  };
});

// Mock the selectors used in renderAccountName
jest.mock('../../selectors/networkController', () => ({
  selectChainId: jest.fn().mockReturnValue('0x1'),
}));

// Mock the ENS utils
jest.mock('../../util/ENSUtils', () => ({
  getCachedENSName: jest.fn().mockReturnValue(''),
  isDefaultAccountName: jest.fn().mockReturnValue(false),
  doENSLookup: jest.fn(),
  doENSReverseLookup: jest.fn(),
}));

describe('isENS', () => {
  it('should return false by default', () => {
    expect(isENS()).toBe(false);
  });
  it('should return true for normal domain', () => {
    expect(isENS('ricky.codes')).toBe(true);
  });
  it('should return true for ens', () => {
    expect(isENS('rickycodes.eth')).toBe(true);
  });
  it('should return true for eth ens', () => {
    expect(isENS('ricky.eth.eth')).toBe(true);
  });
  it('should return true for metamask ens', () => {
    expect(isENS('ricky.metamask.eth')).toBe(true);
  });
});

describe('renderSlightlyLongAddress', () => {
  describe('with EVM addresses', () => {
    const mockAddress = '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272';
    it('returns 5 characters before ellipsis and 4 final characters of the address after the ellipsis', () => {
      expect(renderSlightlyLongAddress(mockAddress).split('.')[0].length).toBe(
        24,
      );
      expect(renderSlightlyLongAddress(mockAddress).split('.')[3].length).toBe(
        4,
      );
    });
    it('returns 0xC4955 before ellipsis and 4D272 after the ellipsis', () => {
      expect(renderSlightlyLongAddress(mockAddress, 5, 2).split('.')[0]).toBe(
        '0xC4955',
      );
      expect(renderSlightlyLongAddress(mockAddress, 5, 0).split('.')[3]).toBe(
        '4D272',
      );
    });
  });

  describe('non-EVM addresses', () => {
    it('does not checksum address and maintain original format', () => {
      const address = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      const result = renderSlightlyLongAddress(address);
      const [beforeEllipsis, afterEllipsis] = result.split('...');
      expect(beforeEllipsis.length).toBe(24); // Default initialChars (20) + chars (4)
      expect(afterEllipsis.length).toBe(4);
      expect(result).toBe('bc1qxy2kgdygjrsqtzq2n0yr...0wlh');
    });

    it('respects custom chars and initialChars parameters', () => {
      const address = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      const result = renderSlightlyLongAddress(address, 5, 10);
      const [beforeEllipsis, afterEllipsis] = result.split('...');
      expect(beforeEllipsis.length).toBe(15); // Custom initialChars (10) + chars (5)
      expect(afterEllipsis.length).toBe(5);
      expect(result).toBe('bc1qxy2kgdygjrs...x0wlh');
    });
  });
});

describe('renderAccountName', () => {
  describe('with Ethereum accounts', () => {
    it('returns the account name for a known Ethereum account', () => {
      const ethAddress = internalAccount1.address;
      const accounts = [internalAccount1];
      expect(renderAccountName(ethAddress, accounts)).toBe('Account 1');
    });

    it('returns a shortened address for unknown Ethereum accounts', () => {
      const unknownAddress = '0x1234567890123456789012345678901234567890';
      const accounts = [internalAccount1];
      // The shortened address format is first 7 chars + ... + last 5 chars
      expect(renderAccountName(unknownAddress, accounts)).toBe(
        '0x12345...67890',
      );
    });
  });

  describe('with Solana accounts', () => {
    it('returns the account name for a known Solana account', () => {
      const solanaAddress = MOCK_SOLANA_ACCOUNT.address;
      const accounts = [MOCK_SOLANA_ACCOUNT];
      expect(renderAccountName(solanaAddress, accounts)).toBe('Solana Account');
    });

    it('returns a shortened address for unknown Solana accounts', () => {
      const unknownSolanaAddress =
        '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV';
      const accounts = [internalAccount1]; // Only contains Ethereum account
      // The shortened address format is first 7 chars + ... + last 5 chars
      expect(renderAccountName(unknownSolanaAddress, accounts)).toBe(
        '7EcDhSY...CFLtV',
      );
    });
  });
});

describe('formatAddress', () => {
  const mockEvmAddress = '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272';
  const mockBtcAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

  describe('with EVM addresses', () => {
    it('returns checksummed address formatted for short type', () => {
      const expectedValue = '0xC4955...4D272';
      expect(formatAddress(mockEvmAddress, 'short')).toBe(expectedValue);
    });

    it('returns checksummed address formatted for mid type', () => {
      const expectedValue = '0xC4955C0d639D99699Bfd7E...D272';
      expect(formatAddress(mockEvmAddress, 'mid')).toBe(expectedValue);
    });

    it('returns full checksummed address for full type', () => {
      const expectedValue = '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272';
      expect(formatAddress(mockEvmAddress, 'full')).toBe(expectedValue);
    });
  });

  describe('with non-EVM addresses', () => {
    it('returns address formatted for short type without checksumming', () => {
      const expectedValue = 'bc1qxy2...x0wlh';
      expect(formatAddress(mockBtcAddress, 'short')).toBe(expectedValue);
    });

    it('returns address formatted for mid type without checksumming', () => {
      const expectedValue = 'bc1qxy2kgdygjrsqtzq2n0yr...0wlh';
      expect(formatAddress(mockBtcAddress, 'mid')).toBe(expectedValue);
    });

    it('returns full address without checksumming for full type', () => {
      const expectedValue = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      expect(formatAddress(mockBtcAddress, 'full')).toBe(expectedValue);
    });
  });
});

describe('toFormattedAddress', () => {
  describe('with EVM addresses', () => {
    it('returns checksummed address for lowercase input', () => {
      const input = '0xc4955c0d639d99699bfd7ec54d9fafee40e4d272';
      const expected = '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272';
      expect(toFormattedAddress(input)).toBe(expected);
    });
  });

  describe('with non-EVM addresses', () => {
    it('returns original address without modification', () => {
      const address = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      expect(toFormattedAddress(address)).toBe(address);
    });
  });
});

describe('isValidHexAddress', () => {
  it('should return true if all characters are lower case', () => {
    const lowerCaseMockAddress = '0x87187657b35f461d0ceec338d9b8e944a193afe2';
    expect(
      isValidHexAddress(lowerCaseMockAddress, { mixedCaseUseChecksum: true }),
    ).toBe(true);
  });

  it('should return true if all characters are upper case', () => {
    const upperCaseMockAddress = '0x87187657B35F461D0CEEC338D9B8E944A193AFE2';
    expect(
      isValidHexAddress(upperCaseMockAddress, { mixedCaseUseChecksum: true }),
    ).toBe(true);
  });

  it('should return false if the characters are mixed case and the checksum is invalid', () => {
    const upperCaseMockAddress = '0x87187657b35f461d0ceEc338d9B8e944A193afe2';
    expect(
      isValidHexAddress(upperCaseMockAddress, { mixedCaseUseChecksum: true }),
    ).toBe(false);
  });

  it('should return true if the characters are mixed case and the checksum is valid', () => {
    const upperCaseMockAddress = '0x87187657b35F461D0Ceec338d9b8E944a193aFE2';
    expect(
      isValidHexAddress(upperCaseMockAddress, { mixedCaseUseChecksum: true }),
    ).toBe(true);
  });

  it('should return false if the address is an  empty string', () => {
    expect(isValidHexAddress('', { mixedCaseUseChecksum: true })).toBe(false);
  });
});

describe('isValidAddressInputViaQRCode', () => {
  it('should be valid to use the ethereum keyword followed by an address and chain id', () => {
    const mockInput = 'ethereum:0x2990079bcdEe240329a520d2444386FC119da21a@1';
    expect(isValidAddressInputViaQRCode(mockInput)).toBe(true);
  });

  it('should be valid to use the ethereum keyword followed by an address', () => {
    const mockInput = 'ethereum:0x2990079bcdEe240329a520d2444386FC119da21a';
    expect(isValidAddressInputViaQRCode(mockInput)).toBe(true);
  });

  it('should be invalid to use the ethereum keyword followed by an wrong address', () => {
    const mockInput = 'ethereum:0x2990079bcdEe240329a520d2444386FC119d';
    expect(isValidAddressInputViaQRCode(mockInput)).toBe(false);
  });

  it('should be invalid to only have the ethereum keyword', () => {
    const mockInput = 'ethereum:';
    expect(isValidAddressInputViaQRCode(mockInput)).toBe(false);
  });

  it('should be valid to only have the address', () => {
    const mockInput = '0x2990079bcdEe240329a520d2444386FC119da21a';
    expect(isValidAddressInputViaQRCode(mockInput)).toBe(true);
  });

  it('should be invalid to have an URL', () => {
    const mockInput = 'https://www.metamask.io';
    expect(isValidAddressInputViaQRCode(mockInput)).toBe(false);
  });
});

describe('stripHexPrefix', () => {
  const str =
    '0x4cfd3e90fc78b0f86bf7524722150bb8da9c60cd532564d7ff43f5716514f553';
  const stripped =
    '4cfd3e90fc78b0f86bf7524722150bb8da9c60cd532564d7ff43f5716514f553';

  it('returns a string without a hex prefix', () => {
    expect(stripHexPrefix(str)).toBe(stripped);
  });

  it('returns the same string since there is no hex prefix', () => {
    expect(stripHexPrefix(stripped)).toBe(stripped);
  });
});

describe('getAddress', () => {
  const validAddress = '0x87187657B35F461D0CEEC338D9B8E944A193AFE2';
  const inValidAddress = '0x87187657B35F461D0CEEC338D9B8E944A193AFE';
  const validENSAddress = 'test.eth';

  it('should resolve ENS if ENS is valid', async () => {
    const chainId = '1';
    const doENSLookup = jest.fn();
    await doENSLookup(validENSAddress, chainId);
    expect(doENSLookup).toHaveBeenCalledWith(validENSAddress, chainId);
  });

  it('should return address if address is valid', async () => {
    const response = await getAddress(validAddress, '1');
    expect(response).toBe(validAddress);
  });

  it('should return null if address is invalid', async () => {
    const response = await getAddress(inValidAddress, '1');
    expect(response).toBe(null);
  });
});

describe('shouldShowBlockExplorer', () => {
  const networkConfigurations: NetworkState['networkConfigurationsByChainId'] =
    {
      '0x1': {
        blockExplorerUrls: [],
        chainId: '0x1',
        defaultRpcEndpointIndex: 0,
        name: 'Main Ethereum Network',
        nativeCurrency: 'USD',
        rpcEndpoints: [
          {
            networkClientId: 'networkId1',
            type: RpcEndpointType.Custom,
            url: 'https://mainnet.infura.io/v3/123',
          },
        ],
      },
    };

  it('returns true if provider type is not rpc', () => {
    const providerType = 'mainnet';

    const providerRpcTarget = networkConfigurations['0x1'].rpcEndpoints.find(
      ({ networkClientId }) => networkClientId === 'networkId1',
    )?.url as string;

    const result = shouldShowBlockExplorer(
      providerType,
      providerRpcTarget,
      networkConfigurations,
    );

    expect(result).toBe(true);
  });

  it('returns block explorer URL if defined', () => {
    const providerType = 'rpc';
    const providerRpcTarget = networkConfigurations['0x1'].rpcEndpoints.find(
      ({ networkClientId }) => networkClientId === 'networkId1',
    )?.url as string;

    const blockExplorerUrl = 'https://rpc.testnet.fantom.network';

    networkConfigurations['0x1'].blockExplorerUrls = [blockExplorerUrl];
    networkConfigurations['0x1'].defaultBlockExplorerUrlIndex = 0;

    const result = shouldShowBlockExplorer(
      providerType,
      providerRpcTarget,
      networkConfigurations,
    );

    expect(result).toBe(blockExplorerUrl);
  });

  it('returns undefined if block explorer URL is not defined', () => {
    const providerType = 'rpc';

    const providerRpcTarget = networkConfigurations['0x1'].rpcEndpoints.find(
      ({ networkClientId }) => networkClientId === 'networkId1',
    )?.url as string;

    networkConfigurations['0x1'].blockExplorerUrls = [];

    const result = shouldShowBlockExplorer(
      providerType,
      providerRpcTarget,
      networkConfigurations,
    );

    expect(result).toBe(undefined);
  });
});
describe('isQRHardwareAccount', () => {
  it('should return false if argument address is undefined', () => {
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isQRHardwareAccount(undefined as any)).toBeFalsy();
  });
  it('should return false if address does not exist on keyring', () => {
    expect(isQRHardwareAccount('address-stub')).toBeFalsy();
  });

  it('should return false if address is from keyring type simple', () => {
    expect(isQRHardwareAccount(mockSimpleKeyringAddress)).toBeFalsy();
  });
  it('should return false if address is from keyring type hd', () => {
    expect(isQRHardwareAccount(mockHDKeyringAddress)).toBeFalsy();
  });
  it('should return true if address is from keyring type qr', () => {
    expect(isQRHardwareAccount(mockQrKeyringAddress)).toBeTruthy();
  });
});
describe('getKeyringByAddress', () => {
  it('should return undefined if argument address is undefined', () => {
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getKeyringByAddress(undefined as any)).toBeUndefined();
  });
  it('should return undefined if argument address is not hex address', () => {
    expect(getKeyringByAddress('ens.eth')).toBeUndefined();
  });
  it('should return address if found', () => {
    expect(getKeyringByAddress(mockQrKeyringAddress)).not.toBe(undefined);
  });
  it('should return null if address not found', () => {
    expect(
      getKeyringByAddress('0xB374Ca013934e498e5baD3409147F34E6c462387'),
    ).toBe(undefined);
  });
});
describe('isHardwareAccount,', () => {
  it('should return true if account is a QR keyring', () => {
    expect(isHardwareAccount(mockQrKeyringAddress)).toBeTruthy();
  });

  it('should return false if account is not a hardware keyring', () => {
    expect(
      isHardwareAccount('0xD5955C0d639D99699Bfd7Ec54d9FaFEe40e4D278'),
    ).toBeFalsy();
  });
});
describe('getLabelTextByAddress,', () => {
  it('should return accounts.qr_hardware if account is a QR keyring', () => {
    expect(getLabelTextByAddress(mockQrKeyringAddress)).toBe('QR hardware');
  });

  it('should return KeyringTypes.simple if address is a imported account', () => {
    expect(getLabelTextByAddress(mockSimpleKeyringAddress)).toBe('Imported');
  });

  it('returns "Snaps (Beta)" if account is a Snap keyring and there is no snap name', () => {
    expect(getLabelTextByAddress(mockSnapAddress1)).toBe('Snaps (Beta)');
  });

  it('should return null if address is empty', () => {
    expect(getLabelTextByAddress('')).toBe(null);
  });

  it('should return null if account not found', () => {
    expect(
      getLabelTextByAddress('0xD5955C0d639D99699Bfd7Ec54d9FaFEe40e4D278'),
    ).toBe(null);
  });

  it('returns srp label for hd accounts when there are multiple hd keyrings', () => {
    expect(getLabelTextByAddress(mockSecondHDKeyringAddress)).toBe('SRP #2');
  });

  it('returns srp label for snap accounts that uses hd keyring for its entropy source', () => {
    expect(getLabelTextByAddress(mockSolanaAddress)).toBe('SRP #1');
  });
});
describe('getAddressAccountType', () => {
  it('should throw an error if argument address is undefined', () => {
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => getAddressAccountType(undefined as any)).toThrow(
      'Invalid address: undefined',
    );
  });
  it('should return QR if address is from a keyring type qr', () => {
    expect(getAddressAccountType(mockQrKeyringAddress)).toBe('QR');
  });
  it('should return imported if address is from a keyring type simple', () => {
    expect(getAddressAccountType(mockSimpleKeyringAddress)).toBe('Imported');
  });
  it('should return MetaMask if address is not qr or simple', () => {
    expect(getAddressAccountType(mockHDKeyringAddress)).toBe('MetaMask');
  });
});
describe('resemblesAddress', () => {
  it('should return false if argument address is undefined', () => {
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(resemblesAddress(undefined as any)).toBeFalsy();
  });
  it('should return false if address does not resemble an eth address', () => {
    expect(resemblesAddress('address-stub-1')).toBeFalsy();
  });
  it('should return true if address resemble an eth address', () => {
    expect(resemblesAddress(mockHDKeyringAddress)).toBeTruthy();
  });
});
describe('isSnapAccount,', () => {
  it('should return true if account is of type Snap Keyring', () => {
    expect(isSnapAccount(mockSnapAddress1)).toBeTruthy();
  });

  it('should return false if account is not of type Snap Keyring', () => {
    expect(
      isSnapAccount('0xD5955C0d639D99699Bfd7Ec54d9FaFEe40e4D278'),
    ).toBeFalsy();
  });
});

describe('isHDOrFirstPartySnapAccount', () => {
  it('should return true for HD accounts', () => {
    expect(isHDOrFirstPartySnapAccount(internalAccount1)).toBe(true);
  });

  it('should return true for first-party snap accounts (matching snapId)', () => {
    expect(isHDOrFirstPartySnapAccount(MOCK_SOLANA_ACCOUNT)).toBe(true);
  });

  it('should return true for first-party snap accounts (with entropySource)', () => {
    expect(isHDOrFirstPartySnapAccount(MOCK_SOLANA_ACCOUNT)).toBe(true);
  });

  it('should return false for third-party snap accounts', () => {
    expect(
      isHDOrFirstPartySnapAccount({
        ...MOCK_SOLANA_ACCOUNT,
        metadata: {
          ...MOCK_SOLANA_ACCOUNT.metadata,
          snap: {
            id: 'third-party-snap',
            name: 'Third Party Snap',
            enabled: true,
          },
        },
        options: {},
      }),
    ).toBe(false);
  });

  it.each([
    {
      type: KeyringTypes.simple,
    },
    {
      type: KeyringTypes.ledger,
    },
    {
      type: KeyringTypes.oneKey,
    },
    {
      type: KeyringTypes.qr,
    },
    {
      type: KeyringTypes.trezor,
    },
    {
      type: KeyringTypes.lattice,
    },
  ])('returns false for keyring type $type', ({ type }) => {
    expect(
      isHDOrFirstPartySnapAccount({
        ...internalAccount1,
        metadata: {
          ...internalAccount1.metadata,
          keyring: {
            type,
          },
        },
      }),
    ).toBe(false);
  });
});

describe('validateAddressOrENS', () => {
  const MAINNET: Hex = '0x1';
  const SEPOLIA: Hex = '0xaa36a7';
  const checksummedAddress = '0x87187657b35F461D0Ceec338d9b8E944a193aFE2';
  const lowerCaseAddress = checksummedAddress.toLowerCase();
  const badChecksumAddress = '0x87187657B35f461D0Ceec338d9b8E944a193aFE2';
  const ensName = 'test.eth';

  const mockDoENSLookup = mockedDoENSLookup as jest.Mock;
  const mockDoENSReverseLookup = mockedDoENSReverseLookup as jest.Mock;
  const mockGetERC721AssetSymbol = Engine.context.AssetsContractController
    .getERC721AssetSymbol as jest.Mock;

  const addressBookWith = (
    chainId: Hex,
    address: string,
  ): AddressBookControllerState['addressBook'] => ({
    [chainId]: {
      [address]: {
        address,
        chainId,
        isEns: false,
        memo: '',
        name: 'Saved contact',
      },
    },
  });

  const internalAccountWith = (address: string) =>
    ({ address } as unknown as InternalAccount);

  beforeEach(() => {
    jest.clearAllMocks();
    mockDoENSLookup.mockResolvedValue(undefined);
    mockDoENSReverseLookup.mockResolvedValue(undefined);
    mockGetERC721AssetSymbol.mockResolvedValue(undefined);
  });

  describe('with a hex address', () => {
    it('marks an unsaved address as ready and addable to the address book', async () => {
      const result = await validateAddressOrENS(
        checksummedAddress,
        {},
        [],
        SEPOLIA,
      );

      expect(result).toEqual({
        addressError: undefined,
        toEnsName: undefined,
        addressReady: true,
        toEnsAddress: undefined,
        addToAddressToAddressBook: true,
        toAddressName: checksummedAddress,
        errorContinue: undefined,
        confusableCollection: undefined,
      });
      expect(mockDoENSReverseLookup).toHaveBeenCalledWith(checksummedAddress);
    });

    it('accepts an all lower case address and reverse-looks it up checksummed', async () => {
      const result = await validateAddressOrENS(
        lowerCaseAddress,
        {},
        [],
        SEPOLIA,
      );

      expect(result.addressReady).toBe(true);
      expect(result.addressError).toBeUndefined();
      expect(result.toAddressName).toBe(lowerCaseAddress);
      expect(mockDoENSReverseLookup).toHaveBeenCalledWith(checksummedAddress);
    });

    it.each([
      ['checksummed', checksummedAddress],
      ['lower case', lowerCaseAddress],
    ])(
      'flags a %s address already in the address book for the chain',
      async (_label, input) => {
        const result = await validateAddressOrENS(
          input,
          addressBookWith(SEPOLIA, checksummedAddress),
          [],
          SEPOLIA,
        );

        expect(result.addressError).toBe(CONTACT_ALREADY_SAVED);
        expect(result.addressReady).toBe(true);
        expect(result.addToAddressToAddressBook).toBe(false);
        expect(result.toAddressName).toBeUndefined();
      },
    );

    it('does not flag an address saved only on a different chain', async () => {
      const result = await validateAddressOrENS(
        checksummedAddress,
        addressBookWith(MAINNET, checksummedAddress),
        [],
        SEPOLIA,
      );

      expect(result.addressError).toBeUndefined();
      expect(result.addToAddressToAddressBook).toBe(true);
    });

    it('flags an address that matches an internal account, ignoring case', async () => {
      const result = await validateAddressOrENS(
        checksummedAddress,
        {},
        [internalAccountWith(lowerCaseAddress)],
        SEPOLIA,
      );

      expect(result.addressError).toBe(CONTACT_ALREADY_SAVED);
      expect(result.addressReady).toBe(true);
      expect(result.addToAddressToAddressBook).toBe(false);
    });

    it('uses the ENS reverse lookup name for an unsaved address', async () => {
      mockDoENSReverseLookup.mockResolvedValue('reverse.eth');

      const result = await validateAddressOrENS(
        checksummedAddress,
        {},
        [],
        SEPOLIA,
      );

      expect(result.toAddressName).toBe('reverse.eth');
      expect(result.addToAddressToAddressBook).toBe(true);
      expect(result.addressError).toBeUndefined();
    });

    it('uses the ENS reverse lookup name without re-adding a saved address', async () => {
      mockDoENSReverseLookup.mockResolvedValue('reverse.eth');

      const result = await validateAddressOrENS(
        checksummedAddress,
        addressBookWith(SEPOLIA, checksummedAddress),
        [],
        SEPOLIA,
      );

      expect(result.toAddressName).toBe('reverse.eth');
      expect(result.addToAddressToAddressBook).toBe(false);
      expect(result.addressError).toBe(CONTACT_ALREADY_SAVED);
    });

    it('rejects a mixed case address with an invalid checksum', async () => {
      const result = await validateAddressOrENS(
        badChecksumAddress,
        {},
        [],
        MAINNET,
      );

      expect(result.addressReady).toBe(false);
      expect(result.addToAddressToAddressBook).toBe(false);
      expect(result.addressError).toBe(strings('transaction.invalid_address'));
      expect(mockDoENSReverseLookup).not.toHaveBeenCalled();
      expect(mockGetERC721AssetSymbol).not.toHaveBeenCalled();
    });
  });

  describe('mainnet token contract check', () => {
    it('warns with SYMBOL_ERROR and errorContinue when the address is a token contract', async () => {
      mockGetERC721AssetSymbol.mockResolvedValue('BAYC');

      const result = await validateAddressOrENS(
        lowerCaseAddress,
        {},
        [],
        MAINNET,
      );

      expect(mockGetERC721AssetSymbol).toHaveBeenCalledWith(checksummedAddress);
      expect(result.addressError).toBe(SYMBOL_ERROR);
      expect(result.errorContinue).toBe(true);
      expect(result.addressReady).toBe(true);
    });

    it('overrides CONTACT_ALREADY_SAVED with SYMBOL_ERROR for a saved token contract', async () => {
      mockGetERC721AssetSymbol.mockResolvedValue('BAYC');

      const result = await validateAddressOrENS(
        checksummedAddress,
        addressBookWith(MAINNET, checksummedAddress),
        [],
        MAINNET,
      );

      expect(result.addressError).toBe(SYMBOL_ERROR);
      expect(result.errorContinue).toBe(true);
    });

    it('treats the address as a regular account when the symbol lookup throws', async () => {
      mockGetERC721AssetSymbol.mockRejectedValue(new Error('not a token'));

      const result = await validateAddressOrENS(
        checksummedAddress,
        {},
        [],
        MAINNET,
      );

      expect(mockGetERC721AssetSymbol).toHaveBeenCalledTimes(1);
      expect(result.addressError).toBeUndefined();
      expect(result.errorContinue).toBeUndefined();
      expect(result.addressReady).toBe(true);
      expect(result.addToAddressToAddressBook).toBe(true);
    });

    it('does not warn when no symbol is returned', async () => {
      const result = await validateAddressOrENS(
        checksummedAddress,
        {},
        [],
        MAINNET,
      );

      expect(mockGetERC721AssetSymbol).toHaveBeenCalledTimes(1);
      expect(result.addressError).toBeUndefined();
      expect(result.errorContinue).toBeUndefined();
    });

    it('skips the token contract check on non-mainnet chains', async () => {
      mockGetERC721AssetSymbol.mockResolvedValue('BAYC');

      const result = await validateAddressOrENS(
        checksummedAddress,
        {},
        [],
        SEPOLIA,
      );

      expect(mockGetERC721AssetSymbol).not.toHaveBeenCalled();
      expect(result.addressError).toBeUndefined();
      expect(result.errorContinue).toBeUndefined();
    });
  });

  describe('with an ENS name', () => {
    it('resolves an unsaved ENS name and marks it addable', async () => {
      mockDoENSLookup.mockResolvedValue(checksummedAddress);

      const result = await validateAddressOrENS(ensName, {}, [], MAINNET);

      expect(mockDoENSLookup).toHaveBeenCalledWith(ensName, MAINNET);
      expect(result).toEqual({
        addressError: undefined,
        toEnsName: ensName,
        addressReady: true,
        toEnsAddress: checksummedAddress,
        addToAddressToAddressBook: true,
        toAddressName: ensName,
        errorContinue: undefined,
        confusableCollection: [],
      });
      expect(mockGetERC721AssetSymbol).not.toHaveBeenCalled();
    });

    it('flags an ENS name that resolves to a saved contact', async () => {
      mockDoENSLookup.mockResolvedValue(lowerCaseAddress);

      const result = await validateAddressOrENS(
        ensName,
        addressBookWith(MAINNET, checksummedAddress),
        [],
        MAINNET,
      );

      expect(result.addressError).toBe(CONTACT_ALREADY_SAVED);
      expect(result.addToAddressToAddressBook).toBe(false);
      expect(result.addressReady).toBe(true);
      expect(result.toEnsAddress).toBe(lowerCaseAddress);
      expect(result.toAddressName).toBe(ensName);
    });

    it('flags an ENS name that resolves to an internal account', async () => {
      mockDoENSLookup.mockResolvedValue(checksummedAddress);

      const result = await validateAddressOrENS(
        ensName,
        {},
        [internalAccountWith(lowerCaseAddress)],
        MAINNET,
      );

      expect(result.addressError).toBe(CONTACT_ALREADY_SAVED);
      expect(result.addToAddressToAddressBook).toBe(false);
    });

    it('reports an unresolved ENS name as not ready', async () => {
      const result = await validateAddressOrENS(ensName, {}, [], MAINNET);

      expect(result).toEqual({
        addressError: strings('transaction.could_not_resolve_ens'),
        toEnsName: ensName,
        addressReady: false,
        toEnsAddress: undefined,
        addToAddressToAddressBook: false,
        toAddressName: undefined,
        errorContinue: undefined,
        confusableCollection: [],
      });
    });

    it('collects confusable characters in the ENS name', async () => {
      // Cyrillic "а" (U+0430) looks like Latin "a"
      const confusableName = 's\u0430fe.eth';

      const result = await validateAddressOrENS(
        confusableName,
        {},
        [],
        MAINNET,
      );

      expect(result.toEnsName).toBe(confusableName);
      expect(result.confusableCollection).toEqual(['\u0430']);
      expect(result.addressError).toBe(
        strings('transaction.could_not_resolve_ens'),
      );
      expect(result.addressReady).toBe(false);
    });
  });

  describe('with other input', () => {
    it('reports invalid_address for a 42+ character string that is not an address', async () => {
      const result = await validateAddressOrENS(
        `0x${'z'.repeat(40)}`,
        {},
        [],
        MAINNET,
      );

      expect(result.addressError).toBe(strings('transaction.invalid_address'));
      expect(result.addressReady).toBe(false);
      expect(result.addToAddressToAddressBook).toBe(false);
      expect(mockDoENSLookup).not.toHaveBeenCalled();
      expect(mockDoENSReverseLookup).not.toHaveBeenCalled();
    });

    it.each([
      ['a partial address', '0x8718765'],
      ['an empty string', ''],
    ])('returns no error for %s', async (_label, input) => {
      const result = await validateAddressOrENS(input, {}, [], MAINNET);

      expect(result).toEqual({
        addressError: undefined,
        toEnsName: undefined,
        addressReady: false,
        toEnsAddress: undefined,
        addToAddressToAddressBook: false,
        toAddressName: undefined,
        errorContinue: undefined,
        confusableCollection: undefined,
      });
      expect(mockDoENSLookup).not.toHaveBeenCalled();
      expect(mockGetERC721AssetSymbol).not.toHaveBeenCalled();
    });
  });
});
