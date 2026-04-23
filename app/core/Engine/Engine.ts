/* eslint-disable @typescript-eslint/no-shadow */

import {
  AccountTrackerController,
  AssetsContractController,
  NftController,
  NftDetectionController,
  TokenBalancesController,
  TokenDetectionController,
  TokenRatesController,
  TokensController,
  CodefiTokenPricesServiceV2,
  TokenSearchDiscoveryDataController,
} from '@metamask/assets-controllers';
import { AccountsController } from '@metamask/accounts-controller';
import { ComposableController } from '@metamask/composable-controller';
import {
  KeyringController,
  KeyringControllerState,
  ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
  KeyringTypes,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/keyring-controller';
import {
  NetworkController,
  NetworkControllerMessenger,
  NetworkState,
} from '@metamask/network-controller';
import { PreferencesController } from '@metamask/preferences-controller';
import {
  TransactionController,
  type TransactionParams,
} from '@metamask/transaction-controller';
import { GasFeeController } from '@metamask/gas-fee-controller';
import {
  AcceptOptions,
  ApprovalController,
} from '@metamask/approval-controller';
import { SelectedNetworkController } from '@metamask/selected-network-controller';
import {
  PermissionController,
  ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
  SubjectMetadataController,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/permission-controller';
import SwapsController from '@metamask/swaps-controller';
import { PPOMController } from '@metamask/ppom-validator';
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import {
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
} from '@metamask/snaps-rpc-methods';
///: END:ONLY_INCLUDE_IF
import { LoggingController } from '@metamask/logging-controller';
import { TokenSearchDiscoveryControllerMessenger } from '@metamask/token-search-discovery-controller';
import { getDecimalChainId, isTestNet } from '../../util/networks';
import {
  fetchEstimatedMultiLayerL1Fee,
  deprecatedGetNetworkId,
} from '../../util/networks/engineNetworkUtils';
import AppConstants from '../AppConstants';
import { store } from '../../store';
import Logger from '../../util/Logger';
import { MetaMetricsEvents, MetaMetrics } from '../Analytics';

///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import { ExcludedSnapEndowments, ExcludedSnapPermissions } from '../Snaps';
import { notificationServicesControllerInit } from './controllers/notifications/notification-services-controller-init';
import { notificationServicesPushControllerInit } from './controllers/notifications/notification-services-push-controller-init';
import { subjectMetadataControllerInit } from './controllers/subject-metadata-controller';
import { authenticationControllerInit } from './controllers/identity/authentication-controller-init';
import { userStorageControllerInit } from './controllers/identity/user-storage-controller-init';
///: END:ONLY_INCLUDE_IF
import {
  getCaveatSpecifications,
  getPermissionSpecifications,
  unrestrictedMethods,
} from '../Permissions/specifications.js';
import { backupVault } from '../BackupVault';
import { Hex, Json } from '@metamask/utils';
import { providerErrors } from '@metamask/rpc-errors';

import { createRemoteFeatureFlagController } from './controllers/remote-feature-flag-controller';
import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { selectBasicFunctionalityEnabled } from '../../selectors/settings';
import { selectSwapsChainFeatureFlags } from '../../reducers/swaps';
import { ClientId } from '@metamask/smart-transactions-controller/dist/types';
import { zeroAddress } from 'ethereumjs-util';
import {
  ApprovalType,
  ChainId,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  toHex,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/controller-utils';
import { ExtendedControllerMessenger } from '../ExtendedControllerMessenger';
// DomainProxyMap moved to selected-network-controller init
// SmartTransactions metrics imports moved to smart-transactions-controller init
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { snapKeyringBuilder } from '../SnapKeyring';
import { removeAccountsFromPermissions } from '../Permissions';
import { keyringSnapPermissionsBuilder } from '../SnapKeyring/keyringSnapsPermissions';
import { multichainBalancesControllerInit } from './controllers/multichain-balances-controller/multichain-balances-controller-init';
import { multichainAssetsControllerInit } from './controllers/multichain-assets-controller/multichain-assets-controller-init';
import { multichainAssetsRatesControllerInit } from './controllers/multichain-assets-rates-controller/multichain-assets-rates-controller-init';
import { multichainTransactionsControllerInit } from './controllers/multichain-transactions-controller/multichain-transactions-controller-init';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import {
  cronjobControllerInit,
  executionServiceInit,
  snapControllerInit,
  snapInterfaceControllerInit,
  snapsRegistryInit,
  SnapControllerGetSnapAction,
} from './controllers/snaps';
///: END:ONLY_INCLUDE_IF
import { MetricsEventBuilder } from '../Analytics/MetricsEventBuilder';
import {
  BaseControllerMessenger,
  EngineState,
  EngineContext,
  StatefulControllers,
} from './types';
import {
  BACKGROUND_STATE_CHANGE_EVENT_NAMES,
  STATELESS_NON_CONTROLLER_NAMES,
} from './constants';
import {
  getGlobalChainId,
  getGlobalNetworkClientId,
} from '../../util/networks/global-network';
import { logEngineCreation } from './utils/logger';
import { initModularizedControllers } from './utils';
import { accountsControllerInit } from './controllers/accounts-controller';
import { createTokenSearchDiscoveryController } from './controllers/TokenSearchDiscoveryController';
import { multichainNetworkControllerInit } from './controllers/multichain-network-controller/multichain-network-controller-init';
import { currencyRateControllerInit } from './controllers/currency-rate-controller/currency-rate-controller-init';
import { TransactionControllerInit } from './controllers/transaction-controller';
import { SignatureControllerInit } from './controllers/signature-controller';
import { GasFeeControllerInit } from './controllers/gas-fee-controller';
import I18n from '../../../locales/i18n';
import { appMetadataControllerInit } from './controllers/app-metadata-controller';
import { addressBookControllerInit } from './controllers/address-book-controller';
import { loggingControllerInit } from './controllers/logging-controller';
import { phishingControllerInit } from './controllers/phishing-controller';
import { tokenListControllerInit } from './controllers/token-list-controller';
import { remoteFeatureFlagControllerInit } from './controllers/remote-feature-flag-controller/init';
import { tokenSearchDiscoveryControllerInit } from './controllers/TokenSearchDiscoveryController/init';
import { earnControllerInit } from './controllers/earn-controller';
import { selectedNetworkControllerInit } from './controllers/selected-network-controller';
import { accountTrackerControllerInit } from './controllers/account-tracker-controller';
import { tokenBalancesControllerInit } from './controllers/token-balances-controller';
import { tokenRatesControllerInit } from './controllers/token-rates-controller';
import { nftControllerInit } from './controllers/nft-controller';
import { tokensControllerInit } from './controllers/tokens-controller';
import { tokenDetectionControllerInit } from './controllers/token-detection-controller';
import { nftDetectionControllerInit } from './controllers/nft-detection-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  getTotalEvmFiatAccountBalance as getTotalEvmFiatAccountBalanceUtil,
  hasFunds as hasFundsUtil,
} from './utils/fiat-balance';
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import { buildSnapRestrictedMethods } from './utils/snap-restricted-methods';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { buildKeyringSnapMethods } from './utils/snap-restricted-methods';
///: END:ONLY_INCLUDE_IF
import { setupEngineSubscriptions } from './utils/subscriptions';
import { keyringControllerInit, setRemoveAccountHelper } from './controllers/keyring-controller';
import { permissionControllerInit, setSnapPermissionSpecificationsProvider } from './controllers/permission-controller';
import { smartTransactionsControllerInit } from './controllers/smart-transactions-controller';
import { swapsControllerInit } from './controllers/swaps-controller';
import { ppomControllerInit } from './controllers/ppom-controller';
import { bridgeControllerInit } from './controllers/bridge-controller';
import { bridgeStatusControllerInit } from './controllers/bridge-status-controller';
import { tokenSearchDiscoveryDataControllerInit } from './controllers/token-search-discovery-data-controller';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { ratesControllerInit } from './controllers/rates-controller';
///: END:ONLY_INCLUDE_IF

const NON_EMPTY = 'NON_EMPTY';

const encryptor = new Encryptor({
  keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
});

/**
 * Core controller responsible for composing other metamask controllers together
 * and exposing convenience methods for common wallet operations.
 */
export class Engine {
  /**
   * The global Engine singleton
   */
  static instance: Engine | null;
  /**
   * A collection of all controller instances
   */
  context: EngineContext;
  /**
   * The global controller messenger.
   */
  controllerMessenger: BaseControllerMessenger;
  /**
   * ComposableController reference containing all child controllers
   */
  datamodel: ComposableController<EngineState, StatefulControllers>;

  /**
   * Object containing the info for the latest incoming tx block
   * for each address and network
   */
  lastIncomingTxBlockInfo: Record<string, Record<string, number>> | undefined;

  ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
  subjectMetadataController: SubjectMetadataController;
  ///: END:ONLY_INCLUDE_IF

  accountsController: AccountsController;
  gasFeeController: GasFeeController;
  keyringController: KeyringController;
  smartTransactionsController: SmartTransactionsController;
  transactionController: TransactionController;

  /**
   * Creates a CoreController instance
   */
  // eslint-disable-next-line @typescript-eslint/default-param-last
  constructor(
    initialState: Partial<EngineState> = {},
    initialKeyringState?: KeyringControllerState | null,
    metaMetricsId?: string,
  ) {
    logEngineCreation(initialState, initialKeyringState);

    this.controllerMessenger = new ExtendedControllerMessenger();

    const approvalController = new ApprovalController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'ApprovalController',
        allowedEvents: [],
        allowedActions: [],
      }),
      showApprovalRequest: () => undefined,
      typesExcludedFromRateLimiting: [
        ApprovalType.Transaction,
        ApprovalType.WatchAsset,
      ],
    });

    const preferencesController = new PreferencesController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'PreferencesController',
        allowedActions: [],
        allowedEvents: ['KeyringController:stateChange'],
      }),
      state: {
        ipfsGateway: AppConstants.IPFS_DEFAULT_GATEWAY_URL,
        useTokenDetection:
          initialState?.PreferencesController?.useTokenDetection ?? true,
        useNftDetection: true, // set this to true to enable nft detection by default to new users
        displayNftMedia: true,
        securityAlertsEnabled: true,
        smartTransactionsOptInStatus: true,
        tokenSortConfig: {
          key: 'tokenFiatAmount',
          order: 'dsc',
          sortCallback: 'stringNumeric',
        },
        ...initialState.PreferencesController,
      },
    });

    const networkControllerOpts = {
      infuraProjectId: process.env.MM_INFURA_PROJECT_ID || NON_EMPTY,
      state: initialState.NetworkController,
      messenger: this.controllerMessenger.getRestricted({
        name: 'NetworkController',
        allowedEvents: [],
        allowedActions: [],
      }) as unknown as NetworkControllerMessenger,
      getRpcServiceOptions: () => ({
        fetch,
        btoa,
      }),
      additionalDefaultNetworks: [ChainId['megaeth-testnet']],
    };
    const networkController = new NetworkController(networkControllerOpts);

    networkController.initializeProvider();

    const assetsContractController = new AssetsContractController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'AssetsContractController',
        allowedActions: [
          'NetworkController:getNetworkClientById',
          'NetworkController:getNetworkConfigurationByNetworkClientId',
          'NetworkController:getSelectedNetworkClient',
          'NetworkController:getState',
        ],
        allowedEvents: [
          'PreferencesController:stateChange',
          'NetworkController:networkDidChange',
        ],
      }),
      chainId: getGlobalChainId(networkController),
    });

    // Simple controllers (LoggingController, TokenListController, RemoteFeatureFlagController,
    // TokenSearchDiscoveryController, PhishingController) and complex controllers (KeyringController)
    // are now initialized via controllerInitFunctions

    ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
    /**
     * Gets the mnemonic of the user's primary keyring.
     */
    const getPrimaryKeyringMnemonic = () => {
      const [keyring] = this.keyringController.getKeyringsByType(
        KeyringTypes.hd,
      ) as HdKeyring[];

      if (!keyring.mnemonic) {
        throw new Error('Primary keyring mnemonic unavailable.');
      }

      return keyring.mnemonic;
    };

    const getPrimaryKeyringMnemonicSeed = () => {
      const [keyring] = this.keyringController.getKeyringsByType(
        KeyringTypes.hd,
      ) as HdKeyring[];

      if (!keyring.seed) {
        throw new Error('Primary keyring mnemonic unavailable.');
      }

      return keyring.seed;
    };

    const snapRestrictedMethods = buildSnapRestrictedMethods({
      controllerMessenger: this.controllerMessenger,
      approvalController,
      keyringController: this.keyringController,
      getPreferences: () => this.getPreferences(),
      getCurrencyRateControllerState: () =>
        this.context.CurrencyRateController.state,
      getPrimaryKeyringMnemonic,
      getPrimaryKeyringMnemonicSeed,
    });
    ///: END:ONLY_INCLUDE_IF

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    const keyringSnapMethods = buildKeyringSnapMethods({
      getSnapKeyring: this.getSnapKeyring.bind(this),
    });
    ///: END:ONLY_INCLUDE_IF

    const getSnapPermissionSpecifications = () => ({
      ...buildSnapEndowmentSpecifications(Object.keys(ExcludedSnapEndowments)),
      ...buildSnapRestrictedMethodSpecifications(
        Object.keys(ExcludedSnapPermissions),
        {
          ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
          ...snapRestrictedMethods,
          ///: END:ONLY_INCLUDE_IF
          ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
          ...keyringSnapMethods,
          ///: END:ONLY_INCLUDE_IF
        },
      ),
    });

    // Provide snap permission specs to the PermissionController init function
    setSnapPermissionSpecificationsProvider(getSnapPermissionSpecifications);

    // AccountTrackerController and PermissionController are now initialized via controllerInitFunctions

    // SubjectMetadataController, AuthenticationController, and UserStorageController
    // are now initialized via controllerInitFunctions

    const codefiTokenApiV2 = new CodefiTokenPricesServiceV2();

    // SmartTransactionsController is now initialized via controllerInitFunctions

    // TokenSearchDiscoveryDataController is now initialized via controllerInitFunctions

    // BridgeController is now initialized via controllerInitFunctions

    // BridgeStatusController is now initialized via controllerInitFunctions

    const existingControllersByName = {
      ApprovalController: approvalController,
      NetworkController: networkController,
      PreferencesController: preferencesController,
      AssetsContractController: assetsContractController,
    };

    const initRequest = {
      getState: () => store.getState(),
      getGlobalChainId: () => currentChainId,
      metaMetricsId,
    };

    const { controllersByName } = initModularizedControllers({
      controllerInitFunctions: {
        AccountsController: accountsControllerInit,
        AppMetadataController: appMetadataControllerInit,
        GasFeeController: GasFeeControllerInit,
        TransactionController: TransactionControllerInit,
        SignatureController: SignatureControllerInit,
        CurrencyRateController: currencyRateControllerInit,
        MultichainNetworkController: multichainNetworkControllerInit,
        ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
        SubjectMetadataController: subjectMetadataControllerInit,
        AuthenticationController: authenticationControllerInit,
        UserStorageController: userStorageControllerInit,
        ExecutionService: executionServiceInit,
        SnapController: snapControllerInit,
        CronjobController: cronjobControllerInit,
        SnapInterfaceController: snapInterfaceControllerInit,
        SnapsRegistry: snapsRegistryInit,
        NotificationServicesController: notificationServicesControllerInit,
        NotificationServicesPushController:
          notificationServicesPushControllerInit,
        ///: END:ONLY_INCLUDE_IF
        ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
        MultichainAssetsController: multichainAssetsControllerInit,
        MultichainAssetsRatesController: multichainAssetsRatesControllerInit,
        MultichainBalancesController: multichainBalancesControllerInit,
        MultichainTransactionsController: multichainTransactionsControllerInit,
        RatesController: ratesControllerInit,
        ///: END:ONLY_INCLUDE_IF
        KeyringController: keyringControllerInit,
        PermissionController: permissionControllerInit,
        SmartTransactionsController: smartTransactionsControllerInit,
        SwapsController: swapsControllerInit,
        PPOMController: ppomControllerInit,
        BridgeController: bridgeControllerInit,
        BridgeStatusController: bridgeStatusControllerInit,
        TokenSearchDiscoveryDataController: tokenSearchDiscoveryDataControllerInit,
        AddressBookController: addressBookControllerInit,
        LoggingController: loggingControllerInit,
        PhishingController: phishingControllerInit,
        TokenListController: tokenListControllerInit,
        RemoteFeatureFlagController: remoteFeatureFlagControllerInit,
        TokenSearchDiscoveryController: tokenSearchDiscoveryControllerInit,
        EarnController: earnControllerInit,
        SelectedNetworkController: selectedNetworkControllerInit,
        AccountTrackerController: accountTrackerControllerInit,
        TokenBalancesController: tokenBalancesControllerInit,
        TokenRatesController: tokenRatesControllerInit,
        NftController: nftControllerInit,
        TokensController: tokensControllerInit,
        TokenDetectionController: tokenDetectionControllerInit,
        NftDetectionController: nftDetectionControllerInit,
      },
      persistedState: {
        ...initialState,
        // Preserve initialKeyringState precedence for vault recovery flow (EngineService.ts)
        ...(initialKeyringState
          ? { KeyringController: initialKeyringState }
          : {}),
      } as EngineState,
      existingControllersByName,
      baseControllerMessenger: this.controllerMessenger,
      ...initRequest,
    });

    const accountsController = controllersByName.AccountsController;
    const gasFeeController = controllersByName.GasFeeController;
    const signatureController = controllersByName.SignatureController;
    const transactionController = controllersByName.TransactionController;
    const nftController = controllersByName.NftController;

    // Backwards compatibility for existing references
    this.accountsController = accountsController;
    this.gasFeeController = gasFeeController;
    this.transactionController = transactionController;
    this.keyringController = controllersByName.KeyringController;
    this.smartTransactionsController = controllersByName.SmartTransactionsController;

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    // Wire up the deferred removeAccountHelper for the snap keyring builder
    setRemoveAccountHelper((address: string) => this.removeAccount(address));
    ///: END:ONLY_INCLUDE_IF

    const permissionController = controllersByName.PermissionController;
    const swapsController = controllersByName.SwapsController;
    const ppomController = controllersByName.PPOMController;
    const bridgeController = controllersByName.BridgeController;
    const bridgeStatusController = controllersByName.BridgeStatusController;
    const tokenSearchDiscoveryDataController = controllersByName.TokenSearchDiscoveryDataController;

    const multichainNetworkController =
      controllersByName.MultichainNetworkController;
    const currencyRateController = controllersByName.CurrencyRateController;

    ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
    const cronjobController = controllersByName.CronjobController;
    const executionService = controllersByName.ExecutionService;
    const snapController = controllersByName.SnapController;
    const snapInterfaceController = controllersByName.SnapInterfaceController;
    const snapsRegistry = controllersByName.SnapsRegistry;
    const notificationServicesController =
      controllersByName.NotificationServicesController;
    const notificationServicesPushController =
      controllersByName.NotificationServicesPushController;
    this.subjectMetadataController =
      controllersByName.SubjectMetadataController;
    const authenticationController =
      controllersByName.AuthenticationController;
    const userStorageController = controllersByName.UserStorageController;
    ///: END:ONLY_INCLUDE_IF

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    const multichainAssetsController =
      controllersByName.MultichainAssetsController;
    const multichainAssetsRatesController =
      controllersByName.MultichainAssetsRatesController;
    const multichainBalancesController =
      controllersByName.MultichainBalancesController;
    const multichainTransactionsController =
      controllersByName.MultichainTransactionsController;
    ///: END:ONLY_INCLUDE_IF

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    const multichainRatesController = controllersByName.RatesController;
    ///: END:ONLY_INCLUDE_IF

    ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
    // Notification Setup
    notificationServicesController.init();
    ///: END:ONLY_INCLUDE_IF

    const accountTrackerController = controllersByName.AccountTrackerController;
    const selectedNetworkController = controllersByName.SelectedNetworkController;
    const nftController = controllersByName.NftController;
    const tokensController = controllersByName.TokensController;
    const tokenBalancesController = controllersByName.TokenBalancesController;
    const tokenRatesController = controllersByName.TokenRatesController;

    this.context = {
      KeyringController: this.keyringController,
      AccountTrackerController: controllersByName.AccountTrackerController,
      AddressBookController: controllersByName.AddressBookController,
      AppMetadataController: controllersByName.AppMetadataController,
      AssetsContractController: assetsContractController,
      NftController: controllersByName.NftController,
      TokensController: controllersByName.TokensController,
      TokenListController: controllersByName.TokenListController,
      TokenDetectionController: controllersByName.TokenDetectionController,
      NftDetectionController: controllersByName.NftDetectionController,
      CurrencyRateController: currencyRateController,
      NetworkController: networkController,
      PhishingController: controllersByName.PhishingController,
      PreferencesController: preferencesController,
      TokenBalancesController: tokenBalancesController as TokenBalancesController,
      TokenRatesController: tokenRatesController as TokenRatesController,
      TransactionController: this.transactionController,
      SmartTransactionsController: this.smartTransactionsController,
      SwapsController: swapsController,
      GasFeeController: this.gasFeeController,
      ApprovalController: approvalController,
      PermissionController: permissionController,
      RemoteFeatureFlagController: controllersByName.RemoteFeatureFlagController,
      SelectedNetworkController: selectedNetworkController,
      SignatureController: signatureController,
      TokenSearchDiscoveryController: controllersByName.TokenSearchDiscoveryController,
      LoggingController: controllersByName.LoggingController,
      ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
      CronjobController: cronjobController,
      ExecutionService: executionService,
      SnapController: snapController,
      SnapInterfaceController: snapInterfaceController,
      SnapsRegistry: snapsRegistry,
      SubjectMetadataController: this.subjectMetadataController,
      AuthenticationController: authenticationController,
      UserStorageController: userStorageController,
      NotificationServicesController: notificationServicesController,
      NotificationServicesPushController: notificationServicesPushController,
      ///: END:ONLY_INCLUDE_IF
      AccountsController: accountsController,
      PPOMController: ppomController,
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      MultichainBalancesController: multichainBalancesController,
      RatesController: multichainRatesController,
      MultichainAssetsController: multichainAssetsController,
      MultichainAssetsRatesController: multichainAssetsRatesController,
      MultichainTransactionsController: multichainTransactionsController,
      ///: END:ONLY_INCLUDE_IF
      TokenSearchDiscoveryDataController: tokenSearchDiscoveryDataController,
      MultichainNetworkController: multichainNetworkController,
      BridgeController: bridgeController,
      BridgeStatusController: bridgeStatusController,
      EarnController: controllersByName.EarnController,
    };

    const childControllers = Object.assign({}, this.context);
    STATELESS_NON_CONTROLLER_NAMES.forEach((name) => {
      if (name in childControllers && childControllers[name]) {
        delete childControllers[name];
      }
    });
    this.datamodel = new ComposableController<EngineState, StatefulControllers>(
      {
        controllers: childControllers as StatefulControllers,
        messenger: this.controllerMessenger.getRestricted({
          name: 'ComposableController',
          allowedActions: [],
          allowedEvents: Array.from(BACKGROUND_STATE_CHANGE_EVENT_NAMES),
        }),
      },
    );

    const { NftController: nfts } = this.context;

    if (process.env.MM_OPENSEA_KEY) {
      nfts.setApiKey(process.env.MM_OPENSEA_KEY);
    }

    setupEngineSubscriptions({
      controllerMessenger: this.controllerMessenger,
      networkController,
      approvalController,
      configureControllersOnNetworkChange:
        this.configureControllersOnNetworkChange.bind(this),
      ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
      snapController,
      ///: END:ONLY_INCLUDE_IF
    });

    this.configureControllersOnNetworkChange();
    this.startPolling();
    this.handleVaultBackup();

    Engine.instance = this;
  }

  handleVaultBackup() {
    this.controllerMessenger.subscribe(
      AppConstants.KEYRING_STATE_CHANGE_EVENT,
      (state: KeyringControllerState) => {
        if (!state.vault) {
          return;
        }

        // Back up vault if it exists
        backupVault(state)
          .then(() => {
            Logger.log('Engine', 'Vault back up successful');
          })
          .catch((error) => {
            Logger.error(error, 'Engine Vault backup failed');
          });
      },
    );
  }

  startPolling() {
    const { TransactionController } = this.context;

    TransactionController.stopIncomingTransactionPolling();

    // leaving the reference of TransactionController here, rather than importing it from utils to avoid circular dependency
    TransactionController.startIncomingTransactionPolling();

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    this.context.RatesController.start();
    ///: END:ONLY_INCLUDE_IF
  }

  configureControllersOnNetworkChange() {
    const { AccountTrackerController, NetworkController } = this.context;
    const { provider } = NetworkController.getProviderAndBlockTracker();

    // Skip configuration if this is called before the provider is initialized
    if (!provider) {
      return;
    }
    provider.sendAsync = provider.sendAsync.bind(provider);

    AccountTrackerController.refresh([
      NetworkController.state.networkConfigurationsByChainId[
        getGlobalChainId(NetworkController)
      ]?.rpcEndpoints?.[
        NetworkController.state.networkConfigurationsByChainId[
          getGlobalChainId(NetworkController)
        ]?.defaultRpcEndpointIndex
      ]?.networkClientId,
    ]);
  }

  getTotalEvmFiatAccountBalance = (account?: InternalAccount) => {
    return getTotalEvmFiatAccountBalanceUtil(
      this.context,
      () => store.getState(),
      account,
    );
  };

  /**
   * Gets a subset of preferences from the PreferencesController to pass to a snap.
   */
  getPreferences = () => {
    const {
      securityAlertsEnabled,
      useTransactionSimulations,
      useTokenDetection,
      privacyMode,
      useNftDetection,
      displayNftMedia,
      isMultiAccountBalancesEnabled,
    } = this.context.PreferencesController.state;

    return {
      securityAlertsEnabled,
      useTransactionSimulations,
      useTokenDetection,
      privacyMode,
      useNftDetection,
      displayNftMedia,
      isMultiAccountBalancesEnabled,
    };
  };

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getSnapKeyring = async () => {
    // TODO: Replace `getKeyringsByType` with `withKeyring`
    let [snapKeyring] = this.keyringController.getKeyringsByType(
      KeyringTypes.snap,
    );
    if (!snapKeyring) {
      await this.keyringController.addNewKeyring(KeyringTypes.snap);
      // TODO: Replace `getKeyringsByType` with `withKeyring`
      [snapKeyring] = this.keyringController.getKeyringsByType(
        KeyringTypes.snap,
      );
    }
    return snapKeyring;
  };

  /**
   * Removes an account from state / storage.
   *
   * @param {string} address - A hex address
   */
  removeAccount = async (address: string) => {
    const addressHex = toHex(address);
    // Remove all associated permissions
    await removeAccountsFromPermissions([addressHex]);
    // Remove account from the keyring
    await this.keyringController.removeAccount(addressHex);
  };
  ///: END:ONLY_INCLUDE_IF

  hasFunds = () => {
    return hasFundsUtil(this.context, () => store.getState());
  };

  resetState = async () => {
    // Whenever we are gonna start a new wallet
    // either imported or created, we need to
    // get rid of the old data from state
    const {
      TransactionController,
      TokensController,
      NftController,
      TokenBalancesController,
      TokenRatesController,
      PermissionController,
      // SelectedNetworkController,
      ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
      SnapController,
      ///: END:ONLY_INCLUDE_IF
      LoggingController,
    } = this.context;

    // Remove all permissions.
    PermissionController?.clearState?.();
    ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
    SnapController.clearState();
    ///: END:ONLY_INCLUDE_IF

    // Clear selected network
    // TODO implement this method on SelectedNetworkController
    // SelectedNetworkController.unsetAllDomains()

    //Clear assets info
    TokensController.resetState();
    NftController.resetState();

    TokenBalancesController.resetState();
    TokenRatesController.resetState();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (TransactionController as any).update(() => ({
      methodData: {},
      transactions: [],
      lastFetchedBlockNumbers: {},
      submitHistory: [],
      swapsTransactions: {},
    }));

    LoggingController.clear();
  };

  removeAllListeners() {
    this.controllerMessenger.clearSubscriptions();
  }

  async destroyEngineInstance() {
    Object.values(this.context).forEach((controller) => {
      if ('destroy' in controller && typeof controller.destroy === 'function') {
        controller.destroy();
      }
    });
    this.removeAllListeners();
    await this.resetState();
    Engine.instance = null;
  }

  rejectPendingApproval(
    id: string,
    reason: Error = providerErrors.userRejectedRequest(),
    opts: { ignoreMissing?: boolean; logErrors?: boolean } = {},
  ) {
    const { ApprovalController } = this.context;

    if (opts.ignoreMissing && !ApprovalController.has({ id })) {
      return;
    }

    try {
      ApprovalController.reject(id, reason);
    } catch (error) {
      if (opts.logErrors !== false) {
        Logger.error(
          error as Error,
          'Reject while rejecting pending connection request',
        );
      }
    }
  }

  async acceptPendingApproval(
    id: string,
    requestData?: Record<string, Json>,
    opts: AcceptOptions & { handleErrors?: boolean } = {
      waitForResult: false,
      deleteAfterResult: false,
      handleErrors: true,
    },
  ) {
    const { ApprovalController } = this.context;

    try {
      return await ApprovalController.accept(id, requestData, {
        waitForResult: opts.waitForResult,
        deleteAfterResult: opts.deleteAfterResult,
      });
    } catch (err) {
      if (opts.handleErrors === false) {
        throw err;
      }
    }
  }

  // This should be used instead of directly calling PreferencesController.setSelectedAddress or AccountsController.setSelectedAccount
  setSelectedAccount(address: string) {
    const { AccountsController, PreferencesController } = this.context;
    const account = AccountsController.getAccountByAddress(address);
    if (account) {
      AccountsController.setSelectedAccount(account.id);
      PreferencesController.setSelectedAddress(address);
    } else {
      throw new Error(`No account found for address: ${address}`);
    }
  }

  /**
   * This should be used instead of directly calling PreferencesController.setAccountLabel or AccountsController.setAccountName in order to keep the names in sync
   * We are currently incrementally migrating the accounts data to the AccountsController so we must keep these values
   * in sync until the migration is complete.
   */
  setAccountLabel(address: string, label: string) {
    const { AccountsController, PreferencesController } = this.context;
    const accountToBeNamed = AccountsController.getAccountByAddress(address);
    if (accountToBeNamed === undefined) {
      throw new Error(`No account found for address: ${address}`);
    }
    AccountsController.setAccountName(accountToBeNamed.id, label);
    PreferencesController.setAccountLabel(address, label);
  }
}

