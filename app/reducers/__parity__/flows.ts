/* eslint-disable import/no-namespace */
import * as transaction from '../../actions/transaction';
import * as security from '../../actions/security';
import * as accounts from '../../actions/accounts';
import * as settings from '../../actions/settings';
import * as user from '../../actions/user';
import * as onboarding from '../../actions/onboarding';
import * as browser from '../../actions/browser';
import * as bookmarks from '../../actions/bookmarks';
import * as notification from '../../actions/notification';
import * as collectibles from '../../actions/collectibles';
import * as modals from '../../actions/modals';
import * as alertActions from '../../actions/alert';
import setOnboardingWizardStep from '../../actions/wizard';
import * as privacy from '../../actions/privacy';
import * as infura from '../../actions/infuraAvailability';
import setSignatureRequestSecurityAlertResponse from '../../actions/signatureRequest';
import * as rpcEvents from '../../actions/rpcEvents';
import * as sdk from '../../actions/sdk';
import * as onboardNetwork from '../../actions/onboardNetwork';
import * as navigation from '../../actions/navigation';
import {
  showNftFetchingLoadingIndicator,
  hideNftFetchingLoadingIndicator,
} from '../collectibles';
import {
  storePrivacyPolicyShownDate,
  storePrivacyPolicyClickedOrClosed,
} from '../legalNotices';
import { AppThemeKey } from '../../util/theme/models';
import { FIXED_NOW, raw, rehydrateStep, step, unknownStep } from './builders';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  DAI,
  ETH_ASSET,
  NFT,
  SDK_CONNECTION,
  SECURITY_ALERT,
  TX_ETH,
  WC2_METADATA,
} from './scenarios';
import type { FlowScenario } from './types';

type AnyCreator = (...args: unknown[]) => unknown;
const signatureAlert = setSignatureRequestSecurityAlertResponse as AnyCreator;
const saveOnboardingEvent = onboarding.saveOnboardingEvent as AnyCreator;

/**
 * Store-level user flows replayed through the real root reducer
 * (app/reducers/index.ts). Documented with Android UI steps in
 * docs/modernisation-wallet/flows.md.
 */
