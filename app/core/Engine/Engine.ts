/* eslint-disable @typescript-eslint/no-shadow */
import Crypto from 'react-native-quick-crypto';

import {
  AccountTrackerController,
  AssetsContractController,
  NftController,
  NftDetectionController,
  TokenBalancesController,
  TokenDetectionController,
  TokenListController,
  TokenRatesController,
  TokensController,
  CodefiTokenPricesServiceV2,
  TokenSearchDiscoveryDataController,
} from '@metamask/assets-controllers';
import { AccountsController } from '@metamask/accounts-controller';
import { AddressBookController } from '@metamask/address-book-controller';
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
} from '@metamask/network-controller';
import { PhishingController } from '@metamask/phishing-controller';
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
import { HdKeyring } from '@metamask/eth-hd-keyring';
import { SelectedNetworkController } from '@metamask/selected-network-controller';
import {
  PermissionController,
  ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
  SubjectMetadataController,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/permission-controller';
import SwapsController, { swapsUtils } from '@metamask/swaps-controller';
import { PPOMController } from '@metamask/ppom-validator';
import { MetaMaskKeyring as QRHardwareKeyring } from '@keystonehq/metamask-airgapped-keyring';
import { LoggingController } from '@metamask/logging-controller';
import {
  LedgerKeyring,
  LedgerMobileBridge,
  LedgerTransportMiddleware,
} from '@metamask/eth-ledger-bridge-keyring';
import { Encryptor, LEGACY_DERIVATION_OPTIONS, pbkdf2 } from '../Encryptor';
import { getDecimalChainId } from '../../util/networks';
import { fetchEstimatedMultiLayerL1Fee } from '../../util/networks/engineNetworkUtils';
import AppConstants from '../AppConstants';
import { store } from '../../store';
import Logger from '../../util/Logger';
import { MetaMetricsEvents, MetaMetrics } from '../Analytics';

///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import { calculateScryptKey } from './controllers/identity/calculate-scrypt-key';
import { notificationServicesControllerInit } from './controllers/notifications/notification-services-controller-init';
import { notificationServicesPushControllerInit } from './controllers/notifications/notification-services-push-controller-init';

import { getAuthenticationControllerMessenger } from './messengers/identity/authentication-controller-messenger';
import { createAuthenticationController } from './controllers/identity/create-authentication-controller';
import { getUserStorageControllerMessenger } from './messengers/identity/user-storage-controller-messenger';
import { createUserStorageController } from './controllers/identity/create-user-storage-controller';
///: END:ONLY_INCLUDE_IF
import {
  getCaveatSpecifications,
  getPermissionSpecifications,
  unrestrictedMethods,
} from '../Permissions/specifications.js';
import { backupVault } from '../BackupVault';
import { Hex, Json } from '@metamask/utils';
import { providerErrors } from '@metamask/rpc-errors';

import { PPOM, ppomInit } from '../../lib/ppom/PPOMView';
import RNFSStorageBackend from '../../lib/ppom/ppom-storage-backend';
import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { getAllowedSmartTransactionsChainIds } from '../../../app/constants/smartTransactions';
import { selectBasicFunctionalityEnabled } from '../../selectors/settings';
import { selectSwapsChainFeatureFlags } from '../../reducers/swaps';
import { ClientId } from '@metamask/smart-transactions-controller/dist/types';
import {
  ApprovalType,
  ChainId,
  handleFetch,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  toHex,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/controller-utils';
import { ExtendedControllerMessenger } from '../ExtendedControllerMessenger';
import DomainProxyMap from '../../lib/DomainProxyMap/DomainProxyMap';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '@metamask/smart-transactions-controller/dist/constants';
import {
  getSmartTransactionMetricsProperties as getSmartTransactionMetricsPropertiesType,
  getSmartTransactionMetricsSensitiveProperties as getSmartTransactionMetricsSensitivePropertiesType,
} from '@metamask/smart-transactions-controller/dist/utils';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { snapKeyringBuilder } from '../SnapKeyring';
import { removeAccountsFromPermissions } from '../Permissions';
import { keyringSnapPermissionsBuilder } from '../SnapKeyring/keyringSnapsPermissions';
import { multichainBalancesControllerInit } from './controllers/multichain-balances-controller/multichain-balances-controller-init';
import { createMultichainRatesController } from './controllers/RatesController/utils';
import { setupCurrencyRateSync } from './controllers/RatesController/subscriptions';
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
  swapsSupportedChainIds,
} from './constants';
import {
  getGlobalChainId,
  getGlobalNetworkClientId,
} from '../../util/networks/global-network';
import { logEngineCreation } from './utils/logger';
import { initModularizedControllers } from './utils';
import { accountsControllerInit } from './controllers/accounts-controller';
import { addressBookControllerInit } from './controllers/address-book-controller';
import { loggingControllerInit } from './controllers/logging-controller';
import { phishingControllerInit } from './controllers/phishing-controller';
import { tokenListControllerInit } from './controllers/token-list-controller';
import { remoteFeatureFlagControllerInit } from './controllers/remote-feature-flag-controller/init';
import { tokenSearchDiscoveryControllerInit } from './controllers/TokenSearchDiscoveryController/init';
import { earnControllerInit } from './controllers/earn-controller';
import {
  BRIDGE_DEV_API_BASE_URL,
  BridgeClientId,
  BridgeController,
} from '@metamask/bridge-controller';
import { BridgeStatusController } from '@metamask/bridge-status-controller';
import { multichainNetworkControllerInit } from './controllers/multichain-network-controller/multichain-network-controller-init';
import { currencyRateControllerInit } from './controllers/currency-rate-controller/currency-rate-controller-init';
import { TransactionControllerInit } from './controllers/transaction-controller';
import { SignatureControllerInit } from './controllers/signature-controller';
import { GasFeeControllerInit } from './controllers/gas-fee-controller';
import { Platform } from '@metamask/profile-sync-controller/sdk';
import { isProductSafetyDappScanningEnabled } from '../../util/phishingDetection';
import { appMetadataControllerInit } from './controllers/app-metadata-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  getTotalEvmFiatAccountBalance as getTotalEvmFiatAccountBalanceFn,
  hasFunds as hasFundsFn,
} from './utils/fiat-balance';
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import {
  buildSnapRestrictedMethods,
  getSnapPermissionSpecifications as getSnapPermissionSpecificationsFn,
} from './utils/snap-restricted-methods';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { buildKeyringSnapMethods } from './utils/snap-restricted-methods';
///: END:ONLY_INCLUDE_IF
import { setupEngineSubscriptions } from './subscriptions';
import { approvalControllerInit } from './controllers/approval-controller';
import { networkControllerInit } from './controllers/network-controller';
import { preferencesControllerInit } from './controllers/preferences-controller';
import { assetsContractControllerInit } from './controllers/assets-contract-controller';
import { selectedNetworkControllerInit } from './controllers/selected-network-controller';
import { accountTrackerControllerInit } from './controllers/account-tracker-controller';
import { tokenBalancesControllerInit } from './controllers/token-balances-controller';
import { tokenRatesControllerInit } from './controllers/token-rates-controller';
import { nftControllerInit } from './controllers/nft-controller';
import { tokensControllerInit } from './controllers/tokens-controller';

