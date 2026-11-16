import {
  selectShouldUseSmartTransaction,
  selectSmartTransactionsEnabled,
  selectSmartTransactionsForCurrentChain,
  // Add the pending selector to test it.
  selectPendingSmartTransactionsBySender,
} from './smartTransactionsController';
import { backgroundState } from '../util/test/initial-root-state';
import { isHardwareAccount } from '../util/address';
import { cloneDeep } from 'lodash';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';

const TEST_ADDRESS_ONE = '0x5a3ca5cd63807ce5e4d7841ab32ce6b6d9bbba2d';
const TEST_ADDRESS_TWO = '0x202637daaefbd7f131f90338a4a6c69f6cd5ce91';

// Stub the accounts selector so that selectSelectedInternalAccountFormattedAddress returns TEST_ADDRESS_ONE
jest.mock('./accountsController', () => ({
  selectSelectedInternalAccountFormattedAddress: jest.fn(
    () => TEST_ADDRESS_ONE,
  ),
  selectSelectedInternalAccountAddress: jest.fn(() => TEST_ADDRESS_ONE),
}));

jest.mock('./tokensController', () => ({
  selectTokensControllerState: jest.fn(),
  selectTokens: jest.fn(() => []),
  selectAllTokens: jest.fn(() => []),
}));

jest.mock('../util/address', () => ({
  isHardwareAccount: jest.fn(() => false),
}));

// Default state is setup to be on mainnet, with smart transactions enabled and opted into
const getDefaultState = () => {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultState: any = {
    engine: {
      backgroundState: cloneDeep(backgroundState),
    },
    swaps: {
      featureFlags: {
        smart_transactions: {
          mobile_active: false,
          extension_active: true,
        },
        smartTransactions: {
          mobileActive: false,
          extensionActive: true,
          mobileActiveIOS: false,
          mobileActiveAndroid: false,
        },
      },
      '0x1': {
        isLive: true,
        featureFlags: {
          smartTransactions: {
            expectedDeadline: 45,
            maxDeadline: 160,
            mobileReturnTxHashAsap: false,
          },
        },
      },
      '0x10': {
        isLive: true,
        featureFlags: {
          smartTransactions: {
            expectedDeadline: 45,
            maxDeadline: 160,
            mobileReturnTxHashAsap: false,
          },
        },
      },
    },
  };
  defaultState.engine.backgroundState.NetworkController.providerConfig = {
    rpcUrl: undefined, // default rpc for chain 0x1
    chainId: '0x1',
  };
  defaultState.engine.backgroundState.SmartTransactionsController.smartTransactionsState.liveness =
    true;
  defaultState.engine.backgroundState.PreferencesController.smartTransactionsOptInStatus =
    true;

  defaultState.engine.backgroundState.SmartTransactionsController.smartTransactionsState.smartTransactions =
    {
      '0x1': [],
    };

  return defaultState;
};

const enableSmartTransactionsFeatureFlag = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
) => {
  state.swaps.featureFlags.smart_transactions.mobile_active = true;
  state.swaps.featureFlags.smartTransactions.mobileActive = true;
};

const setNetworkConfiguration = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
  chainId: string,
  url: string,
  type: 'infura' | 'custom',
) => {
  state.engine.backgroundState.NetworkController.networkConfigurationsByChainId[
    chainId
  ] = {
    blockExplorerUrls: [],
    chainId,
    defaultRpcEndpointIndex: 0,
    name: `Network ${chainId}`,
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        networkClientId: `client-${chainId}`,
        type,
        url,
        failoverUrls: [],
      },
    ],
  };
};

// getAllowedSmartTransactionsChainIds and getIsAllowedRpcUrlForSmartTransactions
// only apply their production rules when NODE_ENV is 'production'.
const withProductionEnv = (fn: () => void) => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    fn();
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
};

