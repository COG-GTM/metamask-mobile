import { noop } from 'lodash';
import { getAccountsControllerMessenger } from './accounts-controller-messenger';
import { getMultichainNetworkControllerMessenger } from './multichain-network-controller-messenger/multichain-network-controller-messenger';
import { getCurrencyRateControllerMessenger } from './currency-rate-controller-messenger/currency-rate-controller-messenger';
import { getAppMetadataControllerMessenger } from './app-metadata-controller-messenger';
import { getApprovalControllerMessenger } from './approval-controller-messenger';
import { getNetworkControllerMessenger } from './network-controller-messenger';
import { getPreferencesControllerMessenger } from './preferences-controller-messenger';
import { getAssetsContractControllerMessenger } from './assets-contract-controller-messenger';
import { getAccountTrackerControllerMessenger } from './account-tracker-controller-messenger';
import { getTokenBalancesControllerMessenger } from './token-balances-controller-messenger';
import { getTokenRatesControllerMessenger } from './token-rates-controller-messenger';
import { getNftControllerMessenger } from './nft-controller-messenger';
import { getTokensControllerMessenger } from './tokens-controller-messenger';
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import {
  getCronjobControllerMessenger,
  getExecutionServiceMessenger,
  getSnapControllerInitMessenger,
  getSnapControllerMessenger,
  getSnapInterfaceControllerMessenger,
  getSnapsRegistryMessenger,
} from './snaps';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { getMultichainAssetsRatesControllerMessenger } from './multichain-assets-rates-controller-messenger/multichain-assets-rates-controller-messenger';
import { getMultichainAssetsControllerMessenger } from './multichain-assets-controller-messenger/multichain-assets-controller-messenger';
import { getMultichainBalancesControllerMessenger } from './multichain-balances-controller-messenger/multichain-balances-controller-messenger';
import { getMultichainTransactionsControllerMessenger } from './multichain-transactions-controller-messenger/multichain-transactions-controller-messenger';
///: END:ONLY_INCLUDE_IF
import {
  getTransactionControllerInitMessenger,
  getTransactionControllerMessenger,
} from './transaction-controller-messenger';
import { getNotificationServicesControllerMessenger } from './notifications/notification-services-controller-messenger';
import { getNotificationServicesPushControllerMessenger } from './notifications/notification-services-push-controller-messenger';
import { getGasFeeControllerMessenger } from './gas-fee-controller-messenger/gas-fee-controller-messenger';
import { getSignatureControllerMessenger } from './signature-controller-messenger';
/**
 * The messengers for the controllers that have been.
 */
export const CONTROLLER_MESSENGERS = {
  AccountsController: {
    getMessenger: getAccountsControllerMessenger,
    getInitMessenger: noop,
  },
  TransactionController: {
    getMessenger: getTransactionControllerMessenger,
    getInitMessenger: getTransactionControllerInitMessenger,
  },
  CurrencyRateController: {
    getMessenger: getCurrencyRateControllerMessenger,
    getInitMessenger: noop,
  },
  MultichainNetworkController: {
    getMessenger: getMultichainNetworkControllerMessenger,
    getInitMessenger: noop,
  },
  GasFeeController: {
    getMessenger: getGasFeeControllerMessenger,
    getInitMessenger: noop,
  },
  AppMetadataController: {
    getMessenger: getAppMetadataControllerMessenger,
    getInitMessenger: noop,
  },
  SignatureController: {
    getMessenger: getSignatureControllerMessenger,
    getInitMessenger: noop,
  },
  ApprovalController: {
    getMessenger: getApprovalControllerMessenger,
    getInitMessenger: noop,
  },
  NetworkController: {
    getMessenger: getNetworkControllerMessenger,
    getInitMessenger: noop,
  },
  PreferencesController: {
    getMessenger: getPreferencesControllerMessenger,
    getInitMessenger: noop,
  },
  AssetsContractController: {
    getMessenger: getAssetsContractControllerMessenger,
    getInitMessenger: noop,
  },
  AccountTrackerController: {
    getMessenger: getAccountTrackerControllerMessenger,
    getInitMessenger: noop,
  },
  TokenBalancesController: {
    getMessenger: getTokenBalancesControllerMessenger,
    getInitMessenger: noop,
  },
  TokenRatesController: {
    getMessenger: getTokenRatesControllerMessenger,
    getInitMessenger: noop,
  },
  NftController: {
    getMessenger: getNftControllerMessenger,
    getInitMessenger: noop,
  },
  TokensController: {
    getMessenger: getTokensControllerMessenger,
    getInitMessenger: noop,
  },
  ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
  CronjobController: {
    getMessenger: getCronjobControllerMessenger,
    getInitMessenger: noop,
  },
  ExecutionService: {
    getMessenger: getExecutionServiceMessenger,
    getInitMessenger: noop,
  },
  SnapController: {
    getMessenger: getSnapControllerMessenger,
    getInitMessenger: getSnapControllerInitMessenger,
  },
  SnapInterfaceController: {
    getMessenger: getSnapInterfaceControllerMessenger,
    getInitMessenger: noop,
  },
  SnapsRegistry: {
    getMessenger: getSnapsRegistryMessenger,
    getInitMessenger: noop,
  },
  NotificationServicesController: {
    getMessenger: getNotificationServicesControllerMessenger,
    getInitMessenger: noop,
  },
  NotificationServicesPushController: {
    getMessenger: getNotificationServicesPushControllerMessenger,
    getInitMessenger: noop,
  },
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  MultichainAssetsController: {
    getMessenger: getMultichainAssetsControllerMessenger,
    getInitMessenger: noop,
  },
  MultichainAssetsRatesController: {
    getMessenger: getMultichainAssetsRatesControllerMessenger,
    getInitMessenger: noop,
  },
  MultichainBalancesController: {
    getMessenger: getMultichainBalancesControllerMessenger,
    getInitMessenger: noop,
  },
  MultichainTransactionsController: {
    getMessenger: getMultichainTransactionsControllerMessenger,
    getInitMessenger: noop,
  },
  ///: END:ONLY_INCLUDE_IF
} as const;
