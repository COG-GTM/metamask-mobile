import { PermissionDoesNotExistError } from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  caip25CaveatBuilder,
  getPermittedEthChainIds,
  setPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import { providerErrors } from '@metamask/rpc-errors';
import type { Hex } from '@metamask/utils';
import { checkWCPermissions } from './wc-utils';
import {
  getDefaultCaip25CaveatValue,
  removePermittedChain,
} from '../Permissions';
import Engine from '../Engine';
import MetaMetrics from '../Analytics/MetaMetrics';
import { MetricsEventBuilder } from '../Analytics/MetricsEventBuilder';
import { selectProviderConfig } from '../../selectors/networkController';

type Caip25Value = ReturnType<typeof getDefaultCaip25CaveatValue>;

const mockSubjects: Record<string, Caip25Value> = {};

jest.mock('../Analytics/MetaMetrics');
jest.mock('../Analytics/MetricsEventBuilder');

jest.mock('../Engine', () => ({
  controllerMessenger: { call: jest.fn() },
  context: {
    ApprovalController: {
      clear: jest.fn(),
      add: jest.fn(),
      has: jest.fn().mockReturnValue(false),
    },
    PermissionController: {
      getCaveat: jest.fn(),
      updateCaveat: jest.fn(),
      grantPermissionsIncremental: jest.fn(),
    },
    NetworkController: { getNetworkConfigurationByChainId: jest.fn() },
    MultichainNetworkController: { setActiveNetwork: jest.fn() },
    SelectedNetworkController: { setNetworkClientIdForDomain: jest.fn() },
  },
}));

jest.mock('../Permissions', () => ({
  ...jest.requireActual('../Permissions'),
  getPermittedAccounts: jest.fn().mockReturnValue([]),
}));

jest.mock('../../util/permissions', () => ({
  ...jest.requireActual('../../util/permissions'),
  rejectOriginPendingApprovals: jest.fn(),
}));

jest.mock('../../store', () => ({
  store: { getState: jest.fn().mockReturnValue({}) },
}));

jest.mock('../../selectors/networkController', () => ({
  selectNetworkConfigurations: jest.fn().mockReturnValue({
    '0x1': {
      chainId: '0x1',
      name: 'Ethereum',
      nativeCurrency: 'ETH',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [{ networkClientId: 'mainnet', url: 'https://m.test' }],
    },
    '0x89': {
      chainId: '0x89',
      name: 'Polygon',
      nativeCurrency: 'POL',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [{ networkClientId: 'polygon', url: 'https://p.test' }],
    },
  }),
  selectProviderConfig: jest.fn().mockReturnValue({ chainId: '0x1' }),
}));

jest.mock('../SDKConnect/utils/DevLogger', () => ({ log: jest.fn() }));

const SUBJECT = 'dapp.example';

// Mirrors how the real PermissionController merges incremental CAIP-25 grants.
const { merger: caip25Merger } = caip25CaveatBuilder({
  findNetworkClientIdByChainId: jest.fn(),
  listAccounts: jest.fn().mockReturnValue([]),
  isNonEvmScopeSupported: jest.fn(),
  getNonEvmAccountAddresses: jest.fn().mockReturnValue([]),
});

const {
  PermissionController,
  ApprovalController,
  MultichainNetworkController,
} = Engine.context as unknown as {
  PermissionController: Record<string, jest.Mock>;
  ApprovalController: Record<string, jest.Mock>;
  MultichainNetworkController: Record<string, jest.Mock>;
};

const permittedChains = (subject: string) =>
  mockSubjects[subject] ? getPermittedEthChainIds(mockSubjects[subject]) : [];

