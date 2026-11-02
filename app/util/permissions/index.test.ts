import Engine from '../../core/Engine';
import { CaveatSpecificationConstraint, ExtractPermission, PermissionSpecificationConstraint, SubjectPermissions } from '@metamask/permission-controller';
import { Caip25CaveatType, Caip25EndowmentPermissionName, caip25CaveatBuilder } from '@metamask/chain-agnostic-permission';
import { EthAccountType, SolAccountType } from '@metamask/keyring-api';
import { PermissionKeys } from '../../core/Permissions/specifications';
import { pick } from 'lodash';
import { CaveatTypes } from '../../core/Permissions/constants';
import { getCaip25PermissionFromLegacyPermissions, rejectOriginApprovals, requestPermittedChainsPermissionIncremental } from './index';
import { providerErrors } from '@metamask/rpc-errors';
import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';

jest.mock('../../core/Engine', () => ({
  controllerMessenger: {
    call: jest.fn(),
  },
  context: {
    ApprovalController: {
      reject: jest.fn(),
      state: {
        pendingApprovals: {}
      }
    },
    PermissionController: {
      requestPermissionsIncremental: jest.fn(),
      grantPermissionsIncremental: jest.fn(),
    },
    AccountsController: {
      listAccounts: jest.fn(),
    },
  },
}));

const mockRequestPermissionsIncremental = Engine.context.PermissionController.requestPermissionsIncremental as jest.Mock;
const mockGrantPermissionsIncremental = Engine.context.PermissionController.grantPermissionsIncremental as jest.Mock;
const mockReject = Engine.context.ApprovalController.reject as jest.Mock;
const mockListAccounts = Engine.context.AccountsController.listAccounts as jest.Mock;

const WALLET_ADDRESS = '0x0000000000000000000000000000000000000001';
const WALLET_ADDRESS_MIXED_CASE = '0xAbCdEf0000000000000000000000000000000002';
const NON_EVM_ADDRESS = '0x0000000000000000000000000000000000000003';
const UNKNOWN_ADDRESS = '0x00000000000000000000000000000000000000ff';
const mockWalletAccounts = [
  { address: WALLET_ADDRESS, type: EthAccountType.Eoa },
  { address: WALLET_ADDRESS_MIXED_CASE, type: EthAccountType.Erc4337 },
  { address: '0xdeadbeef', type: EthAccountType.Eoa },
  { address: NON_EVM_ADDRESS, type: SolAccountType.DataAccount },
];

