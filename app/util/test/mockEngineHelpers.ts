/**
 * Mock Engine Helpers
 *
 * This module provides reusable mock factories for creating Engine mocks in tests.
 * Instead of creating extensive inline mocks in each test file, use these helpers
 * to create consistent, maintainable mock objects.
 *
 * USAGE PATTERNS:
 *
 * 1. For new test files, use the factory directly in jest.mock():
 * @example
 * // Basic usage - creates a complete Engine mock with all controllers
 * jest.mock('../../../core/Engine', () =>
 *   require('../../../util/test/mockEngineHelpers').createMockEngine()
 * );
 *
 * 2. For tests needing custom controller behavior:
 * @example
 * jest.mock('../../../core/Engine', () =>
 *   require('../../../util/test/mockEngineHelpers').createMockEngine({
 *     NetworkController: {
 *       setActiveNetwork: jest.fn().mockResolvedValue(true),
 *     },
 *   })
 * );
 *
 * 3. For tests that need stateful Engine initialization (like EngineService tests):
 * @example
 * jest.mock('../../../core/Engine', () =>
 *   require('../../../util/test/mockEngineHelpers').createMockEngineWithInit()
 * );
 *
 * 4. For existing tests with complex inline mocks, you can gradually migrate by:
 *    - Using createMockEngineContext() to get default controller mocks
 *    - Using createMockControllerMessenger() for messenger mocks
 *    - Using resetMockEngineContext() in beforeEach for cleanup
 *
 * NOTE: When migrating existing tests, ensure all controller methods used by the
 * component under test are included in the mock. The default mocks cover common
 * methods but may need extension for specific test cases.
 */

import { CHAIN_IDS } from '@metamask/transaction-controller';
import { mockNetworkState } from './network';
import { NetworkClientId } from '@metamask/network-controller';
import { MOCK_KEYRING_CONTROLLER_STATE } from './keyringControllerTestUtils';

/**
 * Default mock implementations for common controller methods
 */
const defaultControllerMocks = {
  NetworkController: {
    setActiveNetwork: jest.fn(),
    setProviderType: jest.fn(),
    updateNetwork: jest.fn(),
    getNetworkClientById: jest.fn().mockReturnValue({ chainId: '0x1' }),
    findNetworkClientIdByChainId: jest.fn().mockReturnValue({ chainId: '0x1' }),
    getNetworkConfigurationByChainId: jest.fn().mockReturnValue({
      blockExplorerUrls: [],
      chainId: '0x1',
      defaultRpcEndpointIndex: 0,
      name: 'Mainnet',
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          networkClientId: 'mainnet',
          type: 'infura',
          url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
        },
      ],
    }),
    removeNetwork: jest.fn(),
    state: {
      ...mockNetworkState({
        chainId: CHAIN_IDS.MAINNET,
        id: 'mainnet',
        nickname: 'Ethereum Mainnet',
        ticker: 'ETH',
      }),
    },
  },

  MultichainNetworkController: {
    setActiveNetwork: jest.fn(),
  },

  PreferencesController: {
    setShowTestNetworks: jest.fn(),
    setTokenNetworkFilter: jest.fn(),
    state: {},
    tokenNetworkFilter: {
      '0x1': true,
      '0xe708': true,
      '0xa86a': true,
      '0x89': true,
      '0xa': true,
      '0x64': true,
    },
  },

  CurrencyRateController: {
    updateExchangeRate: jest.fn(),
  },

  AccountTrackerController: {
    refresh: jest.fn(),
    state: {
      accounts: {},
    },
  },

  SelectedNetworkController: {
    setNetworkClientIdForDomain: jest.fn(),
    getProviderAndBlockTracker: jest.fn(),
    getNetworkClientIdForDomain: jest.fn(),
  },

  AccountsController: {
    listAccounts: jest.fn(),
    getSelectedAccount: jest.fn(),
  },

  ApprovalController: {
    addAndShowApprovalRequest: jest.fn(),
    has: jest.fn(),
  },

  PermissionController: {
    createPermissionMiddleware: jest.fn(),
    requestPermissions: jest.fn(),
    getCaveat: jest.fn(),
    updateCaveat: jest.fn(),
    revokePermission: jest.fn(),
    revokePermissions: jest.fn(),
    getPermissions: jest.fn(),
    hasPermissions: jest.fn(),
    hasPermission: jest.fn(),
    executeRestrictedMethod: jest.fn(),
    state: {
      subjects: {},
    },
  },

  KeyringController: {
    ...MOCK_KEYRING_CONTROLLER_STATE,
    setLocked: jest.fn(),
    createNewVaultAndRestore: jest.fn(),
    createNewVaultAndKeychain: jest.fn(),
    subscribe: jest.fn(),
  },

  SignatureController: {
    newUnsignedPersonalMessage: jest.fn(),
    newUnsignedTypedMessage: jest.fn(),
  },

  TransactionController: {
    getTransactions: jest.fn(),
    subscribe: jest.fn(),
    state: {
      transactions: [],
    },
  },

  SmartTransactionsController: {
    subscribe: jest.fn(),
  },

  TokensController: {
    subscribe: jest.fn(),
  },

  NftController: {
    subscribe: jest.fn(),
  },

  GasFeeController: {
    subscribe: jest.fn(),
  },

  SwapsController: {
    subscribe: jest.fn(),
  },

  AddressBookController: {
    subscribe: jest.fn(),
  },

  PhishingController: {
    subscribe: jest.fn(),
  },

  TokenListController: {
    subscribe: jest.fn(),
  },

  TokenRatesController: {
    subscribe: jest.fn(),
  },

  TokenBalancesController: {
    subscribe: jest.fn(),
  },

  TokenDetectionController: {
    subscribe: jest.fn(),
  },

  NftDetectionController: {
    subscribe: jest.fn(),
  },

  AssetsContractController: {
    subscribe: jest.fn(),
  },

  LoggingController: {
    subscribe: jest.fn(),
  },

  SnapController: {
    subscribe: jest.fn(),
  },

  SubjectMetadataController: {
    subscribe: jest.fn(),
  },

  PPOMController: {
    subscribe: jest.fn(),
  },

  AuthenticationController: {
    subscribe: jest.fn(),
  },

  UserStorageController: {
    subscribe: jest.fn(),
  },

  NotificationServicesController: {
    subscribe: jest.fn(),
  },

  SnapInterfaceController: {
    subscribe: jest.fn(),
  },

  RemoteFeatureFlagController: {
    subscribe: jest.fn(),
  },

  TokenSearchDiscoveryController: {
    subscribe: jest.fn(),
  },

  MultichainBalancesController: {
    subscribe: jest.fn(),
  },

  RatesController: {
    subscribe: jest.fn(),
  },
};