describe('SmartTransactionsController Selectors', () => {
  // The result functions depend on mocks and NODE_ENV, which are not selector
  // inputs, so memoized results must not leak between tests.
  beforeEach(() => {
    [
      selectSmartTransactionsEnabled,
      selectShouldUseSmartTransaction,
      selectPendingSmartTransactionsBySender,
    ].forEach((selector) => {
      selector.clearCache();
      selector.memoizedResultFunc.clearCache();
    });
  });

  describe('getSmartTransactionsEnabled', () => {
    it.each([
      ['false', false],
      ['undefined', undefined],
    ])(
      'should return false if the smartTransactions.mobileActive feature flag is %s',
      (_testCaseName, mobileActive) => {
        const state = getDefaultState();
        enableSmartTransactionsFeatureFlag(state);
        expect(selectSmartTransactionsEnabled(state)).toEqual(true);

        const flagOffState = cloneDeep(state);
        flagOffState.swaps.featureFlags.smartTransactions.mobileActive =
          mobileActive;
        const enabled = selectSmartTransactionsEnabled(flagOffState);
        expect(enabled).toEqual(false);
      },
    );
    it('should return false if the global smartTransactions feature flags are missing', () => {
      const state = getDefaultState();
      enableSmartTransactionsFeatureFlag(state);
      delete state.swaps.featureFlags.smartTransactions;
      const enabled = selectSmartTransactionsEnabled(state);
      expect(enabled).toEqual(false);
    });
    it('should return false if smart transactions liveness is false', () => {
      const state = getDefaultState();
      enableSmartTransactionsFeatureFlag(state);
      state.engine.backgroundState.SmartTransactionsController.smartTransactionsState.liveness =
        false;
      const enabled = selectSmartTransactionsEnabled(state);
      expect(enabled).toEqual(false);
    });
    it('should return false if address is hardware account', () => {
      (isHardwareAccount as jest.Mock).mockReturnValueOnce(true);
      const state = getDefaultState();
      enableSmartTransactionsFeatureFlag(state);
      const enabled = selectSmartTransactionsEnabled(state);
      expect(enabled).toEqual(false);
    });
    it('should return false if is mainnet and not the default RPC', () => {
      withProductionEnv(() => {
        const state = getDefaultState();
        enableSmartTransactionsFeatureFlag(state);
        expect(selectSmartTransactionsEnabled(state)).toEqual(true);

        const customRpcState = cloneDeep(state);
        setNetworkConfiguration(
          customRpcState,
          '0x1',
          'https://example.com',
          'custom',
        );
        customRpcState.engine.backgroundState.NetworkController.networkConfigurationsByChainId[
          '0x1'
        ].rpcEndpoints[0].networkClientId = 'mainnet';
        const enabled = selectSmartTransactionsEnabled(customRpcState);
        expect(enabled).toEqual(false);
      });
    });
    it('should return false if the current chain is not in the allowed smart transactions chain list', () => {
      const state = getDefaultState();
      enableSmartTransactionsFeatureFlag(state);
      setNetworkConfiguration(
        state,
        '0x89',
        'https://polygon-mainnet.infura.io/v3/{infuraProjectId}',
        'infura',
      );
      state.engine.backgroundState.NetworkController.selectedNetworkClientId =
        'client-0x89';
      const enabled = selectSmartTransactionsEnabled(state);
      expect(enabled).toEqual(false);
    });
    it('should return false if the transaction chain is not in the allowed smart transactions chain list', () => {
      const state = getDefaultState();
      enableSmartTransactionsFeatureFlag(state);
      setNetworkConfiguration(
        state,
        '0x89',
        'https://polygon-mainnet.infura.io/v3/{infuraProjectId}',
        'infura',
      );
      expect(selectSmartTransactionsEnabled(state)).toEqual(true);
      const enabled = selectSmartTransactionsEnabled(state, '0x89');
      expect(enabled).toEqual(false);
    });
    it('should return false if the transaction chain is allowed but its default RPC is a custom endpoint', () => {
      withProductionEnv(() => {
        const state = getDefaultState();
        enableSmartTransactionsFeatureFlag(state);
        setNetworkConfiguration(
          state,
          '0x38',
          'https://bsc-rpc.example.com',
          'custom',
        );
        // Global chain 0x1 uses Infura, so only the 0x38 RPC lookup can fail.
        expect(selectSmartTransactionsEnabled(state)).toEqual(true);
        const enabled = selectSmartTransactionsEnabled(state, '0x38');
        expect(enabled).toEqual(false);
      });
    });
    it('should return true if the transaction chain is allowed and its default RPC is an Infura endpoint', () => {
      withProductionEnv(() => {
        const state = getDefaultState();
        enableSmartTransactionsFeatureFlag(state);
        setNetworkConfiguration(
          state,
          '0x38',
          'https://bsc-mainnet.infura.io/v3/{infuraProjectId}',
          'infura',
        );
        const enabled = selectSmartTransactionsEnabled(state, '0x38');
        expect(enabled).toEqual(true);
      });
    });
    it('should use the transaction chain RPC rather than the global chain RPC', () => {
      withProductionEnv(() => {
        const state = getDefaultState();
        enableSmartTransactionsFeatureFlag(state);
        setNetworkConfiguration(state, '0x1', 'https://example.com', 'custom');
        state.engine.backgroundState.NetworkController.networkConfigurationsByChainId[
          '0x1'
        ].rpcEndpoints[0].networkClientId = 'mainnet';
        setNetworkConfiguration(
          state,
          '0x38',
          'https://bsc-mainnet.infura.io/v3/{infuraProjectId}',
          'infura',
        );
        expect(selectSmartTransactionsEnabled(state)).toEqual(false);
        expect(selectSmartTransactionsEnabled(state, '0x38')).toEqual(true);
      });
    });
    it('should return true if smart transactions are enabled', () => {
      const state = getDefaultState();
      state.swaps.featureFlags.smart_transactions.mobile_active = true;
      state.swaps.featureFlags.smartTransactions.mobileActive = true;
      const enabled = selectSmartTransactionsEnabled(state);
      expect(enabled).toEqual(true);
    });
  });

  describe('getShouldUseSmartTransaction', () => {
    it('should return false if smart transactions are not opted into', () => {
      const state = getDefaultState();
      enableSmartTransactionsFeatureFlag(state);
      state.engine.backgroundState.PreferencesController.smartTransactionsOptInStatus =
        false;
      const shouldUseSmartTransaction = selectShouldUseSmartTransaction(state);
      expect(shouldUseSmartTransaction).toEqual(false);
    });
    it('should return false if smart transactions are not enabled', () => {
      const state = getDefaultState();
      enableSmartTransactionsFeatureFlag(state);
      state.swaps.featureFlags.smartTransactions.mobileActive = false;
      const shouldUseSmartTransaction = selectShouldUseSmartTransaction(state);
      expect(shouldUseSmartTransaction).toEqual(false);
    });
    it('should return true if smart transactions are enabled and opted into', () => {
      const state = getDefaultState();
      state.swaps.featureFlags.smart_transactions.mobile_active = true;
      state.swaps.featureFlags.smartTransactions.mobileActive = true;
      const shouldUseSmartTransaction = selectShouldUseSmartTransaction(state);
      expect(shouldUseSmartTransaction).toEqual(true);
    });
    it('should accept an optional chainId parameter', () => {
      const state = getDefaultState();
      enableSmartTransactionsFeatureFlag(state);
      const shouldUseSmartTransaction = selectShouldUseSmartTransaction(
        state,
        '0x1',
      );
      expect(shouldUseSmartTransaction).toEqual(true);
    });
    it('should evaluate the chainId parameter instead of the global chain', () => {
      withProductionEnv(() => {
        const state = getDefaultState();
        enableSmartTransactionsFeatureFlag(state);
        setNetworkConfiguration(
          state,
          '0x38',
          'https://bsc-rpc.example.com',
          'custom',
        );
        expect(selectShouldUseSmartTransaction(state)).toEqual(true);
        expect(selectShouldUseSmartTransaction(state, '0x38')).toEqual(false);
        expect(selectShouldUseSmartTransaction(state, '0x89')).toEqual(false);
      });
    });
  });

  describe('getSmartTransactionsForCurrentChain', () => {
    it('should return the smart transactions for the current chain', () => {
      const state = getDefaultState();
      state.engine.backgroundState.SmartTransactionsController.smartTransactionsState.smartTransactions[
        '0x1'
      ] = [
        {
          id: '1',
          status: 'pending',
          type: 'swap',
        },
      ];
      const smartTransactions = selectSmartTransactionsForCurrentChain(state);
      expect(smartTransactions).toEqual([
        {
          id: '1',
          status: 'pending',
          type: 'swap',
        },
      ]);
    });
    it('should return an empty array if there are no smart transactions for the current chain', () => {
      const state = getDefaultState();
      const smartTransactions = selectSmartTransactionsForCurrentChain(state);
      expect(smartTransactions).toEqual([]);
    });
  });

  describe('selectPendingSmartTransactionsBySender', () => {
    it('should return an empty array if there are no smart transactions for the current chain', () => {
      const state = getDefaultState();
      // Ensure no transactions for chain '0x1'
      state.engine.backgroundState.SmartTransactionsController.smartTransactionsState.smartTransactions[
        '0x1'
      ] = [];
      const pending = selectPendingSmartTransactionsBySender(state);
      expect(pending).toEqual([]);
    });

    it('should filter out transactions that do not match the selected sender', () => {
      const state = getDefaultState();
      // Two transactions, one with matching sender and one not matching
      state.engine.backgroundState.SmartTransactionsController.smartTransactionsState.smartTransactions[
        '0x1'
      ] = [
        {
          uuid: 'tx1',
          txParams: { from: TEST_ADDRESS_ONE },
          status: 'pending',
        },
        {
          uuid: 'tx2',
          txParams: { from: TEST_ADDRESS_TWO },
          status: 'pending',
        },
      ];
      const pending = selectPendingSmartTransactionsBySender(state);
      // Only the transaction from TEST_ADDRESS_ONE (case-insensitive) should be returned
      expect(pending).toEqual([
        {
          uuid: 'tx1',
          txParams: { from: TEST_ADDRESS_ONE },
          status: 'pending',
          id: 'tx1',
          isSmartTransaction: true,
        },
      ]);
    });

    it('should filter out transactions with status SUCCESS or CANCELLED', () => {
      const state = getDefaultState();
      state.engine.backgroundState.SmartTransactionsController.smartTransactionsState.smartTransactions[
        '0x1'
      ] = [
        {
          uuid: 'tx1',
          txParams: { from: TEST_ADDRESS_ONE },
          status: SmartTransactionStatuses.SUCCESS,
        },
        {
          uuid: 'tx2',
          txParams: { from: TEST_ADDRESS_ONE },
          status: SmartTransactionStatuses.CANCELLED,
        },
        {
          uuid: 'tx3',
          txParams: { from: TEST_ADDRESS_ONE },
          status: SmartTransactionStatuses.PENDING,
        },
      ];
      const pending = selectPendingSmartTransactionsBySender(state);
      expect(pending).toEqual([
        {
          uuid: 'tx3',
          txParams: { from: TEST_ADDRESS_ONE },
          status: SmartTransactionStatuses.PENDING,
          id: 'tx3',
          isSmartTransaction: true,
        },
      ]);
    });

    it.each([
      SmartTransactionStatuses.CANCELLED_USER_CANCELLED,
      'cancelled_deadline_missed',
    ])('should normalise status %s to cancelled', (cancelledStatus) => {
      const state = getDefaultState();
      state.engine.backgroundState.SmartTransactionsController.smartTransactionsState.smartTransactions[
        '0x1'
      ] = [
        {
          uuid: 'tx1',
          txParams: { from: TEST_ADDRESS_ONE },
          status: cancelledStatus,
        },
      ];
      const pending = selectPendingSmartTransactionsBySender(state);
      expect(pending).toEqual([
        {
          uuid: 'tx1',
          txParams: { from: TEST_ADDRESS_ONE },
          status: SmartTransactionStatuses.CANCELLED,
          id: 'tx1',
          isSmartTransaction: true,
        },
      ]);
    });

    it('should only return transactions for the current chain', () => {
      const state = getDefaultState();
      state.engine.backgroundState.SmartTransactionsController.smartTransactionsState.smartTransactions[
        '0x38'
      ] = [
        {
          uuid: 'tx-bsc',
          txParams: { from: TEST_ADDRESS_ONE },
          status: SmartTransactionStatuses.PENDING,
        },
      ];
      const pending = selectPendingSmartTransactionsBySender(state);
      expect(pending).toEqual([]);
    });
  });
});
