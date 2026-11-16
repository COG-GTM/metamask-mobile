import { waitFor } from '@testing-library/react-native';
import { EngineService } from './EngineService';
import ReduxService, { type ReduxStore } from '../redux';
import Engine from '../Engine';
import { type KeyringControllerState } from '@metamask/keyring-controller';
import NavigationService from '../NavigationService';
import Logger from '../../util/Logger';
import Routes from '../../constants/navigation/Routes';
import { BACKGROUND_STATE_CHANGE_EVENT_NAMES } from '../Engine/constants';

// Mock NavigationService
jest.mock('../NavigationService', () => ({
  navigation: {
    reset: jest.fn(),
  },
}));

// Mock Logger
jest.mock('../../util/Logger', () => ({
  error: jest.fn(),
  log: jest.fn(),
}));

jest.mock('../BackupVault', () => ({
  getVaultFromBackup: () => ({ success: true, vault: 'fake_vault' }),
}));

jest.mock('../../util/test/network-store.js', () => jest.fn());

// Unmock global Engine
jest.unmock('../Engine');

jest.mock('../Engine', () => {
  // Do not need to mock entire Engine. Only need subset of data for testing purposes.
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let instance: any;

  const mockEngine = {
    init: (_: unknown, keyringState: KeyringControllerState) => {
      instance = {
        controllerMessenger: {
          subscribe: jest.fn(),
          subscribeOnceIf: jest.fn(),
        },
        context: {
          AddressBookController: { subscribe: jest.fn() },
          KeyringController: {
            subscribe: jest.fn(),
            state: { ...keyringState },
            metadata: { vault: { persist: true, anonymous: false } },
          },
          AssetsContractController: { subscribe: jest.fn() },
          NftController: { subscribe: jest.fn() },
          TokensController: { subscribe: jest.fn() },
          TokenDetectionController: { subscribe: jest.fn() },
          NftDetectionController: { subscribe: jest.fn() },
          AccountTrackerController: { subscribe: jest.fn() },
          NetworkController: { subscribe: jest.fn() },
          PhishingController: { subscribe: jest.fn() },
          PreferencesController: { subscribe: jest.fn() },
          RemoteFeatureFlagController: { subscribe: jest.fn() },
          TokenBalancesController: { subscribe: jest.fn() },
          TokenRatesController: { subscribe: jest.fn() },
          TransactionController: { subscribe: jest.fn() },
          SmartTransactionsController: { subscribe: jest.fn() },
          SwapsController: { subscribe: jest.fn() },
          TokenListController: { subscribe: jest.fn() },
          CurrencyRateController: { subscribe: jest.fn() },
          GasFeeController: { subscribe: jest.fn() },
          ApprovalController: { subscribe: jest.fn() },
          PermissionController: { subscribe: jest.fn() },
          LoggingController: { subscribe: jest.fn() },
          AccountsController: { subscribe: jest.fn() },
          SnapController: { subscribe: jest.fn() },
          SubjectMetadataController: { subscribe: jest.fn() },
          PPOMController: { subscribe: jest.fn() },
          AuthenticationController: { subscribe: jest.fn() },
          UserStorageController: { subscribe: jest.fn() },
          NotificationServicesController: { subscribe: jest.fn() },
          SelectedNetworkController: { subscribe: jest.fn() },
          SnapInterfaceController: { subscribe: jest.fn() },
          SignatureController: { subscribe: jest.fn() },
          TokenSearchDiscoveryController: { subscribe: jest.fn() },
          MultichainBalancesController: { subscribe: jest.fn() },
          RatesController: { subscribe: jest.fn() },
        },
      };
      return instance;
    },
    get context() {
      if (!instance) {
        throw new Error('Engine does not exist');
      }
      return instance.context;
    },
    get controllerMessenger() {
      if (!instance) {
        throw new Error('Engine does not exist');
      }
      return instance.controllerMessenger;
    },
    destroyEngine: jest.fn(async () => {
      instance = null;
    }),
  };

  return {
    __esModule: true,
    default: mockEngine,
  };
});

