import { PhishingController } from '@metamask/phishing-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import { BridgeClientId } from '@metamask/bridge-controller';
import { ClientId } from '@metamask/smart-transactions-controller/dist/types';
import { handleFetch } from '@metamask/controller-utils';
import Engine from './Engine';
import { ExtendedControllerMessenger } from '../ExtendedControllerMessenger';
import { MetaMetrics } from '../Analytics';
import { store } from '../../store';
import { selectSwapsChainFeatureFlags } from '../../reducers/swaps';
import { isProductSafetyDappScanningEnabled } from '../../util/phishingDetection';
import { getAllowedSmartTransactionsChainIds } from '../../constants/smartTransactions';
import { Encryptor } from '../Encryptor';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOptions = Record<string, any>;

const mockConstructorOptions: Record<string, AnyOptions> = {};
const mockForgetDevice = jest.fn();

jest.mock('../BackupVault', () => ({
  backupVault: jest.fn().mockResolvedValue({ success: true, vault: 'vault' }),
}));
jest.unmock('./Engine');
jest.mock('../../store', () => ({
  store: { getState: jest.fn(() => ({ engine: {} })) },
}));
jest.mock('../../reducers/swaps', () => ({
  ...jest.requireActual('../../reducers/swaps'),
  selectSwapsChainFeatureFlags: jest.fn(),
}));
jest.mock('../../selectors/smartTransactionsController', () => ({
  selectShouldUseSmartTransaction: jest.fn().mockReturnValue(false),
  selectSmartTransactionsEnabled: jest.fn().mockReturnValue(false),
  selectPendingSmartTransactionsBySender: jest.fn().mockReturnValue([]),
}));
jest.mock('../../selectors/settings', () => ({
  ...jest.requireActual('../../selectors/settings'),
  selectBasicFunctionalityEnabled: jest.fn().mockReturnValue(true),
}));
jest.mock('../../util/phishingDetection', () => ({
  isProductSafetyDappScanningEnabled: jest.fn().mockReturnValue(false),
  getPhishingTestResult: jest.fn().mockReturnValue({ result: true }),
}));
jest.mock('@metamask/assets-controllers', () => {
  const actual = jest.requireActual('@metamask/assets-controllers');
  class MockRatesController extends actual.RatesController {
    start = jest.fn().mockImplementation(() => Promise.resolve());
  }
  return { ...actual, RatesController: MockRatesController };
});
jest.mock('@metamask/smart-transactions-controller', () => {
  const actual = jest.requireActual('@metamask/smart-transactions-controller');
  class CapturedSmartTransactionsController extends actual.default {
    constructor(options: AnyOptions) {
      super(options);
      mockConstructorOptions.SmartTransactionsController = options;
    }
  }
  return {
    ...actual,
    __esModule: true,
    default: CapturedSmartTransactionsController,
  };
});
jest.mock('@metamask/bridge-controller', () => {
  const actual = jest.requireActual('@metamask/bridge-controller');
  class CapturedBridgeController extends actual.BridgeController {
    constructor(options: AnyOptions) {
      super(options);
      mockConstructorOptions.BridgeController = options;
    }
  }
  return { ...actual, BridgeController: CapturedBridgeController };
});
jest.mock('@metamask/keyring-controller', () => {
  const actual = jest.requireActual('@metamask/keyring-controller');
  class CapturedKeyringController extends actual.KeyringController {
    constructor(options: AnyOptions) {
      super(options);
      mockConstructorOptions.KeyringController = options;
    }
  }
  return { ...actual, KeyringController: CapturedKeyringController };
});
jest.mock('@keystonehq/metamask-airgapped-keyring', () => {
  const actual = jest.requireActual('@keystonehq/metamask-airgapped-keyring');
  class SpiedQRKeyring extends actual.MetaMaskKeyring {
    constructor(options?: AnyOptions) {
      super(options);
      this.forgetDevice = mockForgetDevice;
    }
  }
  return { ...actual, MetaMaskKeyring: SpiedQRKeyring };
});

interface RestrictedMessengerArgs {
  name: string;
  allowedActions: string[];
  allowedEvents: string[];
}