export interface ControllerOverrides {
  [controllerName: string]: Record<string, unknown>;
}

/**
 * Deep merges two objects, with source values taking precedence
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>,
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

/**
 * Creates a mock Engine context with all common controllers.
 * Controllers can be customized by passing overrides.
 *
 * @param overrides - Optional object containing controller overrides
 * @returns A mock Engine context object
 *
 * @example
 * const context = createMockEngineContext({
 *   NetworkController: {
 *     setActiveNetwork: jest.fn().mockResolvedValue(true),
 *   },
 * });
 */
export function createMockEngineContext(
  overrides: ControllerOverrides = {},
): Record<string, unknown> {
  const context: Record<string, unknown> = {};

  for (const [controllerName, defaultMock] of Object.entries(
    defaultControllerMocks,
  )) {
    const controllerOverrides = overrides[controllerName] || {};
    context[controllerName] = deepMerge(
      defaultMock as Record<string, unknown>,
      controllerOverrides,
    );
  }

  // Add any additional controllers from overrides that aren't in defaults
  for (const [controllerName, controllerMock] of Object.entries(overrides)) {
    if (!defaultControllerMocks[controllerName as keyof typeof defaultControllerMocks]) {
      context[controllerName] = controllerMock;
    }
  }

  return context;
}

/**
 * Creates a mock controllerMessenger with common methods.
 *
 * @param overrides - Optional object containing method overrides
 * @returns A mock controllerMessenger object
 */
export function createMockControllerMessenger(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    subscribeOnceIf: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    tryUnsubscribe: jest.fn(),
    call: jest.fn().mockImplementation((method: string) => {
      if (method === 'SelectedNetworkController:getNetworkClientIdForDomain') {
        return 'mainnet';
      }

      if (method === 'NetworkController:getNetworkClientById') {
        return {
          configuration: {
            chainId: '0x1',
            ticker: 'ETH',
          },
        };
      }
    }),
    ...overrides,
  };
}

/**
 * Creates a complete mock Engine object suitable for jest.mock().
 * This is the main factory function for creating Engine mocks.
 *
 * @param contextOverrides - Optional object containing controller overrides
 * @param messengerOverrides - Optional object containing controllerMessenger overrides
 * @returns A mock Engine module object
 *
 * @example
 * // In your test file:
 * jest.mock('../../../core/Engine', () =>
 *   require('../../../util/test/mockEngineHelpers').createMockEngine({
 *     PreferencesController: {
 *       setShowTestNetworks: jest.fn(),
 *     },
 *   })
 * );
 */