export function buildFlowScenarios(): FlowScenario[] {
  return [
    {
      name: 'app-start-rehydrate',
      description:
        'Cold start: redux-persist rehydrates persisted slices, Engine services become ready.',
      steps: [
        rehydrateStep({
          transaction: { nonce: 3, securityAlertResponses: {} },
          wizard: { step: 0 },
          settings: { lockTime: 30000, primaryCurrency: 'ETH' },
          user: { passwordSet: true, seedphraseBackedUp: true },
        }),
        step(
          'persisted data loaded',
          'actions/user.onPersistedDataLoaded',
          user.onPersistedDataLoaded,
        ),
        step(
          'app services ready',
          'actions/user.setAppServicesReady',
          user.setAppServicesReady,
        ),
        unknownStep(),
      ],
    },
    {
      name: 'onboarding-wallet-creation',
      description:
        'New user creates a wallet: password, SRP backup, metrics consent, onboarding complete, first login.',
      steps: [
        step(
          'track onboarding started',
          'actions/onboarding.saveOnboardingEvent',
          saveOnboardingEvent,
          [{ category: 'Onboarding Started' }],
        ),
        step(
          'metrics opt-in',
          'actions/security.setDataCollectionForMarketing',
          security.setDataCollectionForMarketing,
          true,
        ),
        step(
          'creating wallet spinner',
          'actions/user.loadingSet',
          user.loadingSet,
          'Creating your wallet...',
        ),
        step('password set', 'actions/user.passwordSet', user.passwordSet),
        step(
          'seedphrase not backed up yet',
          'actions/user.seedphraseNotBackedUp',
          user.seedphraseNotBackedUp,
        ),
        step('loading done', 'actions/user.loadingUnset', user.loadingUnset),
        step(
          'track wallet created',
          'actions/onboarding.saveOnboardingEvent',
          saveOnboardingEvent,
          [
            {
              category: 'Wallet Created',
              properties: { biometrics_enabled: false },
            },
          ],
        ),
        step(
          'seedphrase backed up',
          'actions/user.seedphraseBackedUp',
          user.seedphraseBackedUp,
        ),
        step(
          'allow remember me',
          'actions/security.setAllowLoginWithRememberMe',
          security.setAllowLoginWithRememberMe,
          false,
        ),
        step(
          'onboarding completed',
          'actions/onboarding.setCompletedOnboarding',
          onboarding.setCompletedOnboarding,
          true,
        ),
        step(
          'wizard step 1',
          'actions/wizard.default',
          setOnboardingWizardStep,
          1,
        ),
        step('log in', 'actions/user.logIn', user.logIn),
        step(
          'reload accounts',
          'actions/accounts.setReloadAccounts',
          accounts.setReloadAccounts,
          true,
        ),
        step(
          'wizard dismissed',
          'actions/wizard.default',
          setOnboardingWizardStep,
          0,
        ),
        step(
          'clear onboarding events',
          'actions/onboarding.clearOnboardingEvents',
          onboarding.clearOnboardingEvents,
        ),
        step(
          'NFT auto-detection modal shown',
          'actions/security.setNftAutoDetectionModalOpen',
          security.setNftAutoDetectionModalOpen,
          true,
        ),
      ],
    },
    {
      name: 'lock-unlock-login',
      description:
        'Auto-lock, failed then successful biometric/password unlock, logout and login again.',
      steps: [
        step('log in', 'actions/user.logIn', user.logIn),
        step('lock app', 'actions/user.lockApp', user.lockApp),
        step(
          'interrupt biometrics',
          'actions/user.interruptBiometrics',
          user.interruptBiometrics,
        ),
        step('auth error', 'actions/user.authError', user.authError, 'bio-1'),
        step(
          'checked auth',
          'actions/user.checkedAuth',
          user.checkedAuth,
          'Login',
        ),
        step(
          'auth success',
          'actions/user.authSuccess',
          user.authSuccess,
          'bio-2',
        ),
        step('log in again', 'actions/user.logIn', user.logIn),
        step(
          'route to wallet',
          'actions/navigation.setCurrentRoute',
          navigation.setCurrentRoute,
          'WalletView',
        ),
        step('log out', 'actions/user.logOut', user.logOut),
        step('log in after logout', 'actions/user.logIn', user.logIn),
      ],
    },
    {
      name: 'settings-currency-privacy-basic-functionality',
      description:
        'Settings: primary currency, hide zero balances, lock timer, search engine, hex data, theme, basic functionality off/on, privacy hosts.',
      steps: [
        step(
          'primary currency fiat',
          'actions/settings.setPrimaryCurrency',
          settings.setPrimaryCurrency,
          'Fiat',
        ),
        step(
          'hide zero balance tokens',
          'actions/settings.setHideZeroBalanceTokens',
          settings.setHideZeroBalanceTokens,
          true,
        ),
        step(
          'show fiat on testnets',
          'actions/settings.setShowFiatOnTestnets',
          settings.setShowFiatOnTestnets,
          true,
        ),
        step(
          'auto-lock after 30s',
          'actions/settings.setLockTime',
          settings.setLockTime,
          30000,
        ),
        step(
          'search engine DuckDuckGo',
          'actions/settings.setSearchEngine',
          settings.setSearchEngine,
          'DuckDuckGo',
        ),
        step(
          'show hex data',
          'actions/settings.setShowHexData',
          settings.setShowHexData,
          true,
        ),
        step(
          'show custom nonce',
          'actions/settings.setShowCustomNonce',
          settings.setShowCustomNonce,
          true,
        ),
        step(
          'jazzicon instead of blockies',
          'actions/settings.setUseBlockieIcon',
          settings.setUseBlockieIcon,
          false,
        ),
        step(
          'dark theme',
          'actions/user.setAppTheme',
          user.setAppTheme,
          AppThemeKey.dark,
        ),
        step(
          'basic functionality off',
          'actions/settings.toggleBasicFunctionality',
          settings.toggleBasicFunctionality,
          false,
        ),
        step(
          'basic functionality on',
          'actions/settings.toggleBasicFunctionality',
          settings.toggleBasicFunctionality,
          true,
        ),
        step(
          'device notifications on',
          'actions/settings.toggleDeviceNotification',
          settings.toggleDeviceNotification,
          true,
        ),
        step(
          'approve host',
          'actions/privacy.approveHost',
          privacy.approveHost,
          'app.uniswap.org',
        ),
        step(
          'reveal SRP timestamp',
          'actions/privacy.recordSRPRevealTimestamp',
          privacy.recordSRPRevealTimestamp,
          FIXED_NOW,
        ),
        raw('clear privacy data', { type: 'CLEAR_HOSTS' }),
        step(
          'primary currency back to ETH',
          'actions/settings.setPrimaryCurrency',
          settings.setPrimaryCurrency,
          'ETH',
        ),
      ],
    },
    {
      name: 'browser-tab-bookmark',
      description:
        'Open the in-app browser, visit a dapp, add/remove a bookmark, manage tabs and history.',
      steps: [
        step(
          'bottom nav browser',
          'actions/navigation.setCurrentBottomNavRoute',
          navigation.setCurrentBottomNavRoute,
          'Browser',
        ),
        step(
          'create tab',
          'actions/browser.createNewTab',
          browser.createNewTab,
          'https://app.uniswap.org',
          undefined,
        ),
        step(
          'activate tab',
          'actions/browser.setActiveTab',
          browser.setActiveTab,
          FIXED_NOW,
        ),
        step('history', 'actions/browser.addToHistory', browser.addToHistory, {
          url: 'https://app.uniswap.org',
          name: 'Uniswap',
        }),
        step(
          'viewed dapp',
          'actions/browser.addToViewedDapp',
          browser.addToViewedDapp,
          'app.uniswap.org',
        ),
        step('favicon', 'actions/browser.storeFavicon', browser.storeFavicon, {
          origin: 'https://app.uniswap.org',
          url: 'https://app.uniswap.org/favicon.png',
        }),
        step(
          'add bookmark',
          'actions/bookmarks.addBookmark',
          bookmarks.addBookmark,
          { name: 'Uniswap', url: 'https://app.uniswap.org' },
        ),
        step(
          'navigate tab',
          'actions/browser.updateTab',
          browser.updateTab,
          FIXED_NOW,
          { url: 'https://opensea.io' },
        ),
        step(
          'whitelist phishing-reviewed site',
          'actions/browser.addToWhitelist',
          browser.addToWhitelist,
          'https://phishing-reviewed.example',
        ),
        step(
          'remove bookmark',
          'actions/bookmarks.removeBookmark',
          bookmarks.removeBookmark,
          { name: 'Uniswap', url: 'https://app.uniswap.org' },
        ),
        step(
          'close tab',
          'actions/browser.closeTab',
          browser.closeTab,
          FIXED_NOW,
        ),
        step(
          'clear history',
          'actions/browser.clearHistory',
          browser.clearHistory,
          true,
          true,
        ),
        step(
          'close all tabs',
          'actions/browser.closeAllTabs',
          browser.closeAllTabs,
        ),
      ],
    },
    {
      name: 'send-eth-transaction-lifecycle',
      description:
        'Send ETH: new asset tx, recipient, amount, max mode, nonce, tx object, id, notification, reset.',
      steps: [
        step(
          'new ETH send',
          'actions/transaction.newAssetTransaction',
          transaction.newAssetTransaction,
          ETH_ASSET,
        ),
        step(
          'recipient',
          'actions/transaction.setRecipient',
          transaction.setRecipient,
          ACCOUNT_1,
          ACCOUNT_2,
          undefined,
          'Account 2',
          'Account 1',
        ),
        step(
          'selected asset',
          'actions/transaction.setSelectedAsset',
          transaction.setSelectedAsset,
          ETH_ASSET,
        ),
        step(
          'amount',
          'actions/transaction.setTransactionValue',
          transaction.setTransactionValue,
          '0x2386f26fc10000',
        ),
        step(
          'max mode on',
          'actions/transaction.setMaxValueMode',
          transaction.setMaxValueMode,
          true,
        ),
        step(
          'max mode off',
          'actions/transaction.setMaxValueMode',
          transaction.setMaxValueMode,
          false,
        ),
        step(
          'prepare',
          'actions/transaction.prepareTransaction',
          transaction.prepareTransaction,
          {
            from: ACCOUNT_1,
            to: ACCOUNT_2,
            value: '0x2386f26fc10000',
            data: '0x',
          },
        ),
        step(
          'proposed nonce',
          'actions/transaction.setProposedNonce',
          transaction.setProposedNonce,
          12,
        ),
        step(
          'custom nonce',
          'actions/transaction.setNonce',
          transaction.setNonce,
          12,
        ),
        step(
          'tx object',
          'actions/transaction.setTransactionObject',
          transaction.setTransactionObject,
          { ...TX_ETH, selectedAsset: ETH_ASSET },
        ),
        step(
          'tx id',
          'actions/transaction.setTransactionId',
          transaction.setTransactionId,
          TX_ETH.id,
        ),
        step(
          'pending notification',
          'actions/notification.showTransactionNotification',
          notification.showTransactionNotification,
          {
            transaction: { id: TX_ETH.id },
            status: 'pending',
            autodismiss: undefined,
          },
        ),
        step(
          'reset',
          'actions/transaction.resetTransaction',
          transaction.resetTransaction,
        ),
        step(
          'new ERC20 send',
          'actions/transaction.newAssetTransaction',
          transaction.newAssetTransaction,
          DAI,
        ),
        step(
          'tokens transaction',
          'actions/transaction.setTokensTransaction',
          transaction.setTokensTransaction,
          DAI,
        ),
        step(
          'dapp ether transaction',
          'actions/transaction.setEtherTransaction',
          transaction.setEtherTransaction,
          { ...TX_ETH, origin: 'https://app.uniswap.org' },
        ),
        step(
          'reset again',
          'actions/transaction.resetTransaction',
          transaction.resetTransaction,
        ),
      ],
    },
    {
      name: 'security-alerts',
      description:
        'Blockaid security alerts on transactions and signatures, automatic security checks.',
      steps: [
        raw('security alerts enabled', {
          type: 'SET_SECURITY_ALERTS_ENABLED',
          securityAlertsEnabled: true,
        }),
        step(
          'new ETH send',
          'actions/transaction.newAssetTransaction',
          transaction.newAssetTransaction,
          ETH_ASSET,
        ),
        step(
          'tx id',
          'actions/transaction.setTransactionId',
          transaction.setTransactionId,
          'tx-malicious',
        ),
        step(
          'tx security alert',
          'actions/transaction.setTransactionSecurityAlertResponse',
          transaction.setTransactionSecurityAlertResponse,
          'tx-malicious',
          SECURITY_ALERT,
        ),
        step(
          'signature security alert',
          'actions/signatureRequest.default',
          signatureAlert,
          SECURITY_ALERT,
        ),
        step(
          'signature alert cleared',
          'actions/signatureRequest.default',
          signatureAlert,
          undefined,
        ),
        step(
          'automatic security checks modal',
          'actions/security.setAutomaticSecurityChecksModalOpen',
          security.setAutomaticSecurityChecksModalOpen,
          true,
        ),
        step(
          'automatic security checks on',
          'actions/security.setAutomaticSecurityChecks',
          security.setAutomaticSecurityChecks,
          true,
        ),
        step(
          'user selected option',
          'actions/security.userSelectedAutomaticSecurityChecksOptions',
          security.userSelectedAutomaticSecurityChecksOptions,
        ),
        step(
          'reset tx (alerts preserved)',
          'actions/transaction.resetTransaction',
          transaction.resetTransaction,
        ),
        raw('security alerts disabled', {
          type: 'SET_SECURITY_ALERTS_ENABLED',
          securityAlertsEnabled: false,
        }),
      ],
    },
    {
      name: 'notifications',
      description:
        'In-app toast notification queue: simple + transaction notifications, modify, hide, replace, remove.',
      steps: [
        step(
          'simple notification',
          'actions/notification.showSimpleNotification',
          notification.showSimpleNotification,
          {
            id: 'copy-1',
            title: 'Copied',
            description: 'Address copied',
            status: 'simple_notification',
            autodismiss: 1500,
          },
        ),
        step(
          'tx notification',
          'actions/notification.showTransactionNotification',
          notification.showTransactionNotification,
          {
            transaction: { id: 'tx-1' },
            status: 'pending',
            autodismiss: undefined,
          },
        ),
        raw('modify tx notification', {
          type: 'MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION',
          id: 'tx-1',
          transaction: { id: 'tx-1' },
          status: 'success',
          autodismiss: 5000,
        }),
        step(
          'modify or show simple (no id)',
          'actions/notification.modifyOrShowSimpleNotificationById',
          notification.modifyOrShowSimpleNotificationById,
          {
            title: 'Network added',
            description: 'Polygon',
            status: 'success',
            autodismiss: 2000,
          },
        ),
        step(
          'hide by id',
          'actions/notification.hideNotificationById',
          notification.hideNotificationById,
          'copy-1',
        ),
        step(
          'replace by id',
          'actions/notification.replaceNotificationById',
          notification.replaceNotificationById,
          {
            id: 'tx-1',
            isVisible: true,
            status: 'confirmed',
            transaction: { id: 'tx-1' },
          },
        ),
        step(
          'hide current',
          'actions/notification.hideCurrentNotification',
          notification.hideCurrentNotification,
        ),
        step(
          'remove not visible',
          'actions/notification.removeNotVisibleNotifications',
          notification.removeNotVisibleNotifications,
        ),
        step(
          'remove by id',
          'actions/notification.removeNotificationById',
          notification.removeNotificationById,
          'tx-1',
        ),
        step(
          'remove current',
          'actions/notification.removeCurrentNotification',
          notification.removeCurrentNotification,
        ),
      ],
    },
    {
      name: 'network-selector-onboarding',
      description:
        'Open network selector, switch to a new network, network onboarding sheet, Infura availability.',
      steps: [
        step(
          'open network selector',
          'actions/modals.toggleNetworkModal',
          modals.toggleNetworkModal,
        ),
        step(
          'show network onboarding',
          'actions/onboardNetwork.showNetworkOnboardingAction',
          onboardNetwork.showNetworkOnboardingAction,
          {
            networkUrl: 'https://polygon-rpc.com',
            networkType: 'rpc',
            nativeToken: 'POL',
            showNetworkOnboarding: true,
          },
        ),
        step(
          'network switched',
          'actions/onboardNetwork.networkSwitched',
          onboardNetwork.networkSwitched,
          { networkUrl: 'https://polygon-rpc.com', networkStatus: true },
        ),
        step(
          'network onboarded',
          'actions/onboardNetwork.onboardNetworkAction',
          onboardNetwork.onboardNetworkAction,
          '0x89',
        ),
        step(
          'close network selector',
          'actions/modals.toggleNetworkModal',
          modals.toggleNetworkModal,
          false,
        ),
        step(
          'info network modal',
          'actions/modals.toggleInfoNetworkModal',
          modals.toggleInfoNetworkModal,
          true,
        ),
        step(
          'info network modal closed',
          'actions/modals.toggleInfoNetworkModal',
          modals.toggleInfoNetworkModal,
          false,
        ),
        step(
          'infura blocked',
          'actions/infuraAvailability.setInfuraAvailabilityBlocked',
          infura.setInfuraAvailabilityBlocked,
        ),
        step(
          'infura available',
          'actions/infuraAvailability.setInfuraAvailabilityNotBlocked',
          infura.setInfuraAvailabilityNotBlocked,
        ),
      ],
    },
    {
      name: 'sdk-walletconnect-connections',
      description:
        'MetaMask SDK and WalletConnect v2: connect, approve host, metadata, dapp connection, disconnect.',
      steps: [
        step(
          'add SDK connection',
          'actions/sdk.addConnection',
          sdk.addConnection as AnyCreator,
          SDK_CONNECTION.id,
          SDK_CONNECTION,
        ),
        step(
          'approve host',
          'actions/sdk.setApprovedHost',
          sdk.setApprovedHost,
          SDK_CONNECTION.id,
          FIXED_NOW + 3600000,
        ),
        step(
          'connected',
          'actions/sdk.setConnected',
          sdk.setConnected,
          SDK_CONNECTION.id,
          true,
        ),
        step(
          'WC2 metadata',
          'actions/sdk.updateWC2Metadata',
          sdk.updateWC2Metadata,
          WC2_METADATA,
        ),
        step(
          'deeplink dapp connection',
          'actions/sdk.updateDappConnection',
          sdk.updateDappConnection as AnyCreator,
          'dapp-1',
          { ...SDK_CONNECTION, id: 'dapp-1', origin: 'deeplink' },
        ),
        step(
          'update connection',
          'actions/sdk.updateConnection',
          sdk.updateConnection as AnyCreator,
          SDK_CONNECTION.id,
          { ...SDK_CONNECTION, lastAuthorized: FIXED_NOW },
        ),
        step('disconnect all', 'actions/sdk.disconnectAll', sdk.disconnectAll),
        step(
          'remove dapp connection',
          'actions/sdk.removeDappConnection',
          sdk.removeDappConnection,
          'dapp-1',
        ),
        step(
          'remove approved host',
          'actions/sdk.removeApprovedHost',
          sdk.removeApprovedHost,
          SDK_CONNECTION.id,
        ),
        step(
          'remove connection',
          'actions/sdk.removeConnection',
          sdk.removeConnection,
          SDK_CONNECTION.id,
        ),
      ],
    },
    {
      name: 'rpc-events',
      description:
        'Dapp signature request lifecycle tracked by rpcEvents: request, complete, error, reset.',
      steps: [
        step(
          'personal_sign requested',
          'actions/rpcEvents.setEventStage',
          rpcEvents.setEventStage,
          'personal_sign',
          'request_send',
        ),
        step(
          'personal_sign complete',
          'actions/rpcEvents.setEventStage',
          rpcEvents.setEventStage,
          'personal_sign',
          'complete',
        ),
        step(
          'eth_signTypedData_v4 requested',
          'actions/rpcEvents.setEventStage',
          rpcEvents.setEventStage,
          'eth_signTypedData_v4',
          'request_send',
        ),
        step(
          'eth_signTypedData_v4 rejected',
          'actions/rpcEvents.setEventStageError',
          rpcEvents.setEventStageError,
          'eth_signTypedData_v4',
          new Error('User rejected the request.'),
        ),
        step(
          'reset',
          'actions/rpcEvents.resetEventStage',
          rpcEvents.resetEventStage,
          'eth_signTypedData_v4',
        ),
        step(
          'non-whitelisted rpc ignored',
          'actions/rpcEvents.setEventStage',
          rpcEvents.setEventStage,
          'eth_sendTransaction',
          'request_send',
        ),
      ],
    },
    {
      name: 'legal-notices',
      description: 'New privacy policy toast shown once, then dismissed.',
      steps: [
        step(
          'privacy toast shown',
          'reducers/legalNotices.storePrivacyPolicyShownDate',
          storePrivacyPolicyShownDate,
          FIXED_NOW,
        ),
        step(
          'privacy toast shown again (ignored)',
          'reducers/legalNotices.storePrivacyPolicyShownDate',
          storePrivacyPolicyShownDate,
          FIXED_NOW + 60000,
        ),
        step(
          'privacy toast closed',
          'reducers/legalNotices.storePrivacyPolicyClickedOrClosed',
          storePrivacyPolicyClickedOrClosed,
        ),
      ],
    },
    {
      name: 'modals-alerts-collectibles',
      description:
        'Clipboard alert, dapp tx / sign modals, NFT favourite and fetching loader.',
      steps: [
        step(
          'copy address alert',
          'actions/alertActions.showAlert',
          alertActions.showAlert,
          {
            isVisible: true,
            autodismiss: 1500,
            content: 'clipboard-alert',
            data: { msg: 'Public address copied to clipboard' },
          },
        ),
        step(
          'dismiss alert',
          'actions/alertActions.dismissAlert',
          alertActions.dismissAlert,
        ),
        step(
          'dapp tx modal',
          'actions/modals.toggleDappTransactionModal',
          modals.toggleDappTransactionModal,
          true,
        ),
        step(
          'dapp tx modal closed',
          'actions/modals.toggleDappTransactionModal',
          modals.toggleDappTransactionModal,
          false,
        ),
        step(
          'sign modal hidden',
          'actions/modals.toggleSignModal',
          modals.toggleSignModal,
          false,
        ),
        step(
          'sign modal shown',
          'actions/modals.toggleSignModal',
          modals.toggleSignModal,
          true,
        ),
        step(
          'collectible contract modal',
          'actions/modals.toggleCollectibleContractModal',
          modals.toggleCollectibleContractModal,
        ),
        step(
          'NFT loader shown',
          'reducers/collectibles.showNftFetchingLoadingIndicator',
          showNftFetchingLoadingIndicator,
        ),
        step(
          'favourite NFT',
          'actions/collectibles.addFavoriteCollectible',
          collectibles.addFavoriteCollectible,
          ACCOUNT_1,
          '0x1',
          NFT,
        ),
        step(
          'unfavourite NFT',
          'actions/collectibles.removeFavoriteCollectible',
          collectibles.removeFavoriteCollectible,
          ACCOUNT_1,
          '0x1',
          NFT,
        ),
        step(
          'NFT loader hidden',
          'reducers/collectibles.hideNftFetchingLoadingIndicator',
          hideNftFetchingLoadingIndicator,
        ),
      ],
    },
  ];
}