const EXPECTED_ALLOW_LISTS: Record<
  string,
  { allowedActions: string[]; allowedEvents: string[] }
> = {
  ApprovalController: { allowedActions: [], allowedEvents: [] },
  PreferencesController: {
    allowedActions: [],
    allowedEvents: ['KeyringController:stateChange'],
  },
  PhishingController: { allowedActions: [], allowedEvents: [] },
  KeyringController: { allowedActions: [], allowedEvents: [] },
  SmartTransactionsController: {
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
    allowedEvents: ['NetworkController:stateChange'],
  },
  BridgeController: {
    allowedActions: [
      'AccountsController:getSelectedMultichainAccount',
      'SnapController:handleRequest',
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'TokenRatesController:getState',
      'MultichainAssetsRatesController:getState',
      'CurrencyRateController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    allowedEvents: [],
  },
  BridgeStatusController: {
    allowedActions: [
      'AccountsController:getSelectedMultichainAccount',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getState',
      'BridgeController:getBridgeERC20Allowance',
      'BridgeController:trackUnifiedSwapBridgeEvent',
      'GasFeeController:getState',
      'AccountsController:getAccountByAddress',
      'SnapController:handleRequest',
      'TransactionController:getState',
    ],
    allowedEvents: [],
  },
  NftController: {
    allowedActions: [
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
      'ApprovalController:addRequest',
      'AssetsContractController:getERC721AssetName',
      'AssetsContractController:getERC721AssetSymbol',
      'AssetsContractController:getERC721TokenURI',
      'AssetsContractController:getERC721OwnerOf',
      'AssetsContractController:getERC1155BalanceOf',
      'AssetsContractController:getERC1155TokenURI',
      'NetworkController:getNetworkClientById',
    ],
    allowedEvents: [
      'PreferencesController:stateChange',
      'NetworkController:networkDidChange',
      'AccountsController:selectedEvmAccountChange',
    ],
  },
  TokensController: {
    allowedActions: [
      'ApprovalController:addRequest',
      'NetworkController:getNetworkClientById',
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
    ],
    allowedEvents: [
      'PreferencesController:stateChange',
      'NetworkController:networkDidChange',
      'NetworkController:stateChange',
      'TokenListController:stateChange',
      'AccountsController:selectedEvmAccountChange',
    ],
  },
  EarnController: {
    allowedActions: [
      'AccountsController:getSelectedAccount',
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
    allowedEvents: [
      'AccountsController:selectedAccountChange',
      'NetworkController:stateChange',
      'TransactionController:transactionConfirmed',
    ],
  },
  PermissionController: {
    allowedActions: [
      'ApprovalController:addRequest',
      'ApprovalController:hasRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
      'SnapController:getPermitted',
      'SnapController:install',
      'SubjectMetadataController:getSubjectMetadata',
    ],
    allowedEvents: [],
  },
  SelectedNetworkController: {
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'NetworkController:getSelectedNetworkClient',
      'PermissionController:hasPermissions',
      'PermissionController:getSubjectNames',
    ],
    allowedEvents: [
      'NetworkController:stateChange',
      'PermissionController:stateChange',
    ],
  },
};

describe('Engine controller wiring', () => {
  let getRestrictedSpy: jest.SpyInstance;
  let registerActionHandlerSpy: jest.SpyInstance;
  let maybeUpdateStateSpy: jest.SpyInstance;

  const initEngine = () => {
    getRestrictedSpy = jest.spyOn(
      ExtendedControllerMessenger.prototype,
      'getRestricted',
    );
    registerActionHandlerSpy = jest.spyOn(
      ExtendedControllerMessenger.prototype,
      'registerActionHandler',
    );
    maybeUpdateStateSpy = jest
      .spyOn(PhishingController.prototype, 'maybeUpdateState')
      .mockResolvedValue();
    return Engine.init({});
  };

  const restrictedMessengerArgs = (): RestrictedMessengerArgs[] =>
    getRestrictedSpy.mock.calls.map(([args]) => args);

  const trackEventMock = () => {
    const trackEvent = jest.fn();
    jest
      .spyOn(MetaMetrics, 'getInstance')
      .mockReturnValue({ trackEvent } as unknown as ReturnType<
        typeof MetaMetrics.getInstance
      >);
    return trackEvent;
  };

  afterEach(async () => {
    await Engine.destroyEngine();
    jest.restoreAllMocks();
    mockForgetDevice.mockClear();
    Object.keys(mockConstructorOptions).forEach(
      (key) => delete mockConstructorOptions[key],
    );
  });

  describe('restricted messengers', () => {
    it.each(Object.entries(EXPECTED_ALLOW_LISTS))(
      'creates the %s messenger with the expected allow-lists',
      (name, expected) => {
        initEngine();

        const calls = restrictedMessengerArgs().filter(
          (args) => args.name === name,
        );
        expect(calls).toHaveLength(1);
        expect(calls[0].allowedActions).toStrictEqual(expected.allowedActions);
        expect(calls[0].allowedEvents).toStrictEqual(expected.allowedEvents);
      },
    );

    it('only allow-lists actions that have a registered handler', () => {
      initEngine();

      const registeredActions = new Set(
        registerActionHandlerSpy.mock.calls.map(([action]) => action),
      );
      const missing = Object.keys(EXPECTED_ALLOW_LISTS).flatMap((name) =>
        restrictedMessengerArgs()
          .filter((args) => args.name === name)
          .flatMap((args) => args.allowedActions)
          .filter((action) => !registeredActions.has(action))
          .map((action) => `${name} -> ${action}`),
      );

      expect(missing).toStrictEqual([]);
    });
  });

  describe('PhishingController', () => {
    it('updates the phishing list when dapp scanning is disabled', () => {
      jest.mocked(isProductSafetyDappScanningEnabled).mockReturnValue(false);
      initEngine();
      expect(maybeUpdateStateSpy).toHaveBeenCalledTimes(1);
    });

    it('does not update the phishing list when dapp scanning is enabled', () => {
      jest.mocked(isProductSafetyDappScanningEnabled).mockReturnValue(true);
      initEngine();
      expect(maybeUpdateStateSpy).not.toHaveBeenCalled();
      jest.mocked(isProductSafetyDappScanningEnabled).mockReturnValue(false);
    });
  });

  describe('KeyringController', () => {
    it('uses the app encryptor and caches the encryption key', () => {
      initEngine();
      const options = mockConstructorOptions.KeyringController;
      expect(options.encryptor).toBeInstanceOf(Encryptor);
      expect(options.cacheEncryptionKey).toBe(true);
    });

    it('registers QR, Ledger and HD keyring builders', () => {
      initEngine();
      const types =
        mockConstructorOptions.KeyringController.keyringBuilders.map(
          (builder: { type: string }) => builder.type,
        );
      expect(types).toStrictEqual(
        expect.arrayContaining([
          KeyringTypes.qr,
          KeyringTypes.ledger,
          KeyringTypes.hd,
        ]),
      );
    });

    it('resets the QR keyring device when building it', () => {
      initEngine();
      const qrBuilder =
        mockConstructorOptions.KeyringController.keyringBuilders.find(
          (builder: { type: string }) => builder.type === KeyringTypes.qr,
        );
      mockForgetDevice.mockClear();

      qrBuilder();

      expect(mockForgetDevice).toHaveBeenCalledTimes(1);
    });
  });

  describe('SmartTransactionsController', () => {
    it('passes mobile client config and supported chain IDs', async () => {
      initEngine();
      const options = mockConstructorOptions.SmartTransactionsController;
      expect(options.clientId).toBe(ClientId.Mobile);
      expect(options.supportedChainIds).toStrictEqual(
        getAllowedSmartTransactionsChainIds(),
      );
      expect(await options.getMetaMetricsProps()).toStrictEqual({});
    });

    it('reads feature flags from the swaps chain feature flags selector', () => {
      initEngine();
      const state = { engine: { backgroundState: {} }, swaps: {} };
      const flags = { smartTransactions: { mobileActive: true } };
      jest.mocked(store.getState).mockReturnValue(state as never);
      jest.mocked(selectSwapsChainFeatureFlags).mockReturnValue(flags);

      const result =
        mockConstructorOptions.SmartTransactionsController.getFeatureFlags();

      expect(selectSwapsChainFeatureFlags).toHaveBeenCalledWith(state);
      expect(result).toBe(flags);
    });

    it.each<
      [
        (
          | 'getNonceLock'
          | 'confirmExternalTransaction'
          | 'getTransactions'
          | 'updateTransaction'
        ),
        unknown[],
      ]
    >([
      ['getNonceLock', ['0xabc', 'mainnet']],
      ['confirmExternalTransaction', [{ id: '1' }, { status: 1 }, '0x1']],
      ['getTransactions', [{ searchCriteria: { from: '0xabc' } }]],
      ['updateTransaction', [{ id: '1' }, 'note']],
    ])('delegates %s to the TransactionController', (method, args) => {
      const engine = initEngine();
      const sentinel = Symbol(method);
      const transactionControllerSpy = jest
        .spyOn(engine.context.TransactionController, method)
        .mockReturnValue(sentinel as never);

      const result = mockConstructorOptions.SmartTransactionsController[method](
        ...args,
      );

      expect(transactionControllerSpy).toHaveBeenCalledWith(...args);
      expect(result).toBe(sentinel);
    });

    it('tracks MetaMetrics events with the STX event name as category', () => {
      initEngine();
      const trackEvent = trackEventMock();

      mockConstructorOptions.SmartTransactionsController.trackMetaMetricsEvent({
        event: 'STX Status Updated',
        category: 'Transactions',
        properties: { stx_status: 'success' },
        sensitiveProperties: { token_from: 'ETH' },
      });

      expect(trackEvent).toHaveBeenCalledTimes(1);
      expect(trackEvent.mock.calls[0][0]).toMatchObject({
        name: 'STX Status Updated',
        properties: { stx_status: 'success' },
        sensitiveProperties: { token_from: 'ETH' },
      });
    });
  });

  describe('BridgeController', () => {
    it('passes mobile client config and fetch function', () => {
      initEngine();
      const options = mockConstructorOptions.BridgeController;
      expect(options.clientId).toBe(BridgeClientId.MOBILE);
      expect(options.fetchFn).toBe(handleFetch);
      expect(options.config).toHaveProperty('customBridgeApiBaseUrl');
    });

    it('delegates getLayer1GasFee to the TransactionController', async () => {
      const engine = initEngine();
      const getLayer1GasFeeSpy = jest
        .spyOn(engine.context.TransactionController, 'getLayer1GasFee')
        .mockResolvedValue('0x123');
      const request = {
        transactionParams: { from: '0xabc', to: '0xdef' },
        chainId: '0xa',
      };

      const result =
        await mockConstructorOptions.BridgeController.getLayer1GasFee({
          ...request,
          extra: 'ignored',
        });

      expect(getLayer1GasFeeSpy).toHaveBeenCalledWith(request);
      expect(result).toBe('0x123');
    });

    it('tracks MetaMetrics events using the bridge event as category', () => {
      initEngine();
      const trackEvent = trackEventMock();

      mockConstructorOptions.BridgeController.trackMetaMetricsFn(
        'Unified SwapBridge Quotes Requested',
        { chain_id_source: 'eip155:1' },
      );

      expect(trackEvent).toHaveBeenCalledTimes(1);
      expect(trackEvent.mock.calls[0][0]).toMatchObject({
        name: 'Unified SwapBridge Quotes Requested',
        properties: { chain_id_source: 'eip155:1' },
      });
    });

    it('tracks MetaMetrics events with empty properties when none are given', () => {
      initEngine();
      const trackEvent = trackEventMock();

      mockConstructorOptions.BridgeController.trackMetaMetricsFn(
        'Unified SwapBridge Page Viewed',
      );

      expect(trackEvent.mock.calls[0][0]).toMatchObject({
        name: 'Unified SwapBridge Page Viewed',
        properties: {},
      });
    });
  });
});