export function createMockEngine(
  contextOverrides: ControllerOverrides = {},
  messengerOverrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const context = createMockEngineContext(contextOverrides);
  const controllerMessenger = createMockControllerMessenger(messengerOverrides);

  return {
    __esModule: true,
    default: {
      init: jest.fn(),
      context,
      controllerMessenger,
      datamodel: {
        state: { PreferencesController: { selectedAddress: '' } },
      },
      getTotalEvmFiatAccountBalance: jest.fn(),
      hasFunds: jest.fn(),
      resetState: jest.fn(),
      getCaip25PermissionFromLegacyPermissions: jest.fn(),
    },
  };
}

/**
 * Creates a mock Engine with init function that accepts state parameters.
 * Useful for tests that need to initialize Engine with specific state.
 *
 * @param contextOverrides - Optional object containing controller overrides
 * @returns A mock Engine module with stateful init
 *
 * @example
 * jest.mock('../../../core/Engine', () =>
 *   require('../../../util/test/mockEngineHelpers').createMockEngineWithInit()
 * );
 */
export function createMockEngineWithInit(
  contextOverrides: ControllerOverrides = {},
): Record<string, unknown> {
  let instance: Record<string, unknown> | null = null;

  const mockEngine = {
    init: jest.fn((_: unknown, keyringState?: Record<string, unknown>) => {
      const context = createMockEngineContext(contextOverrides);

      if (keyringState && context.KeyringController) {
        const keyringController = context.KeyringController as Record<string, unknown>;
        const existingState = keyringController.state as Record<string, unknown> | undefined;
        keyringController.state = {
          ...(existingState || {}),
          ...keyringState,
        };
      }

      instance = {
        controllerMessenger: createMockControllerMessenger(),
        context,
      };

      return instance;
    }),
    get context() {
      if (!instance) {
        throw new Error('Engine does not exist');
      }
      return (instance as Record<string, unknown>).context;
    },
    get controllerMessenger() {
      if (!instance) {
        throw new Error('Engine does not exist');
      }
      return (instance as Record<string, unknown>).controllerMessenger;
    },
    destroyEngine: jest.fn(async () => {
      instance = null;
    }),
  };

  return {
    __esModule: true,
    default: mockEngine,
  };
}

/**
 * Helper to create a mock NetworkController with custom network configurations.
 *
 * @param networkConfigs - Network configurations by chain ID
 * @returns A mock NetworkController object
 */
export function createMockNetworkController(
  networkConfigs: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...defaultControllerMocks.NetworkController,
    getNetworkConfigurationByChainId: jest.fn((chainId: string) => {
      return networkConfigs[chainId] || defaultControllerMocks.NetworkController.getNetworkConfigurationByChainId();
    }),
    getNetworkClientById: jest.fn((networkClientId: NetworkClientId) => {
      if (networkClientId === 'linea_goerli') {
        return {
          configuration: {
            chainId: '0xe704',
            rpcUrl: 'https://linea-goerli.infura.io/v3',
            ticker: 'LINEA',
            type: 'custom',
          },
        };
      }

      return {
        configuration: {
          chainId: '0x1',
          rpcUrl: 'https://mainnet.infura.io/v3',
          ticker: 'ETH',
          type: 'custom',
        },
      };
    }),
  };
}

/**
 * Helper to create a mock TransactionController with custom transactions.
 *
 * @param transactions - Array of transaction objects
 * @returns A mock TransactionController object
 */
export function createMockTransactionController(
  transactions: unknown[] = [],
): Record<string, unknown> {
  return {
    ...defaultControllerMocks.TransactionController,
    getTransactions: jest.fn().mockReturnValue(transactions),
    state: {
      transactions,
    },
  };
}

/**
 * Resets all mock functions in the provided Engine context.
 * Useful in beforeEach hooks to ensure clean state between tests.
 *
 * @param context - The Engine context to reset
 */
export function resetMockEngineContext(
  context: Record<string, unknown>,
): void {
  for (const controller of Object.values(context)) {
    if (controller && typeof controller === 'object') {
      for (const method of Object.values(controller as Record<string, unknown>)) {
        if (typeof method === 'function' && 'mockClear' in method) {
          (method as jest.Mock).mockClear();
        }
      }
    }
  }
}