describe('EngineService', () => {
  let engineService: EngineService;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockDispatch = jest.fn();
    jest.spyOn(ReduxService, 'store', 'get').mockReturnValue({
      getState: () => ({
        engine: { backgroundState: { KeyringController: {} } },
      }),
      dispatch: mockDispatch,
    } as unknown as ReduxStore);

    engineService = new EngineService();
  });

  it('should have Engine initialized', async () => {
    engineService.start();
    await waitFor(() => {
      expect(Engine.context).toBeDefined();
    });
  });

  it('should log Engine initialization with state info', async () => {
    engineService.start();
    await waitFor(() => {
      expect(Logger.log).toHaveBeenCalledWith(
        'EngineService: Initializing Engine:',
        {
          hasState: true,
        },
      );
    });
  });

  it('should log Engine initialization with empty state', async () => {
    jest.spyOn(ReduxService, 'store', 'get').mockReturnValue({
      getState: () => ({ engine: { backgroundState: {} } }),
    } as unknown as ReduxStore);

    engineService.start();
    await waitFor(() => {
      expect(Logger.log).toHaveBeenCalledWith(
        'EngineService: Initializing Engine:',
        {
          hasState: false,
        },
      );
    });
  });

  it('should have recovered vault on redux store and log initialization', async () => {
    await engineService.start();
    const { success } = await engineService.initializeVaultFromBackup();
    expect(success).toBeTruthy();
    expect(Engine.context.KeyringController.state.vault).toBeDefined();
    expect(Logger.log).toHaveBeenCalledWith(
      'EngineService: Initializing Engine from backup:',
      {
        hasState: true,
      },
    );
  });

  it('should navigate to vault recovery if Engine fails to initialize', async () => {
    jest.spyOn(Engine, 'init').mockImplementation(() => {
      throw new Error('Failed to initialize Engine');
    });
    engineService.start();
    await waitFor(() => {
      // Logs error to Sentry
      expect(Logger.error).toHaveBeenCalledWith(
        new Error('Failed to initialize Engine'),
        'Failed to initialize Engine! Falling back to vault recovery.',
      );
      // Navigates to vault recovery
      expect(NavigationService.navigation?.reset).toHaveBeenCalledWith({
        routes: [{ name: Routes.VAULT_RECOVERY.RESTORE_WALLET }],
      });
    });
  });

  describe('background state sync', () => {
    const getStateChangeHandlers = () => {
      const subscribe = Engine.controllerMessenger.subscribe as jest.Mock;
      return new Map<string, () => void>(
        subscribe.mock.calls.map(([eventName, handler]) => [
          eventName,
          handler,
        ]),
      );
    };

    it('subscribes once to every background state change event', async () => {
      await engineService.start();

      const subscribe = Engine.controllerMessenger.subscribe as jest.Mock;
      const subscribedEvents = subscribe.mock.calls.map(
        ([eventName]) => eventName,
      );
      expect(subscribedEvents).toStrictEqual([
        ...BACKGROUND_STATE_CHANGE_EVENT_NAMES,
      ]);
      subscribe.mock.calls.forEach(([, handler]) => {
        expect(handler).toStrictEqual(expect.any(Function));
      });
    });

    it('dispatches UPDATE_BG_STATE keyed by controller name when TransactionController state changes', async () => {
      await engineService.start();

      getStateChangeHandlers().get('TransactionController:stateChange')?.();

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_BG_STATE',
        payload: { key: 'TransactionController' },
      });
      expect(Logger.log).not.toHaveBeenCalledWith(
        'keyringController vault missing for UPDATE_BG_STATE_KEY',
      );
    });

    it.each([...BACKGROUND_STATE_CHANGE_EVENT_NAMES])(
      'dispatches UPDATE_BG_STATE with the controller name for %s',
      async (eventName) => {
        await engineService.start();

        getStateChangeHandlers().get(eventName)?.();

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'UPDATE_BG_STATE',
          payload: { key: eventName.replace(/:stateChange$/u, '') },
        });
      },
    );

    it('logs when the KeyringController vault metadata is missing and still dispatches', async () => {
      await engineService.start();
      Reflect.deleteProperty(
        Engine.context.KeyringController.metadata,
        'vault',
      );

      getStateChangeHandlers().get('KeyringController:stateChange')?.();

      expect(Logger.log).toHaveBeenCalledWith(
        'keyringController vault missing for UPDATE_BG_STATE_KEY',
      );
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_BG_STATE',
        payload: { key: 'KeyringController' },
      });
    });

    it('dispatches INIT_BG_STATE once on the first ComposableController state change', async () => {
      await engineService.start();

      const subscribeOnceIf = Engine.controllerMessenger
        .subscribeOnceIf as jest.Mock;
      expect(subscribeOnceIf).toHaveBeenCalledTimes(1);
      const [eventName, handler, criteria] = subscribeOnceIf.mock.calls[0];
      expect(eventName).toBe('ComposableController:stateChange');

      expect(criteria()).toBe(true);
      handler();
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'INIT_BG_STATE' });
      expect(criteria()).toBe(false);
    });
  });
});