const NON_EMPTY = 'NON_EMPTY';

const encryptor = new Encryptor({
  keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
});
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let currentChainId: any;

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
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastIncomingTxBlockInfo: any;

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

    const isBasicFunctionalityToggleEnabled = () =>
      selectBasicFunctionalityEnabled(store.getState());

    const additionalKeyrings = [];

    const qrKeyringBuilder = () => {
      const keyring = new QRHardwareKeyring();
      // to fix the bug in #9560, forgetDevice will reset all keyring properties to default.
      keyring.forgetDevice();
      return keyring;
    };
    qrKeyringBuilder.type = QRHardwareKeyring.type;

    additionalKeyrings.push(qrKeyringBuilder);

    const bridge = new LedgerMobileBridge(new LedgerTransportMiddleware());
    const ledgerKeyringBuilder = () => new LedgerKeyring({ bridge });
    ledgerKeyringBuilder.type = LedgerKeyring.type;

    additionalKeyrings.push(ledgerKeyringBuilder);

    const hdKeyringBuilder = () =>
      new HdKeyring({
        cryptographicFunctions: { pbkdf2Sha512: pbkdf2 },
      });
    hdKeyringBuilder.type = HdKeyring.type;
    additionalKeyrings.push(hdKeyringBuilder);

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    const snapKeyringBuildMessenger = this.controllerMessenger.getRestricted({
      name: 'SnapKeyring',
      allowedActions: [
        'ApprovalController:addRequest',
        'ApprovalController:acceptRequest',
        'ApprovalController:rejectRequest',
        'ApprovalController:startFlow',
        'ApprovalController:endFlow',
        'ApprovalController:showSuccess',
        'ApprovalController:showError',
        'PhishingController:testOrigin',
        'PhishingController:maybeUpdateState',
        'KeyringController:getAccounts',
        'AccountsController:setSelectedAccount',
        'AccountsController:getAccountByAddress',
        'AccountsController:setAccountName',
        'AccountsController:setAccountNameAndSelectAccount',
        'AccountsController:listMultichainAccounts',
        'SnapController:handleRequest',
        SnapControllerGetSnapAction,
      ],
      allowedEvents: [],
    });

    additionalKeyrings.push(
      snapKeyringBuilder(snapKeyringBuildMessenger, {
        persistKeyringHelper: async () => {
          // Necessary to only persist the keyrings, the `AccountsController` will
          // automatically react to `KeyringController:stateChange`.
          await this.keyringController.persistAllKeyrings();
        },
        removeAccountHelper: (address) => this.removeAccount(address),
      }),
    );

    ///: END:ONLY_INCLUDE_IF

    this.keyringController = new KeyringController({
      removeIdentity: (...args: Parameters<PreferencesController['removeIdentity']>) =>
        this.context.PreferencesController.removeIdentity(...args),
      encryptor,
      messenger: this.controllerMessenger.getRestricted({
        name: 'KeyringController',
        allowedActions: [],
        allowedEvents: [],
      }),
      state: initialKeyringState || initialState.KeyringController,
      // @ts-expect-error To Do: Update the type of QRHardwareKeyring to Keyring<Json>
      keyringBuilders: additionalKeyrings,
      cacheEncryptionKey: true,
    });

    ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
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

    const getUnlockPromise = () => {
      if (this.keyringController.isUnlocked()) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        this.controllerMessenger.subscribeOnceIf(
          'KeyringController:unlock',
          resolve,
          () => true,
        );
      });
    };

    const snapRestrictedMethods = buildSnapRestrictedMethods({
      controllerMessenger: this.controllerMessenger,
      approvalController,
      getPrimaryKeyringMnemonic,
      getPrimaryKeyringMnemonicSeed,
      getUnlockPromise: getUnlockPromise.bind(this),
      getPreferences: () => this.getPreferences(),
      getCurrencyRateCurrentCurrency: () =>
        this.context.CurrencyRateController.state.currentCurrency,
    });
    ///: END:ONLY_INCLUDE_IF

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    const keyringSnapMethods = buildKeyringSnapMethods({
      getSnapKeyring: this.getSnapKeyring.bind(this),
    });
    ///: END:ONLY_INCLUDE_IF

    const getSnapPermissionSpecifications = () =>
      getSnapPermissionSpecificationsFn({
        snapRestrictedMethods,
        ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
        keyringSnapMethods,
        ///: END:ONLY_INCLUDE_IF
      });

    ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)

    const authenticationControllerMessenger =
      getAuthenticationControllerMessenger(this.controllerMessenger);
    const authenticationController = createAuthenticationController({
      messenger: authenticationControllerMessenger,
      initialState: initialState.AuthenticationController,
      metametrics: {
        agent: Platform.MOBILE,
        getMetaMetricsId: async () =>
          (await MetaMetrics.getInstance().getMetaMetricsId()) || '',
      },
    });

    const userStorageControllerMessenger = getUserStorageControllerMessenger(
      this.controllerMessenger,
    );
    const userStorageController = createUserStorageController({
      messenger: userStorageControllerMessenger,
      initialState: initialState.UserStorageController,
      nativeScryptCrypto: calculateScryptKey,
      config: {
        accountSyncing: {
          onAccountAdded: (profileId) => {
            MetaMetrics.getInstance().trackEvent(
              MetricsEventBuilder.createEventBuilder(
                MetaMetricsEvents.ACCOUNTS_SYNC_ADDED,
              )
                .addProperties({
                  profile_id: profileId,
                })
                .build(),
            );
          },
          onAccountNameUpdated: (profileId) => {
            MetaMetrics.getInstance().trackEvent(
              MetricsEventBuilder.createEventBuilder(
                MetaMetricsEvents.ACCOUNTS_SYNC_NAME_UPDATED,
              )
                .addProperties({
                  profile_id: profileId,
                })
                .build(),
            );
          },
          onAccountSyncErroneousSituation(profileId, situationMessage) {
            MetaMetrics.getInstance().trackEvent(
              MetricsEventBuilder.createEventBuilder(
                MetaMetricsEvents.ACCOUNTS_SYNC_ERRONEOUS_SITUATION,
              )
                .addProperties({
                  profile_id: profileId,
                  situation_message: situationMessage,
                })
                .build(),
            );
          },
        },
      },
    });
    ///: END:ONLY_INCLUDE_IF

    const codefiTokenApiV2 = new CodefiTokenPricesServiceV2();

    const smartTransactionsControllerTrackMetaMetricsEvent = (
      params: {
        event: MetaMetricsEventName;
        category: MetaMetricsEventCategory;
        properties?: ReturnType<
          typeof getSmartTransactionMetricsPropertiesType
        >;
        sensitiveProperties?: ReturnType<
          typeof getSmartTransactionMetricsSensitivePropertiesType
        >;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      options?: {
        metaMetricsId?: string;
      },
    ) => {
      MetaMetrics.getInstance().trackEvent(
        MetricsEventBuilder.createEventBuilder({
          category: params.event,
        })
          .addProperties(params.properties || {})
          .addSensitiveProperties(params.sensitiveProperties || {})
          .build(),
      );
    };

    this.smartTransactionsController = new SmartTransactionsController({
      // @ts-expect-error TODO: resolve types
      supportedChainIds: getAllowedSmartTransactionsChainIds(),
      clientId: ClientId.Mobile,
      getNonceLock: (...args) =>
        this.transactionController.getNonceLock(...args),
      confirmExternalTransaction: (...args) =>
        this.transactionController.confirmExternalTransaction(...args),
      trackMetaMetricsEvent: smartTransactionsControllerTrackMetaMetricsEvent,
      state: initialState.SmartTransactionsController,
      // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
      messenger: this.controllerMessenger.getRestricted({
        name: 'SmartTransactionsController',
        allowedActions: [
          'NetworkController:getNetworkClientById',
          'NetworkController:getState',
        ],
        allowedEvents: ['NetworkController:stateChange'],
      }),
      getTransactions: (...args) =>
        this.transactionController.getTransactions(...args),
      updateTransaction: (...args) =>
        this.transactionController.updateTransaction(...args),
      getFeatureFlags: () => selectSwapsChainFeatureFlags(store.getState()),
      getMetaMetricsProps: () => Promise.resolve({}), // Return MetaMetrics props once we enable HW wallets for smart transactions.
    });

    const tokenSearchDiscoveryDataController =
      new TokenSearchDiscoveryDataController({
        tokenPricesService: codefiTokenApiV2,
        swapsSupportedChainIds,
        fetchSwapsTokensThresholdMs: AppConstants.SWAPS.CACHE_TOKENS_THRESHOLD,
        fetchTokens: swapsUtils.fetchTokens,
        messenger: this.controllerMessenger.getRestricted({
          name: 'TokenSearchDiscoveryDataController',
          allowedActions: ['CurrencyRateController:getState'],
          allowedEvents: [],
        }),
      });

    /* bridge controller Initialization */
    const bridgeController = new BridgeController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'BridgeController',
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
      }),
      clientId: BridgeClientId.MOBILE,
      // TODO: change getLayer1GasFee type to match transactionController.getLayer1GasFee
      getLayer1GasFee: async ({
        transactionParams,
        chainId,
      }: {
        transactionParams: TransactionParams;
        chainId: ChainId;
      }) =>
        this.transactionController.getLayer1GasFee({
          transactionParams,
          chainId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      fetchFn: handleFetch,
      config: {
        customBridgeApiBaseUrl: BRIDGE_DEV_API_BASE_URL,
      },
      trackMetaMetricsFn: (event, properties) => {
        const metricsEvent = MetricsEventBuilder.createEventBuilder({
          // category property here maps to event name
          category: event,
        })
          .addProperties({
            ...(properties ?? {}),
          })
          .build();
        MetaMetrics.getInstance().trackEvent(metricsEvent);
      },
    });

    const bridgeStatusController = new BridgeStatusController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'BridgeStatusController',
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
      }),
      state: initialState.BridgeStatusController,
      clientId: BridgeClientId.MOBILE,
      fetchFn: handleFetch,
      addTransactionFn: (
        ...args: Parameters<typeof this.transactionController.addTransaction>
      ) => this.transactionController.addTransaction(...args),
      estimateGasFeeFn: (
        ...args: Parameters<typeof this.transactionController.estimateGasFee>
      ) => this.transactionController.estimateGasFee(...args),
      addUserOperationFromTransactionFn: (...args: unknown[]) =>
        // @ts-expect-error - userOperationController will be made optional, it's only relevant for extension
        this.userOperationController?.addUserOperationFromTransaction?.(
          ...args,
        ),
      config: {
        customBridgeApiBaseUrl: BRIDGE_DEV_API_BASE_URL,
      },
    });

    const existingControllersByName = {
      KeyringController: this.keyringController,
      SmartTransactionsController: this.smartTransactionsController,
    };

    const initRequest = {
      getState: () => store.getState(),
      getGlobalChainId: () => currentChainId,
    };

    const { controllersByName } = initModularizedControllers({
      controllerInitFunctions: {
        ApprovalController: approvalControllerInit,
        NetworkController: networkControllerInit,
        PreferencesController: preferencesControllerInit,
        AssetsContractController: assetsContractControllerInit,
        AccountsController: accountsControllerInit,
        AppMetadataController: appMetadataControllerInit,
        GasFeeController: GasFeeControllerInit,
        TransactionController: TransactionControllerInit,
        SignatureController: SignatureControllerInit,
        CurrencyRateController: currencyRateControllerInit,
        MultichainNetworkController: multichainNetworkControllerInit,
        AddressBookController: addressBookControllerInit,
        LoggingController: loggingControllerInit,
        PhishingController: phishingControllerInit,
        TokenListController: tokenListControllerInit,
        RemoteFeatureFlagController: remoteFeatureFlagControllerInit,
        TokenSearchDiscoveryController: tokenSearchDiscoveryControllerInit,
        EarnController: earnControllerInit,
        SelectedNetworkController: selectedNetworkControllerInit,
        AccountTrackerController: accountTrackerControllerInit,
        TokensController: tokensControllerInit,
        TokenBalancesController: tokenBalancesControllerInit,
        TokenRatesController: tokenRatesControllerInit,
        NftController: nftControllerInit,
        ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
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
        ///: END:ONLY_INCLUDE_IF
      },
      persistedState: initialState as EngineState,
      existingControllersByName,
      baseControllerMessenger: this.controllerMessenger,
      ...initRequest,
    });

    const approvalController = controllersByName.ApprovalController;
    const networkController = controllersByName.NetworkController;
    const preferencesController = controllersByName.PreferencesController;
    const assetsContractController = controllersByName.AssetsContractController;
    const selectedNetworkController = controllersByName.SelectedNetworkController;
    const accountTrackerController = controllersByName.AccountTrackerController;
    const tokensController = controllersByName.TokensController;
    const tokenBalancesController = controllersByName.TokenBalancesController;
    const tokenRatesController = controllersByName.TokenRatesController;
    const nftController = controllersByName.NftController;

    const accountsController = controllersByName.AccountsController;
    const gasFeeController = controllersByName.GasFeeController;
    const signatureController = controllersByName.SignatureController;
    const transactionController = controllersByName.TransactionController;

    // Backwards compatibility for existing references
    this.accountsController = accountsController;
    this.gasFeeController = gasFeeController;
    this.transactionController = transactionController;

    const multichainNetworkController =
      controllersByName.MultichainNetworkController;
    const currencyRateController = controllersByName.CurrencyRateController;
    if (!isProductSafetyDappScanningEnabled()) {
      controllersByName.PhishingController.maybeUpdateState();
    }

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
    const multichainRatesControllerMessenger =
      this.controllerMessenger.getRestricted({
        name: 'RatesController',
        allowedActions: [],
        allowedEvents: ['CurrencyRateController:stateChange'],
      });

    const multichainRatesController = createMultichainRatesController({
      messenger: multichainRatesControllerMessenger,
      initialState: initialState.RatesController,
    });

    // Set up currency rate sync
    setupCurrencyRateSync(
      multichainRatesControllerMessenger,
      multichainRatesController,
    );
    ///: END:ONLY_INCLUDE_IF

    ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
    // Notification Setup
    notificationServicesController.init();
    ///: END:ONLY_INCLUDE_IF

    const tokenListController = new TokenListController({
      chainId: getGlobalChainId(networkController),
      onNetworkStateChange: (listener) =>
        this.controllerMessenger.subscribe(
          AppConstants.NETWORK_STATE_CHANGE_EVENT,
          listener,
        ),
      messenger: this.controllerMessenger.getRestricted({
        name: 'TokenListController',
        allowedActions: ['NetworkController:getNetworkClientById'],
        allowedEvents: ['NetworkController:stateChange'],
      }),
    });

    const permissionController = new PermissionController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'PermissionController',
        allowedActions: [
          'ApprovalController:addRequest',
          'ApprovalController:hasRequest',
          'ApprovalController:acceptRequest',
          'ApprovalController:rejectRequest',
          ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
          `SnapController:getPermitted`,
          `SnapController:install`,
          `SubjectMetadataController:getSubjectMetadata`,
          ///: END:ONLY_INCLUDE_IF
        ],
        allowedEvents: [],
      }),
      state: initialState.PermissionController,
      caveatSpecifications: getCaveatSpecifications({
        listAccounts: (...args) =>
          this.accountsController.listAccounts(...args),
        findNetworkClientIdByChainId:
          networkController.findNetworkClientIdByChainId.bind(
            networkController,
          ),
      }),
      permissionSpecifications: {
        ...getPermissionSpecifications(),
        ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
        ...getSnapPermissionSpecifications(),
        ///: END:ONLY_INCLUDE_IF
      },
      unrestrictedMethods,
    });

    this.context = {
      KeyringController: this.keyringController,
      AccountTrackerController: accountTrackerController,
      AddressBookController: controllersByName.AddressBookController,
      AppMetadataController: controllersByName.AppMetadataController,
      AssetsContractController: assetsContractController,
      NftController: nftController,
      TokensController: tokensController,
      TokenListController: controllersByName.TokenListController,
      TokenDetectionController: new TokenDetectionController({
        messenger: this.controllerMessenger.getRestricted({
          name: 'TokenDetectionController',
          allowedActions: [
            'AccountsController:getSelectedAccount',
            'NetworkController:getNetworkClientById',
            'NetworkController:getNetworkConfigurationByNetworkClientId',
            'NetworkController:getState',
            'KeyringController:getState',
            'PreferencesController:getState',
            'TokenListController:getState',
            'TokensController:getState',
            'TokensController:addDetectedTokens',
            'AccountsController:getAccount',
          ],
          allowedEvents: [
            'KeyringController:lock',
            'KeyringController:unlock',
            'PreferencesController:stateChange',
            'NetworkController:networkDidChange',
            'TokenListController:stateChange',
            'TokensController:stateChange',
            'AccountsController:selectedEvmAccountChange',
          ],
        }),
        trackMetaMetricsEvent: () =>
          MetaMetrics.getInstance().trackEvent(
            MetricsEventBuilder.createEventBuilder(
              MetaMetricsEvents.TOKEN_DETECTED,
            )
              .addProperties({
                token_standard: 'ERC20',
                asset_type: 'token',
                chain_id: getDecimalChainId(
                  getGlobalChainId(networkController),
                ),
              })
              .build(),
          ),
        getBalancesInSingleCall:
          assetsContractController.getBalancesInSingleCall.bind(
            assetsContractController,
          ),
        platform: 'mobile',
        useAccountsAPI: true,
        disabled: false,
      }),
      NftDetectionController: new NftDetectionController({
        messenger: this.controllerMessenger.getRestricted({
          name: 'NftDetectionController',
          allowedEvents: [
            'NetworkController:stateChange',
            'PreferencesController:stateChange',
          ],
          allowedActions: [
            'ApprovalController:addRequest',
            'NetworkController:getState',
            'NetworkController:getNetworkClientById',
            'PreferencesController:getState',
            'AccountsController:getSelectedAccount',
          ],
        }),
        disabled: false,
        addNft: nftController.addNft.bind(nftController),
        getNftState: () => nftController.state,
      }),
      CurrencyRateController: currencyRateController,
      NetworkController: networkController,
      PhishingController: controllersByName.PhishingController,
      PreferencesController: preferencesController,
      TokenBalancesController: tokenBalancesController,
      TokenRatesController: tokenRatesController,
      TransactionController: this.transactionController,
      SmartTransactionsController: this.smartTransactionsController,
      SwapsController: new SwapsController({
        clientId: AppConstants.SWAPS.CLIENT_ID,
        fetchAggregatorMetadataThreshold:
          AppConstants.SWAPS.CACHE_AGGREGATOR_METADATA_THRESHOLD,
        fetchTokensThreshold: AppConstants.SWAPS.CACHE_TOKENS_THRESHOLD,
        fetchTopAssetsThreshold: AppConstants.SWAPS.CACHE_TOP_ASSETS_THRESHOLD,
        supportedChainIds: swapsSupportedChainIds,
        // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
        messenger: this.controllerMessenger.getRestricted({
          name: 'SwapsController',
          // TODO: allow these internal calls once GasFeeController
          // export these action types and register its action handlers
          // allowedActions: [
          //   'GasFeeController:getEIP1559GasFeeEstimates',
          // ],
          allowedActions: ['NetworkController:getNetworkClientById'],
          allowedEvents: ['NetworkController:networkDidChange'],
        }),
        pollCountLimit: AppConstants.SWAPS.POLL_COUNT_LIMIT,
        // TODO: Remove once GasFeeController exports this action type
        fetchGasFeeEstimates: () =>
          this.gasFeeController.fetchGasFeeEstimates(),
        fetchEstimatedMultiLayerL1Fee,
      }),
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
      PPOMController: new PPOMController({
        chainId: getGlobalChainId(networkController),
        blockaidPublicKey: process.env.BLOCKAID_PUBLIC_KEY as string,
        cdnBaseUrl: process.env.BLOCKAID_FILE_CDN as string,
        // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
        messenger: this.controllerMessenger.getRestricted({
          name: 'PPOMController',
          allowedActions: ['NetworkController:getNetworkClientById'],
          allowedEvents: [`${networkController.name}:networkDidChange`],
        }),
        onPreferencesChange: (listener) =>
          this.controllerMessenger.subscribe(
            `${preferencesController.name}:stateChange`,
            listener,
          ),
        // TODO: Replace "any" with type
        provider:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          networkController.getProviderAndBlockTracker().provider as any,
        ppomProvider: {
          // TODO: Replace "any" with type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          PPOM: PPOM as any,
          ppomInit,
        },
        storageBackend: new RNFSStorageBackend('PPOMDB'),
        securityAlertsEnabled:
          initialState.PreferencesController?.securityAlertsEnabled ?? false,
        state: initialState.PPOMController,
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nativeCrypto: Crypto as any,
      }),
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
      getCurrentChainId: () => currentChainId,
      setCurrentChainId: (chainId: string) => {
        currentChainId = chainId;
      },
      ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
      snapControllerName: snapController.name,
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

  getTotalEvmFiatAccountBalance = (account?: InternalAccount) =>
    getTotalEvmFiatAccountBalanceFn(this.context, () => store.getState(), account);

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

  hasFunds = () =>
    hasFundsFn(
      () => this.getTotalEvmFiatAccountBalance(),
      () => store.getState(),
    );

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
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values(this.context).forEach((controller: any) => {
      if (controller.destroy) {
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
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (opts.logErrors !== false) {
        Logger.error(
          error,
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