describe('checkWCPermissions wallet_switchEthereumChain approval', () => {
  const originalChainPermissions = process.env.MM_CHAIN_PERMISSIONS;

  beforeAll(() => {
    process.env.MM_CHAIN_PERMISSIONS = 'true';
  });

  afterAll(() => {
    process.env.MM_CHAIN_PERMISSIONS = originalChainPermissions;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockSubjects).forEach((key) => delete mockSubjects[key]);
    mockSubjects[SUBJECT] = setPermittedEthChainIds(
      getDefaultCaip25CaveatValue(),
      ['0x1'],
    );
    (selectProviderConfig as unknown as jest.Mock).mockReturnValue({
      chainId: '0x1',
    });

    PermissionController.getCaveat.mockImplementation((origin: string) => {
      if (!mockSubjects[origin]) {
        throw new PermissionDoesNotExistError(
          origin,
          Caip25EndowmentPermissionName,
        );
      }
      return { type: Caip25CaveatType, value: mockSubjects[origin] };
    });
    PermissionController.updateCaveat.mockImplementation(
      (origin: string, _target: string, _type: string, value: Caip25Value) => {
        mockSubjects[origin] = value;
      },
    );
    PermissionController.grantPermissionsIncremental.mockImplementation(
      ({
        subject,
        approvedPermissions,
      }: {
        subject: { origin: string };
        approvedPermissions: Record<
          string,
          { caveats: { value: Caip25Value }[] }
        >;
      }) => {
        const incoming =
          approvedPermissions[Caip25EndowmentPermissionName].caveats[0].value;
        const existing = mockSubjects[subject.origin];
        mockSubjects[subject.origin] = existing
          ? (caip25Merger(existing, incoming)?.[0] as Caip25Value)
          : incoming;
      },
    );
    ApprovalController.add.mockResolvedValue({});

    (MetaMetrics.getInstance as jest.Mock).mockReturnValue({
      trackEvent: jest.fn(),
    });
    (MetricsEventBuilder.createEventBuilder as jest.Mock).mockReturnValue({
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    });
  });

  it.each([
    ['a bare hostname', SUBJECT, `https://${SUBJECT}`],
    ['a full URL', `https://${SUBJECT}/app`, `https://${SUBJECT}/app`],
  ])(
    'prompts before switching to an unpermitted chain when the origin is %s',
    async (_label, origin, expectedPageUrl) => {
      const allowed = await checkWCPermissions({
        origin,
        caip2ChainId: 'eip155:137',
        allowSwitchingToNewChain: true,
      });

      expect(allowed).toBe(true);
      expect(ApprovalController.add).toHaveBeenCalledTimes(1);
      expect(ApprovalController.add).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: SUBJECT,
          type: 'SWITCH_ETHEREUM_CHAIN',
          requestData: expect.objectContaining({
            chainId: '0x89',
            pageMeta: { url: expectedPageUrl },
          }),
        }),
      );
      const { pageMeta } = ApprovalController.add.mock.calls[0][0].requestData;
      expect(new URL(pageMeta.url).hostname).toBe(SUBJECT);
      expect(PermissionController.updateCaveat).not.toHaveBeenCalled();
      expect(permittedChains(SUBJECT)).toEqual(['0x1', '0x89']);
      expect(Object.keys(mockSubjects)).toEqual([SUBJECT]);
      expect(MultichainNetworkController.setActiveNetwork).toHaveBeenCalledWith(
        'polygon',
      );
    },
  );

  it('does not grant the chain before the user has approved', async () => {
    let chainsWhilePrompting: Hex[] = [];
    ApprovalController.add.mockImplementation(async () => {
      chainsWhilePrompting = permittedChains(SUBJECT);
      return {};
    });

    await checkWCPermissions({
      origin: SUBJECT,
      caip2ChainId: 'eip155:137',
      allowSwitchingToNewChain: true,
    });

    expect(chainsWhilePrompting).toEqual(['0x1']);
  });

  it('leaves permissions and network unchanged when the user rejects', async () => {
    ApprovalController.add.mockRejectedValue(
      providerErrors.userRejectedRequest(),
    );

    const allowed = await checkWCPermissions({
      origin: SUBJECT,
      caip2ChainId: 'eip155:137',
      allowSwitchingToNewChain: true,
    });

    expect(allowed).toBe(false);
    expect(permittedChains(SUBJECT)).toEqual(['0x1']);
    expect(PermissionController.updateCaveat).not.toHaveBeenCalled();
    expect(
      PermissionController.grantPermissionsIncremental,
    ).not.toHaveBeenCalled();
    expect(MultichainNetworkController.setActiveNetwork).not.toHaveBeenCalled();
  });

  it('prompts when the unpermitted chain is already the active network', async () => {
    (selectProviderConfig as unknown as jest.Mock).mockReturnValue({
      chainId: '0x89',
    });

    const allowed = await checkWCPermissions({
      origin: SUBJECT,
      caip2ChainId: 'eip155:137',
      allowSwitchingToNewChain: true,
    });

    expect(allowed).toBe(true);
    expect(ApprovalController.add).toHaveBeenCalledTimes(1);
    expect(permittedChains(SUBJECT)).toEqual(['0x1', '0x89']);
  });

  it('switches to an already permitted chain without prompting', async () => {
    mockSubjects[SUBJECT] = setPermittedEthChainIds(
      getDefaultCaip25CaveatValue(),
      ['0x1', '0x89'],
    );

    const allowed = await checkWCPermissions({
      origin: SUBJECT,
      caip2ChainId: 'eip155:137',
      allowSwitchingToNewChain: true,
    });

    expect(allowed).toBe(true);
    expect(ApprovalController.add).not.toHaveBeenCalled();
    expect(MultichainNetworkController.setActiveNetwork).toHaveBeenCalledWith(
      'polygon',
    );
  });

  it('removePermittedChain revokes a chain from a real CAIP-25 caveat', () => {
    mockSubjects[SUBJECT] = setPermittedEthChainIds(
      getDefaultCaip25CaveatValue(),
      ['0x1', '0x89'],
    );

    removePermittedChain(SUBJECT, '0x89');

    expect(permittedChains(SUBJECT)).toEqual(['0x1']);
  });
});