describe('Permission Utils', () => {
  beforeEach(() => {
    mockListAccounts.mockImplementation(() => mockWalletAccounts);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPermittedChainsPermissionIncremental', () => {
    it('throws if the origin is snapId', async () => {
      await expect(() =>
        requestPermittedChainsPermissionIncremental({
          origin: 'npm:snap',
          chainId: '0x1',
          autoApprove: false,
        }),
      ).rejects.toThrow(
        new Error(
          'Cannot request permittedChains permission for Snaps with origin "npm:snap"',
        ),
      );
    });

    it('requests permittedChains approval if autoApprove: false', async () => {
      const subjectPermissions: Partial<
        SubjectPermissions<
          ExtractPermission<
            PermissionSpecificationConstraint,
            CaveatSpecificationConstraint
          >
        >
      > = {
        [Caip25EndowmentPermissionName]: {
          id: 'id',
          date: 1,
          invoker: 'origin',
          parentCapability: PermissionKeys.permittedChains,
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: { 'eip155:1': { accounts: [] } },
                isMultichainOrigin: false,
                sessionProperties: {},
              },
            },
          ],
        },
      };

      const expectedCaip25Permission = {
        [Caip25EndowmentPermissionName]: pick(
          subjectPermissions[Caip25EndowmentPermissionName],
          'caveats',
        ),
      };

      mockRequestPermissionsIncremental.
        mockResolvedValue([
          subjectPermissions,
          { id: 'id', origin: 'origin' },
        ]);

      await requestPermittedChainsPermissionIncremental({
        origin: 'test.com',
        chainId: '0x1',
        autoApprove: false,
      });

      expect(
        mockRequestPermissionsIncremental,
      ).toHaveBeenCalledWith({ origin: 'test.com' }, expectedCaip25Permission);
    });

    it('throws if permittedChains approval is rejected', async () => {
      mockRequestPermissionsIncremental
        .mockRejectedValue(new Error('approval rejected'));

      await expect(() =>
        requestPermittedChainsPermissionIncremental({
          origin: 'test.com',
          chainId: '0x1',
          autoApprove: false,
        }),
      ).rejects.toThrow(new Error('approval rejected'));
    });

    it('grants permittedChains approval if autoApprove: true', async () => {
      const subjectPermissions: Partial<
        SubjectPermissions<
          ExtractPermission<
            PermissionSpecificationConstraint,
            CaveatSpecificationConstraint
          >
        >
      > = {
        [Caip25EndowmentPermissionName]: {
          id: 'id',
          date: 1,
          invoker: 'origin',
          parentCapability: PermissionKeys.permittedChains,
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: { 'eip155:1': { accounts: [] } },
                isMultichainOrigin: false,
                sessionProperties: {},
              },
            },
          ],
        },
      };

      const expectedCaip25Permission = {
        [Caip25EndowmentPermissionName]: pick(
          subjectPermissions[Caip25EndowmentPermissionName],
          'caveats',
        ),
      };

      mockGrantPermissionsIncremental
        .mockReturnValue(subjectPermissions);

      await requestPermittedChainsPermissionIncremental({
        origin: 'test.com',
        chainId: '0x1',
        autoApprove: true,
      });

      expect(
        mockGrantPermissionsIncremental,
      ).toHaveBeenCalledWith({
        subject: { origin: 'test.com' },
        approvedPermissions: expectedCaip25Permission,
      });
    });

    it('throws if autoApprove: true and granting permittedChains throws', async () => {
      mockGrantPermissionsIncremental.mockImplementation(() => {
        throw new Error('Invalid merged permissions for subject "test.com"');
      });

      await expect(() =>
        requestPermittedChainsPermissionIncremental({
          origin: 'test.com',
          chainId: '0x1',
          autoApprove: true,
        }),
      ).rejects.toThrow(
        new Error('Invalid merged permissions for subject "test.com"'),
      );
    });
  });

  describe('getCaip25PermissionFromLegacyPermissions', () => {
    const requestAccounts = (accounts: unknown[]) =>
      getCaip25PermissionFromLegacyPermissions('https://mallory.example', {
        [PermissionKeys.eth_accounts]: {
          caveats: [
            {
              type: CaveatTypes.restrictReturnedAccounts,
              value: accounts as `0x${string}`[],
            },
          ],
        },
      });

    const getRequestedWalletAccounts = (accounts: unknown[]) =>
      (
        requestAccounts(accounts)[Caip25EndowmentPermissionName].caveats?.[0]
          .value as { optionalScopes: Record<string, { accounts: string[] }> }
      ).optionalScopes['wallet:eip155'].accounts;

    it('drops requested addresses that are not in the wallet', () => {
      expect(getRequestedWalletAccounts([UNKNOWN_ADDRESS])).toStrictEqual([]);
    });

    it('keeps only wallet addresses (case-insensitive, deduplicated, wallet casing) from a mixed request', () => {
      expect(
        getRequestedWalletAccounts([
          UNKNOWN_ADDRESS,
          WALLET_ADDRESS_MIXED_CASE.toLowerCase(),
          WALLET_ADDRESS,
          WALLET_ADDRESS_MIXED_CASE.toUpperCase().replace('0X', '0x'),
          42,
        ]),
      ).toStrictEqual([
        `wallet:eip155:${WALLET_ADDRESS_MIXED_CASE}`,
        `wallet:eip155:${WALLET_ADDRESS}`,
      ]);
    });

    it('does not match non-EVM wallet accounts', () => {
      expect(getRequestedWalletAccounts([NON_EVM_ADDRESS])).toStrictEqual([]);
    });

    it('passes pre-approval CAIP-25 caveat validation whether or not the requested address is in the wallet', () => {
      const { validator } = caip25CaveatBuilder({
        listAccounts: () => mockWalletAccounts as never,
        findNetworkClientIdByChainId: () => 'mainnet',
        isNonEvmScopeSupported: () => false,
        getNonEvmAccountAddresses: () => [],
      });
      const validate = (address: string) => () =>
        validator?.(
          requestAccounts([address])[Caip25EndowmentPermissionName]
            .caveats?.[0] as never,
          'https://mallory.example',
          Caip25EndowmentPermissionName,
        );

      expect(validate(WALLET_ADDRESS)).not.toThrow();
      expect(validate(UNKNOWN_ADDRESS)).not.toThrow();
    });

    it('returns valid CAIP-25 permissions', async () => {
      const permissions = await getCaip25PermissionFromLegacyPermissions(
        'test.com',
        {},
      );

      expect(permissions).toStrictEqual(
        expect.objectContaining({
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'wallet:eip155': {
                      accounts: [],
                    },
                  },
                  isMultichainOrigin: false,
                  sessionProperties: {},
                },
              },
            ],
          },
        }),
      );
    });

    it('returns approval from the PermissionsController for eth_accounts and permittedChains when only eth_accounts is specified in params and origin is not snapId', async () => {
      const permissions = await getCaip25PermissionFromLegacyPermissions(
        'test.com',
        {
          [PermissionKeys.eth_accounts]: {
            caveats: [
              {
                type: CaveatTypes.restrictReturnedAccounts,
                value: ['0x0000000000000000000000000000000000000001'],
              },
            ],
          },
        },
      );

      expect(permissions).toStrictEqual(
        expect.objectContaining({
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'wallet:eip155': {
                      accounts: [
                        'wallet:eip155:0x0000000000000000000000000000000000000001',
                      ],
                    },
                  },
                  isMultichainOrigin: false,
                  sessionProperties: {},
                },
              },
            ],
          },
        }),
      );
    });

    it('returns approval from the PermissionsControllerr for eth_accounts and permittedChains when only permittedChains is specified in params and origin is not snapId', async () => {
      const permissions = await getCaip25PermissionFromLegacyPermissions(
        'test.com',
        {
          [PermissionKeys.permittedChains]: {
            caveats: [
              {
                type: CaveatTypes.restrictNetworkSwitching,
                value: ['0x64'],
              },
            ],
          },
        },
      );

      expect(permissions).toStrictEqual(
        expect.objectContaining({
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'wallet:eip155': {
                      accounts: [],
                    },
                    'eip155:100': {
                      accounts: [],
                    },
                  },
                  isMultichainOrigin: false,
                  sessionProperties: {},
                },
              },
            ],
          },
        }),
      );
    });

    it('returns approval from the PermissionsController for eth_accounts and permittedChains when both are specified in params and origin is not snapId', async () => {
      const permissions = await getCaip25PermissionFromLegacyPermissions(
        'test.com',
        {
          [PermissionKeys.eth_accounts]: {
            caveats: [
              {
                type: CaveatTypes.restrictReturnedAccounts,
                value: ['0x0000000000000000000000000000000000000001'],
              },
            ],
          },
          [PermissionKeys.permittedChains]: {
            caveats: [
              {
                type: CaveatTypes.restrictNetworkSwitching,
                value: ['0x64'],
              },
            ],
          },
        },
      );

      expect(permissions).toStrictEqual(
        expect.objectContaining({
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'wallet:eip155': {
                      accounts: [
                        'wallet:eip155:0x0000000000000000000000000000000000000001',
                      ],
                    },
                    'eip155:100': {
                      accounts: [
                        'eip155:100:0x0000000000000000000000000000000000000001',
                      ],
                    },
                  },
                  isMultichainOrigin: false,
                  sessionProperties: {},
                },
              },
            ],
          },
        }),
      );
    });

    it('returns approval from the PermissionsController for only eth_accounts when only eth_accounts is specified in params and origin is snapId', async () => {
      const permissions = await getCaip25PermissionFromLegacyPermissions(
        'npm:snap',
        {
          [PermissionKeys.eth_accounts]: {
            caveats: [
              {
                type: CaveatTypes.restrictReturnedAccounts,
                value: ['0x0000000000000000000000000000000000000001'],
              },
            ],
          },
        },
      );

      expect(permissions).toStrictEqual(
        expect.objectContaining({
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'wallet:eip155': {
                      accounts: [
                        'wallet:eip155:0x0000000000000000000000000000000000000001',
                      ],
                    },
                  },
                  isMultichainOrigin: false,
                  sessionProperties: {},
                },
              },
            ],
          },
        }),
      );
    });

    it('returns approval from the PermissionsController for only eth_accounts when only permittedChains is specified in params and origin is snapId', async () => {
      const permissions = await getCaip25PermissionFromLegacyPermissions(
        'npm:snap',
        {
          [PermissionKeys.permittedChains]: {
            caveats: [
              {
                type: CaveatTypes.restrictNetworkSwitching,
                value: ['0x64'],
              },
            ],
          },
        },
      );

      expect(permissions).toStrictEqual(
        expect.objectContaining({
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'wallet:eip155': {
                      accounts: [],
                    },
                  },
                  isMultichainOrigin: false,
                  sessionProperties: {},
                },
              },
            ],
          },
        }),
      );
    });

    it('returns approval from the PermissionsController for only eth_accounts when both eth_accounts and permittedChains are specified in params and origin is snapId', async () => {
      const permissions = await getCaip25PermissionFromLegacyPermissions(
        'npm:snap',
        {
          [PermissionKeys.eth_accounts]: {
            caveats: [
              {
                type: CaveatTypes.restrictReturnedAccounts,
                value: ['0x0000000000000000000000000000000000000001'],
              },
            ],
          },
          [PermissionKeys.permittedChains]: {
            caveats: [
              {
                type: CaveatTypes.restrictNetworkSwitching,
                value: ['0x64'],
              },
            ],
          },
        },
      );

      expect(permissions).toStrictEqual(
        expect.objectContaining({
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'wallet:eip155': {
                      accounts: [
                        'wallet:eip155:0x0000000000000000000000000000000000000001',
                      ],
                    },
                  },
                  isMultichainOrigin: false,
                  sessionProperties: {},
                },
              },
            ],
          },
        }),
      );
    });

    it('returns CAIP-25 approval with accounts and chainIds specified from `eth_accounts` and `endowment:permittedChains` permissions caveats, and isMultichainOrigin: false if origin is not snapId', async () => {
      const permissions = await getCaip25PermissionFromLegacyPermissions(
        'test.com',
        {
          [PermissionKeys.eth_accounts]: {
            caveats: [
              {
                type: 'restrictReturnedAccounts',
                value: ['0xdeadbeef'],
              },
            ],
          },
          [PermissionKeys.permittedChains]: {
            caveats: [
              {
                type: 'restrictNetworkSwitching',
                value: ['0x1', '0x5'],
              },
            ],
          },
        },
      );

      expect(permissions).toStrictEqual(
        expect.objectContaining({
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'wallet:eip155': {
                      accounts: ['wallet:eip155:0xdeadbeef'],
                    },
                    'eip155:1': {
                      accounts: ['eip155:1:0xdeadbeef'],
                    },
                    'eip155:5': {
                      accounts: ['eip155:5:0xdeadbeef'],
                    },
                  },
                  isMultichainOrigin: false,
                  sessionProperties: {},
                },
              },
            ],
          },
        }),
      );
    });

    it('returns CAIP-25 approval with approved accounts for the `wallet:eip155` scope (and no approved chainIds) with isMultichainOrigin: false if origin is snapId', async () => {
      const origin = 'npm:snap';

      const permissions = await getCaip25PermissionFromLegacyPermissions(
        origin,
        {
          [PermissionKeys.eth_accounts]: {
            caveats: [
              {
                type: 'restrictReturnedAccounts',
                value: ['0xdeadbeef'],
              },
            ],
          },
          [PermissionKeys.permittedChains]: {
            caveats: [
              {
                type: 'restrictNetworkSwitching',
                value: ['0x1', '0x5'],
              },
            ],
          },
        },
      );

      expect(permissions).toStrictEqual(
        expect.objectContaining({
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'wallet:eip155': {
                      accounts: ['wallet:eip155:0xdeadbeef'],
                    },
                  },
                  isMultichainOrigin: false,
                  sessionProperties: {},
                },
              },
            ],
          },
        }),
      );
    });
  });

  describe('rejectOriginApprovals', () => {
    const id = '123';
    const origin = 'https://example.com';

    beforeEach(() => {
      Engine.context.ApprovalController.state.pendingApprovals = { [id]: { id, origin } as ApprovalRequest<Record<string, Json>> };
    });

    afterEach(() => {
      Engine.context.ApprovalController.state.pendingApprovals = {};
    });

    it('rejects approval requests from given origin', () => {
      const mockId = '123';
      rejectOriginApprovals({
        deleteInterface: () => undefined,
        origin: 'https://example.com',
      });

      expect(mockReject).toHaveBeenCalledTimes(1);
      expect(mockReject).toHaveBeenCalledWith(
        mockId,
        providerErrors.userRejectedRequest(),
      );
    });
  });
});
