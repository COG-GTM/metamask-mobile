import { waitFor } from '@testing-library/react-native';
import { EngineService } from './EngineService';
import ReduxService, { type ReduxStore } from '../redux';
import Engine from '../Engine';
import { type KeyringControllerState } from '@metamask/keyring-controller';
import NavigationService from '../NavigationService';
import Logger from '../../util/Logger';
import Routes from '../../constants/navigation/Routes';
import { BACKGROUND_STATE_CHANGE_EVENT_NAMES } from '../Engine/constants';
import { ExtendedControllerMessenger } from '../ExtendedControllerMessenger';
import {
  NO_VAULT_IN_BACKUP_ERROR,
  VAULT_CREATION_ERROR,
} from '../../constants/error';

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

const mockGetVaultFromBackup = jest.fn();
jest.mock('../BackupVault', () => ({
  getVaultFromBackup: () => mockGetVaultFromBackup(),
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
        controllerMessenger: new (jest.requireActual(
          '../ExtendedControllerMessenger',
        ).ExtendedControllerMessenger)(),
        context: {
          AddressBookController: { subscribe: jest.fn() },
          KeyringController: {
            subscribe: jest.fn(),
            metadata: { vault: { persist: true, anonymous: false } },
            state: { ...keyringState },
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
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockGetVaultFromBackup.mockResolvedValue({
      success: true,
      vault: 'fake_vault',
    });
    jest.spyOn(ReduxService, 'store', 'get').mockReturnValue({
      getState: () => ({
        engine: { backgroundState: { KeyringController: {} } },
      }),
      dispatch: mockDispatch,
    } as unknown as ReduxStore);

    engineService = new EngineService();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
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

  describe('controller state to Redux sync', () => {
    const INIT_BG_STATE = { type: 'INIT_BG_STATE' };
    const updateBgState = (key: string) => ({
      type: 'UPDATE_BG_STATE',
      payload: { key },
    });
    const messenger = () =>
      Engine.controllerMessenger as unknown as ExtendedControllerMessenger<
        never,
        { type: string; payload: unknown[] }
      >;
    const publish = (eventName: string) =>
      (
        messenger() as unknown as {
          publish: (type: string, ...payload: unknown[]) => void;
        }
      ).publish(eventName, {}, []);

    it('registers one UPDATE_BG_STATE subscription per background state change event', async () => {
      const subscribeSpy = jest.spyOn(
        ExtendedControllerMessenger.prototype,
        'subscribe',
      );

      await engineService.start();

      const subscribedEvents = subscribeSpy.mock.calls
        .map(([eventName]) => eventName)
        .filter(
          (eventName) => eventName !== 'ComposableController:stateChange',
        );
      expect(subscribedEvents).toHaveLength(
        BACKGROUND_STATE_CHANGE_EVENT_NAMES.length,
      );
      expect(new Set(subscribedEvents)).toEqual(
        new Set(BACKGROUND_STATE_CHANGE_EVENT_NAMES),
      );
    });

    it.each([
      ['AccountsController:stateChange', 'AccountsController'],
      ['KeyringController:stateChange', 'KeyringController'],
      ['NetworkController:stateChange', 'NetworkController'],
      ['TokenBalancesController:stateChange', 'TokenBalancesController'],
      ['TransactionController:stateChange', 'TransactionController'],
    ])(
      'dispatches UPDATE_BG_STATE for %s with key %s',
      async (eventName, controllerName) => {
        await engineService.start();

        publish(eventName);

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith(
          updateBgState(controllerName),
        );
      },
    );

    it('dispatches UPDATE_BG_STATE keyed by controller name for every background state change event', async () => {
      await engineService.start();

      BACKGROUND_STATE_CHANGE_EVENT_NAMES.forEach((eventName) =>
        publish(eventName),
      );

      expect(mockDispatch).toHaveBeenCalledTimes(
        BACKGROUND_STATE_CHANGE_EVENT_NAMES.length,
      );
      BACKGROUND_STATE_CHANGE_EVENT_NAMES.forEach((eventName, index) => {
        const key = mockDispatch.mock.calls[index][0].payload.key;
        expect(key).not.toContain(':');
        expect(`${key}:stateChange`).toBe(eventName);
      });
      expect(Logger.log).not.toHaveBeenCalledWith(
        'keyringController vault missing for UPDATE_BG_STATE_KEY',
      );
    });

    it('dispatches INIT_BG_STATE only once on ComposableController state changes', async () => {
      await engineService.start();

      publish('ComposableController:stateChange');
      publish('ComposableController:stateChange');

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(INIT_BG_STATE);
      expect(Logger.log).not.toHaveBeenCalledWith(
        'keyringController vault missing for INIT_BG_STATE_KEY',
      );
    });

    it('does not dispatch INIT_BG_STATE again for a new engine once initialized', async () => {
      await engineService.start();
      publish('ComposableController:stateChange');
      mockDispatch.mockClear();

      await engineService.start();
      publish('ComposableController:stateChange');

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('dispatches INIT_BG_STATE again after the engine is recreated from the vault backup', async () => {
      jest.useFakeTimers();
      await engineService.start();
      publish('ComposableController:stateChange');
      mockDispatch.mockClear();

      const result = engineService.initializeVaultFromBackup();
      await jest.advanceTimersByTimeAsync(2000);
      expect(await result).toEqual({ success: true });

      publish('ComposableController:stateChange');
      publish('ComposableController:stateChange');
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(INIT_BG_STATE);
    });

    it('logs when the keyring vault metadata is missing but still dispatches', async () => {
      await engineService.start();
      (
        Engine.context.KeyringController as unknown as { metadata: object }
      ).metadata = {};

      publish('ComposableController:stateChange');
      publish('NetworkController:stateChange');

      expect(Logger.log).toHaveBeenCalledWith(
        'keyringController vault missing for INIT_BG_STATE_KEY',
      );
      expect(Logger.log).toHaveBeenCalledWith(
        'keyringController vault missing for UPDATE_BG_STATE_KEY',
      );
      expect(mockDispatch).toHaveBeenNthCalledWith(1, INIT_BG_STATE);
      expect(mockDispatch).toHaveBeenNthCalledWith(
        2,
        updateBgState('NetworkController'),
      );
    });

    it('logs an error and does not subscribe when the engine has no context', async () => {
      jest.useFakeTimers();
      const controllerMessenger = {
        subscribe: jest.fn(),
        subscribeOnceIf: jest.fn(),
      };
      jest
        .spyOn(Engine, 'init')
        .mockReturnValue({ controllerMessenger } as unknown as ReturnType<
          typeof Engine.init
        >);

      const result = engineService.initializeVaultFromBackup();
      await jest.advanceTimersByTimeAsync(2000);
      await result;

      expect(Logger.error).toHaveBeenCalledWith(
        new Error(
          'Engine context does not exists. Redux will not be updated from controller state updates!',
        ),
      );
      expect(controllerMessenger.subscribe).not.toHaveBeenCalled();
      expect(controllerMessenger.subscribeOnceIf).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('initializeVaultFromBackup', () => {
    it('returns NO_VAULT_IN_BACKUP_ERROR when the backup has no vault', async () => {
      mockGetVaultFromBackup.mockResolvedValue(undefined);
      const initSpy = jest.spyOn(Engine, 'init');

      const result = await engineService.initializeVaultFromBackup();

      expect(result).toEqual({
        success: false,
        error: NO_VAULT_IN_BACKUP_ERROR,
      });
      expect(Engine.destroyEngine).toHaveBeenCalledTimes(1);
      expect(initSpy).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('returns VAULT_CREATION_ERROR when the engine cannot be created from the backup', async () => {
      const initSpy = jest
        .spyOn(Engine, 'init')
        .mockReturnValue(
          undefined as unknown as ReturnType<typeof Engine.init>,
        );

      const result = await engineService.initializeVaultFromBackup();

      expect(result).toEqual({
        success: false,
        error: VAULT_CREATION_ERROR,
      });
      expect(initSpy).toHaveBeenCalledWith(
        { KeyringController: {} },
        {
          keyrings: [],
          vault: 'fake_vault',
          isUnlocked: false,
          keyringsMetadata: [],
        },
        expect.anything(),
      );
      expect(Logger.error).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