/**
 * Assert that the given Engine instance has been initialized
 *
 * @param instance - Either an Engine instance, or null
 */
function assertEngineExists(
  instance: Engine | null,
): asserts instance is Engine {
  if (!instance) {
    throw new Error('Engine does not exist');
  }
}

let instance: Engine | null;

export default {
  get context() {
    assertEngineExists(instance);
    return instance.context;
  },

  get controllerMessenger() {
    assertEngineExists(instance);
    return instance.controllerMessenger;
  },

  get state() {
    assertEngineExists(instance);
    return instance.datamodel.state;
  },

  get datamodel() {
    assertEngineExists(instance);
    return instance.datamodel;
  },

  getTotalEvmFiatAccountBalance(account?: InternalAccount) {
    assertEngineExists(instance);
    return instance.getTotalEvmFiatAccountBalance(account);
  },

  hasFunds() {
    assertEngineExists(instance);
    return instance.hasFunds();
  },

  resetState() {
    assertEngineExists(instance);
    return instance.resetState();
  },

  destroyEngine: async () => {
    await instance?.destroyEngineInstance();
    instance = null;
  },

  init(
    state: Partial<EngineState> | undefined,
    keyringState: KeyringControllerState | null = null,
    metaMetricsId?: string,
  ) {
    instance =
      Engine.instance || new Engine(state, keyringState, metaMetricsId);
    Object.freeze(instance);
    return instance;
  },

  acceptPendingApproval: async (
    id: string,
    requestData?: Record<string, Json>,
    opts?: AcceptOptions & { handleErrors?: boolean },
  ) => instance?.acceptPendingApproval(id, requestData, opts),

  rejectPendingApproval: (
    id: string,
    reason: Error,
    opts: {
      ignoreMissing?: boolean;
      logErrors?: boolean;
    } = {},
  ) => instance?.rejectPendingApproval(id, reason, opts),

  setSelectedAddress: (address: string) => {
    assertEngineExists(instance);
    instance.setSelectedAccount(address);
  },

  setAccountLabel: (address: string, label: string) => {
    assertEngineExists(instance);
    instance.setAccountLabel(address, label);
  },

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getSnapKeyring: () => {
    assertEngineExists(instance);
    return instance.getSnapKeyring();
  },
  removeAccount: async (address: string) => {
    assertEngineExists(instance);
    return await instance.removeAccount(address);
  },
  ///: END:ONLY_INCLUDE_IF
};
