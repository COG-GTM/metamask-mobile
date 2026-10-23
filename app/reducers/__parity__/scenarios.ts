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
import {
  FIXED_NOW,
  initStep,
  raw,
  rehydrateStep,
  step,
  unknownStep,
} from './builders';
import type { ReducerScenario, ScenarioStep } from './types';

/* Deterministic fixtures shared by reducer and flow scenarios. */
export const ACCOUNT_1 = '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272';
export const ACCOUNT_2 = '0xd018538C87232FF95acbCe4870629b75640a78E7';
export const DAI = {
  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  symbol: 'DAI',
  decimals: 18,
};
export const ETH_ASSET = { isETH: true, symbol: 'ETH', decimals: 18 };
export const NFT = {
  address: '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d',
  tokenId: '1773',
  name: 'CryptoKitty 1773',
};
export const SECURITY_ALERT = {
  reason: 'transfer_farming',
  result_type: 'Malicious',
  features: ['Interaction with a known malicious address'],
  providerRequestsCount: { eth_getCode: 1 },
};
export const SDK_CONNECTION = {
  id: 'channel-1',
  otherPublicKey:
    '02bf6b8a1f2c8c1c0e8c6b0d2a3f4e5d6c7b8a9f0e1d2c3b4a5968778695a4b3c2',
  origin: 'qrcode',
  protocolVersion: 2,
  connected: true,
  validUntil: FIXED_NOW + 86400000,
  originatorInfo: {
    url: 'https://app.uniswap.org',
    title: 'Uniswap',
    platform: 'web-desktop',
    dappId: 'app.uniswap.org',
  },
};
export const WC2_METADATA = {
  id: 'wc2-session-1',
  url: 'https://opensea.io',
  name: 'OpenSea',
  icon: 'https://opensea.io/favicon.ico',
};
export const TX_ETH = {
  id: 'tx-eth-1',
  from: ACCOUNT_1,
  to: ACCOUNT_2,
  value: '0x2386f26fc10000',
  gas: '0x5208',
  maxFeePerGas: '0x59682f00',
  maxPriorityFeePerGas: '0x3b9aca00',
  chainId: '0x1',
};

const T = 'actions/transaction';
const S = 'actions/security';
const U = 'actions/user';
const B = 'actions/browser';
const N = 'actions/notification';
const SDK = 'actions/sdk';

const transactionSteps = (): ScenarioStep[] => [
  step(
    'reset transaction',
    `${T}.resetTransaction`,
    transaction.resetTransaction,
  ),
  step(
    'new ETH asset transaction',
    `${T}.newAssetTransaction`,
    transaction.newAssetTransaction,
    ETH_ASSET,
  ),
  step(
    'new ERC20 asset transaction',
    `${T}.newAssetTransaction`,
    transaction.newAssetTransaction,
    DAI,
  ),
  step(
    'new ERC721 asset transaction',
    `${T}.newAssetTransaction`,
    transaction.newAssetTransaction,
    NFT,
  ),
  step(
    'set recipient',
    `${T}.setRecipient`,
    transaction.setRecipient,
    ACCOUNT_1,
    ACCOUNT_2,
    'vitalik.eth',
    'Vitalik',
    'Account 1',
  ),
  step(
    'set selected asset (ETH)',
    `${T}.setSelectedAsset`,
    transaction.setSelectedAsset,
    ETH_ASSET,
  ),
  step(
    'set selected asset (ERC20)',
    `${T}.setSelectedAsset`,
    transaction.setSelectedAsset,
    DAI,
  ),
  raw('set selected asset without assetType (ERC721)', {
    type: 'SET_SELECTED_ASSET',
    selectedAsset: NFT,
  }),
  raw('set selected asset without assetType (ETH)', {
    type: 'SET_SELECTED_ASSET',
    selectedAsset: ETH_ASSET,
  }),
  raw('set selected asset without assetType (ERC20)', {
    type: 'SET_SELECTED_ASSET',
    selectedAsset: DAI,
  }),
  raw('set selected asset undefined', {
    type: 'SET_SELECTED_ASSET',
    selectedAsset: undefined,
  }),
  step(
    'prepare transaction',
    `${T}.prepareTransaction`,
    transaction.prepareTransaction,
    { from: ACCOUNT_1, to: ACCOUNT_2, value: '0x0', data: '0x' },
  ),
  step(
    'set security alert response',
    `${T}.setTransactionSecurityAlertResponse`,
    transaction.setTransactionSecurityAlertResponse,
    'tx-eth-1',
    SECURITY_ALERT,
  ),
  step(
    'set transaction object with selectedAsset',
    `${T}.setTransactionObject`,
    transaction.setTransactionObject,
    {
      ...TX_ETH,
      selectedAsset: DAI,
      data: '0xa9059cbb',
      securityAlertResponse: SECURITY_ALERT,
    },
  ),
  step(
    'set transaction object without selectedAsset',
    `${T}.setTransactionObject`,
    transaction.setTransactionObject,
    { gas: '0x7530', origin: 'metamask', symbol: 'ETH' },
  ),
  step(
    'set transaction id',
    `${T}.setTransactionId`,
    transaction.setTransactionId,
    'tx-eth-2',
  ),
  step(
    'set tokens transaction (ERC20)',
    `${T}.setTokensTransaction`,
    transaction.setTokensTransaction,
    DAI,
  ),
  step(
    'set tokens transaction (ERC721)',
    `${T}.setTokensTransaction`,
    transaction.setTokensTransaction,
    NFT,
  ),
  step(
    'set ether transaction',
    `${T}.setEtherTransaction`,
    transaction.setEtherTransaction,
    {
      ...TX_ETH,
      origin: 'https://app.uniswap.org',
      ensRecipient: 'vitalik.eth',
    },
  ),
  step('set nonce', `${T}.setNonce`, transaction.setNonce, 42),
  step(
    'set proposed nonce',
    `${T}.setProposedNonce`,
    transaction.setProposedNonce,
    43,
  ),
  step(
    'set max value mode',
    `${T}.setMaxValueMode`,
    transaction.setMaxValueMode,
    true,
  ),
  step(
    'set transaction value',
    `${T}.setTransactionValue`,
    transaction.setTransactionValue,
    '0x16345785d8a0000',
  ),
  unknownStep(),
  rehydrateStep({ transaction: { nonce: 7 } }),
];

const settingsSteps = (): ScenarioStep[] => [
  step(
    'set search engine',
    'actions/settings.setSearchEngine',
    settings.setSearchEngine,
    'DuckDuckGo',
  ),
  step(
    'set show hex data',
    'actions/settings.setShowHexData',
    settings.setShowHexData,
    true,
  ),
  step(
    'set show custom nonce',
    'actions/settings.setShowCustomNonce',
    settings.setShowCustomNonce,
    true,
  ),
  step(
    'set show fiat on testnets',
    'actions/settings.setShowFiatOnTestnets',
    settings.setShowFiatOnTestnets,
    true,
  ),
  step(
    'set hide zero balance tokens',
    'actions/settings.setHideZeroBalanceTokens',
    settings.setHideZeroBalanceTokens,
    true,
  ),
  step(
    'set lock time',
    'actions/settings.setLockTime',
    settings.setLockTime,
    30000,
  ),
  step(
    'set primary currency',
    'actions/settings.setPrimaryCurrency',
    settings.setPrimaryCurrency,
    'Fiat',
  ),
  step(
    'set use blockie icon',
    'actions/settings.setUseBlockieIcon',
    settings.setUseBlockieIcon,
    false,
  ),
  step(
    'toggle basic functionality off',
    'actions/settings.toggleBasicFunctionality',
    settings.toggleBasicFunctionality,
    false,
  ),
  step(
    'toggle device notifications',
    'actions/settings.toggleDeviceNotification',
    settings.toggleDeviceNotification,
    true,
  ),
  step(
    'set token sort config (unhandled)',
    'actions/settings.setTokenSortConfig',
    settings.setTokenSortConfig,
    { key: 'tokenFiatAmount', order: 'dsc' },
  ),
  unknownStep(),
  rehydrateStep({ settings: { lockTime: 0 } }),
];

const userSteps = (): ScenarioStep[] => [
  step(
    'interrupt biometrics',
    `${U}.interruptBiometrics`,
    user.interruptBiometrics,
  ),
  step('lock app', `${U}.lockApp`, user.lockApp),
  step('auth success', `${U}.authSuccess`, user.authSuccess, 'bio-1'),
  step('auth error', `${U}.authError`, user.authError, 'bio-2'),
  step('password set', `${U}.passwordSet`, user.passwordSet),
  step('password unset', `${U}.passwordUnset`, user.passwordUnset),
  step(
    'seedphrase not backed up',
    `${U}.seedphraseNotBackedUp`,
    user.seedphraseNotBackedUp,
  ),
  step(
    'protect wallet modal visible (not backed up)',
    `${U}.protectWalletModalVisible`,
    user.protectWalletModalVisible,
  ),
  step(
    'protect wallet modal not visible',
    `${U}.protectWalletModalNotVisible`,
    user.protectWalletModalNotVisible,
  ),
  step(
    'seedphrase backed up',
    `${U}.seedphraseBackedUp`,
    user.seedphraseBackedUp,
  ),
  step(
    'protect wallet modal visible (backed up: no-op)',
    `${U}.protectWalletModalVisible`,
    user.protectWalletModalVisible,
  ),
  step(
    'back up seedphrase alert visible',
    `${U}.backUpSeedphraseAlertVisible`,
    user.backUpSeedphraseAlertVisible,
  ),
  step(
    'back up seedphrase alert not visible',
    `${U}.backUpSeedphraseAlertNotVisible`,
    user.backUpSeedphraseAlertNotVisible,
  ),
  step(
    'loading set',
    `${U}.loadingSet`,
    user.loadingSet,
    'Creating your wallet',
  ),
  step('loading unset', `${U}.loadingUnset`, user.loadingUnset),
  step(
    'gas education carousel seen',
    `${U}.setGasEducationCarouselSeen`,
    user.setGasEducationCarouselSeen,
  ),
  step('log in', `${U}.logIn`, user.logIn),
  step('log out', `${U}.logOut`, user.logOut),
  step('set app theme', `${U}.setAppTheme`, user.setAppTheme, AppThemeKey.dark),
  step(
    'checked auth (unhandled)',
    `${U}.checkedAuth`,
    user.checkedAuth,
    'login',
  ),
  step(
    'persisted data loaded (unhandled)',
    `${U}.onPersistedDataLoaded`,
    user.onPersistedDataLoaded,
  ),
  step(
    'app services ready',
    `${U}.setAppServicesReady`,
    user.setAppServicesReady,
  ),
  unknownStep(),
  rehydrateStep({ user: { userLoggedIn: true } }),
];

const browserSteps = (): ScenarioStep[] => [
  step(
    'add to viewed dapp',
    `${B}.addToViewedDapp`,
    browser.addToViewedDapp,
    'app.uniswap.org',
  ),
  step('add to history', `${B}.addToHistory`, browser.addToHistory, {
    url: 'https://app.uniswap.org',
    name: 'Uniswap',
  }),
  step(
    'add to whitelist',
    `${B}.addToWhitelist`,
    browser.addToWhitelist,
    'https://phishing-reviewed.example',
  ),
  step(
    'create new tab',
    `${B}.createNewTab`,
    browser.createNewTab,
    'https://opensea.io',
    undefined,
  ),
  step(
    'create new tab with link type',
    `${B}.createNewTab`,
    browser.createNewTab,
    'https://portfolio.metamask.io',
    'deeplink',
  ),
  step('set active tab', `${B}.setActiveTab`, browser.setActiveTab, FIXED_NOW),
  step('update tab', `${B}.updateTab`, browser.updateTab, 1, {
    url: 'https://app.aave.com',
    isArchived: true,
  }),
  step('store favicon', `${B}.storeFavicon`, browser.storeFavicon, {
    origin: 'https://app.uniswap.org',
    url: 'https://app.uniswap.org/favicon.png',
  }),
  step('close tab', `${B}.closeTab`, browser.closeTab, 1),
  step('clear history', `${B}.clearHistory`, browser.clearHistory, true, false),
  step('close all tabs', `${B}.closeAllTabs`, browser.closeAllTabs),
  unknownStep(),
  rehydrateStep({ browser: { tabs: [] } }),
];

const notificationSteps = (): ScenarioStep[] => [
  step(
    'hide current notification',
    `${N}.hideCurrentNotification`,
    notification.hideCurrentNotification,
  ),
  step(
    'show simple notification',
    `${N}.showSimpleNotification`,
    notification.showSimpleNotification,
    {
      id: 'simple-2',
      title: 'Copied',
      description: 'Address copied to clipboard',
      status: 'simple_notification',
      autodismiss: undefined,
    },
  ),
  step(
    'show transaction notification',
    `${N}.showTransactionNotification`,
    notification.showTransactionNotification,
    { transaction: { id: 'tx-2' }, status: 'pending', autodismiss: 3000 },
  ),
  step(
    'modify or show transaction notification (no id: enqueue or match id-less)',
    `${N}.modifyOrShowTransactionNotificationById`,
    notification.modifyOrShowTransactionNotificationById,
    { transaction: { id: 'tx-2' }, status: 'success', autodismiss: 5000 },
  ),
  raw('modify or show transaction notification (existing id)', {
    type: 'MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION',
    id: 'tx-1',
    transaction: { id: 'tx-1' },
    status: 'success',
    autodismiss: 1500,
  }),
  step(
    'modify or show simple notification (no id)',
    `${N}.modifyOrShowSimpleNotificationById`,
    notification.modifyOrShowSimpleNotificationById,
    {
      title: 'Network added',
      description: 'Polygon',
      status: 'success',
      autodismiss: 2000,
    },
  ),
  raw('modify or show simple notification (existing id)', {
    type: 'MODIFY_OR_SHOW_SIMPLE_NOTIFICATION',
    id: 'simple-2',
    title: 'Updated',
    description: 'Updated description',
    status: 'success',
    autodismiss: 1000,
  }),
  step(
    'hide notification by id',
    `${N}.hideNotificationById`,
    notification.hideNotificationById,
    'simple-2',
  ),
  step(
    'hide notification by unknown id',
    `${N}.hideNotificationById`,
    notification.hideNotificationById,
    'missing',
  ),
  step(
    'replace notification by id',
    `${N}.replaceNotificationById`,
    notification.replaceNotificationById,
    {
      id: 'tx-2',
      isVisible: true,
      type: 'transaction',
      status: 'confirmed',
      transaction: { id: 'tx-2' },
    },
  ),
  step(
    'replace notification by unknown id',
    `${N}.replaceNotificationById`,
    notification.replaceNotificationById,
    { id: 'missing', isVisible: true },
  ),
  step(
    'remove not visible notifications',
    `${N}.removeNotVisibleNotifications`,
    notification.removeNotVisibleNotifications,
  ),
  step(
    'remove notification by id',
    `${N}.removeNotificationById`,
    notification.removeNotificationById,
    'tx-2',
  ),
  step(
    'remove current notification',
    `${N}.removeCurrentNotification`,
    notification.removeCurrentNotification,
  ),
  step(
    'hide current notification',
    `${N}.hideCurrentNotification`,
    notification.hideCurrentNotification,
  ),
  unknownStep(),
  rehydrateStep({ notification: { notifications: [] } }),
];

const sdkSteps = (): ScenarioStep[] => [
  step(
    'update WC2 metadata',
    `${SDK}.updateWC2Metadata`,
    sdk.updateWC2Metadata,
    WC2_METADATA,
  ),
  step(
    'add connection',
    `${SDK}.addConnection`,
    sdk.addConnection as (...a: unknown[]) => unknown,
    'channel-2',
    { ...SDK_CONNECTION, id: 'channel-2' },
  ),
  step(
    'update connection',
    `${SDK}.updateConnection`,
    sdk.updateConnection as (...a: unknown[]) => unknown,
    'channel-1',
    { ...SDK_CONNECTION, lastAuthorized: FIXED_NOW },
  ),
  step(
    'set connected (known channel)',
    `${SDK}.setConnected`,
    sdk.setConnected,
    'channel-1',
    false,
  ),
  step(
    'set connected (unknown channel)',
    `${SDK}.setConnected`,
    sdk.setConnected,
    'missing',
    true,
  ),
  step('disconnect all', `${SDK}.disconnectAll`, sdk.disconnectAll),
  step(
    'set approved host',
    `${SDK}.setApprovedHost`,
    sdk.setApprovedHost,
    'channel-2',
    FIXED_NOW + 3600000,
  ),
  step(
    'remove approved host',
    `${SDK}.removeApprovedHost`,
    sdk.removeApprovedHost,
    'channel-1',
  ),
  step(
    'reset approved hosts (unhandled)',
    `${SDK}.resetApprovedHosts`,
    sdk.resetApprovedHosts as (...a: unknown[]) => unknown,
    { 'channel-9': FIXED_NOW },
  ),
  step(
    'update dapp connection',
    `${SDK}.updateDappConnection`,
    sdk.updateDappConnection as (...a: unknown[]) => unknown,
    'dapp-2',
    { ...SDK_CONNECTION, id: 'dapp-2', origin: 'deeplink' },
  ),
  step(
    'remove dapp connection',
    `${SDK}.removeDappConnection`,
    sdk.removeDappConnection,
    'dapp-1',
  ),
  step(
    'reset dapp connections',
    `${SDK}.resetDappConnections`,
    sdk.resetDappConnections as (...a: unknown[]) => unknown,
    { 'dapp-3': { ...SDK_CONNECTION, id: 'dapp-3' } },
  ),
  step(
    'remove connection',
    `${SDK}.removeConnection`,
    sdk.removeConnection,
    'channel-2',
  ),
  step(
    'reset connections',
    `${SDK}.resetConnections`,
    sdk.resetConnections as (...a: unknown[]) => unknown,
    { 'channel-4': { ...SDK_CONNECTION, id: 'channel-4' } },
  ),
  unknownStep(),
  rehydrateStep({ sdk: { connections: {} } }),
];

const segment = (label: string, seed: unknown, steps: ScenarioStep[]) => ({
  label,
  seed,
  steps,
});
const initSegment = () => segment('initial state', undefined, [initStep()]);

/**
 * Per-reducer scenarios: every handled action type (and representative
 * unhandled ones) of every in-scope legacy reducer, from an initial and a
 * realistic seed state.
 */
export function buildReducerScenarios(): ReducerScenario[] {
  return [
    {
      reducerKey: 'transaction',
      source: 'app/reducers/transaction',
      segments: [
        initSegment(),
        segment(
          'send in progress',
          {
            ensRecipient: undefined,
            assetType: 'ETH',
            selectedAsset: ETH_ASSET,
            transaction: {
              data: undefined,
              from: ACCOUNT_1,
              gas: '0x5208',
              gasPrice: undefined,
              to: ACCOUNT_2,
              value: '0x0',
              maxFeePerGas: undefined,
              maxPriorityFeePerGas: undefined,
            },
            warningGasPriceHigh: undefined,
            transactionTo: ACCOUNT_2,
            transactionToName: undefined,
            transactionFromName: 'Account 1',
            transactionValue: undefined,
            symbol: 'ETH',
            paymentRequest: undefined,
            readableValue: undefined,
            id: 'tx-eth-0',
            type: undefined,
            proposedNonce: 5,
            nonce: 5,
            securityAlertResponses: { 'tx-eth-0': SECURITY_ALERT },
            useMax: false,
          },
          transactionSteps(),
        ),
      ],
    },
    {
      reducerKey: 'security',
      source: 'app/reducers/security',
      segments: [
        initSegment(),
        segment(
          'returning user',
          {
            allowLoginWithRememberMe: false,
            automaticSecurityChecksEnabled: false,
            hasUserSelectedAutomaticSecurityCheckOption: false,
            isAutomaticSecurityChecksModalOpen: false,
            dataCollectionForMarketing: null,
            isNFTAutoDetectionModalViewed: false,
          },
          [
            step(
              'allow login with remember me',
              `${S}.setAllowLoginWithRememberMe`,
              security.setAllowLoginWithRememberMe,
              true,
            ),
            step(
              'automatic security checks on',
              `${S}.setAutomaticSecurityChecks`,
              security.setAutomaticSecurityChecks,
              true,
            ),
            step(
              'user selected automatic security checks option',
              `${S}.userSelectedAutomaticSecurityChecksOptions`,
              security.userSelectedAutomaticSecurityChecksOptions,
            ),
            step(
              'automatic security checks modal open',
              `${S}.setAutomaticSecurityChecksModalOpen`,
              security.setAutomaticSecurityChecksModalOpen,
              true,
            ),
            step(
              'NFT auto detection modal open',
              `${S}.setNftAutoDetectionModalOpen`,
              security.setNftAutoDetectionModalOpen,
              true,
            ),
            step(
              'multi RPC migration modal open (unhandled)',
              `${S}.setMultiRpcMigrationModalOpen`,
              security.setMultiRpcMigrationModalOpen,
              true,
            ),
            step(
              'data collection for marketing',
              `${S}.setDataCollectionForMarketing`,
              security.setDataCollectionForMarketing,
              false,
            ),
            unknownStep(),
            rehydrateStep({ security: { allowLoginWithRememberMe: true } }),
          ],
        ),
      ],
    },
    {
      reducerKey: 'accounts',
      source: 'app/reducers/accounts',
      segments: [
        initSegment(),
        segment('idle', { reloadAccounts: false }, [
          step(
            'set reload accounts true',
            'actions/accounts.setReloadAccounts',
            accounts.setReloadAccounts,
            true,
          ),
          step(
            'set reload accounts false',
            'actions/accounts.setReloadAccounts',
            accounts.setReloadAccounts,
            false,
          ),
          unknownStep(),
          rehydrateStep(),
        ]),
      ],
    },
    {
      reducerKey: 'settings',
      source: 'app/reducers/settings',
      segments: [
        initSegment(),
        segment(
          'configured user',
          {
            searchEngine: 'Google',
            primaryCurrency: 'ETH',
            lockTime: -1,
            useBlockieIcon: true,
            hideZeroBalanceTokens: false,
            basicFunctionalityEnabled: true,
            showHexData: false,
          },
          settingsSteps(),
        ),
      ],
    },
    {
      reducerKey: 'user',
      source: 'app/reducers/user',
      segments: [
        initSegment(),
        segment(
          'onboarded, locked',
          {
            loadingMsg: '',
            loadingSet: false,
            passwordSet: true,
            seedphraseBackedUp: false,
            backUpSeedphraseVisible: false,
            protectWalletModalVisible: false,
            gasEducationCarouselSeen: false,
            userLoggedIn: false,
            isAuthChecked: false,
            initialScreen: '',
            appTheme: 'os',
            ambiguousAddressEntries: {},
            appServicesReady: false,
          },
          userSteps(),
        ),
      ],
    },
    {
      reducerKey: 'onboarding',
      source: 'app/reducers/onboarding',
      segments: [
        initSegment(),
        segment(
          'mid onboarding',
          {
            events: [[{ category: 'Onboarding Started' }]],
            completedOnboarding: false,
          },
          [
            step(
              'save onboarding event',
              'actions/onboarding.saveOnboardingEvent',
              onboarding.saveOnboardingEvent,
              [
                {
                  category: 'Wallet Created',
                  properties: { biometrics_enabled: false },
                },
              ] as unknown as Parameters<
                typeof onboarding.saveOnboardingEvent
              >[0],
            ),
            step(
              'set completed onboarding',
              'actions/onboarding.setCompletedOnboarding',
              onboarding.setCompletedOnboarding,
              true,
            ),
            step(
              'clear onboarding events',
              'actions/onboarding.clearOnboardingEvents',
              onboarding.clearOnboardingEvents,
            ),
            unknownStep(),
            rehydrateStep(),
          ],
        ),
      ],
    },
    {
      reducerKey: 'browser',
      source: 'app/reducers/browser',
      segments: [
        initSegment(),
        segment(
          'two open tabs',
          {
            history: [{ url: 'https://metamask.io', name: 'MetaMask' }],
            whitelist: [],
            tabs: [
              { url: 'https://metamask.io', id: 1 },
              { url: 'https://app.uniswap.org', id: 2 },
            ],
            favicons: [],
            activeTab: 1,
            visitedDappsByHostname: { 'metamask.io': true },
          },
          browserSteps(),
        ),
      ],
    },
    {
      reducerKey: 'bookmarks',
      source: 'app/reducers/bookmarks',
      segments: [
        initSegment(),
        segment(
          'one bookmark',
          [{ name: 'Uniswap', url: 'https://app.uniswap.org' }],
          [
            step(
              'add bookmark',
              'actions/bookmarks.addBookmark',
              bookmarks.addBookmark,
              { name: 'OpenSea', url: 'https://opensea.io' },
            ),
            step(
              'remove bookmark',
              'actions/bookmarks.removeBookmark',
              bookmarks.removeBookmark,
              { name: 'Uniswap', url: 'https://app.uniswap.org' },
            ),
            step(
              'remove missing bookmark',
              'actions/bookmarks.removeBookmark',
              bookmarks.removeBookmark,
              { url: 'https://missing.example' },
            ),
            unknownStep(),
            rehydrateStep(),
          ],
        ),
      ],
    },
    {
      reducerKey: 'notification',
      source: 'app/reducers/notification',
      segments: [
        initSegment(),
        segment('empty queue', { notifications: [] }, [
          step(
            'hide current notification (empty)',
            `${N}.hideCurrentNotification`,
            notification.hideCurrentNotification,
          ),
          step(
            'remove current notification (empty)',
            `${N}.removeCurrentNotification`,
            notification.removeCurrentNotification,
          ),
        ]),
        segment(
          'queued notifications',
          {
            notifications: [
              {
                id: 'tx-1',
                isVisible: true,
                autodismiss: 5000,
                transaction: { id: 'tx-1' },
                status: 'pending',
                type: 'transaction',
              },
              {
                id: 'simple-1',
                isVisible: false,
                autodismiss: 5000,
                title: 'Hello',
                description: 'World',
                status: 'simple_notification',
                type: 'simple',
              },
            ],
          },
          notificationSteps(),
        ),
      ],
    },
    {
      reducerKey: 'collectibles',
      source: 'app/reducers/collectibles',
      segments: [
        initSegment(),
        segment(
          'one favourite',
          {
            favorites: {
              [ACCOUNT_1]: { '0x1': [{ tokenId: '1', address: NFT.address }] },
            },
            isNftFetchingProgress: false,
          },
          [
            step(
              'add favourite (existing chain)',
              'actions/collectibles.addFavoriteCollectible',
              collectibles.addFavoriteCollectible,
              ACCOUNT_1,
              '0x1',
              NFT,
            ),
            step(
              'add favourite (new address)',
              'actions/collectibles.addFavoriteCollectible',
              collectibles.addFavoriteCollectible,
              ACCOUNT_2,
              '0x89',
              { ...NFT, tokenId: '7' },
            ),
            step(
              'remove favourite',
              'actions/collectibles.removeFavoriteCollectible',
              collectibles.removeFavoriteCollectible,
              ACCOUNT_1,
              '0x1',
              { tokenId: '1', address: NFT.address },
            ),
            step(
              'remove missing favourite (splice -1 quirk)',
              'actions/collectibles.removeFavoriteCollectible',
              collectibles.removeFavoriteCollectible,
              ACCOUNT_1,
              '0x1',
              { tokenId: '999', address: NFT.address },
            ),
            step(
              'show NFT fetching loader',
              'reducers/collectibles.showNftFetchingLoadingIndicator',
              showNftFetchingLoadingIndicator,
            ),
            step(
              'hide NFT fetching loader',
              'reducers/collectibles.hideNftFetchingLoadingIndicator',
              hideNftFetchingLoadingIndicator,
            ),
            unknownStep(),
            rehydrateStep(),
          ],
        ),
      ],
    },
    {
      reducerKey: 'modals',
      source: 'app/reducers/modals',
      segments: [
        initSegment(),
        segment(
          'defaults',
          {
            networkModalVisible: false,
            shouldNetworkSwitchPopToWallet: true,
            collectibleContractModalVisible: false,
            dappTransactionModalVisible: false,
            signMessageModalVisible: true,
          },
          [
            step(
              'toggle network modal (default arg)',
              'actions/modals.toggleNetworkModal',
              modals.toggleNetworkModal,
            ),
            step(
              'toggle network modal (no pop)',
              'actions/modals.toggleNetworkModal',
              modals.toggleNetworkModal,
              false,
            ),
            step(
              'toggle collectible contract modal',
              'actions/modals.toggleCollectibleContractModal',
              modals.toggleCollectibleContractModal,
            ),
            step(
              'toggle dapp tx modal (true)',
              'actions/modals.toggleDappTransactionModal',
              modals.toggleDappTransactionModal,
              true,
            ),
            step(
              'toggle dapp tx modal (null)',
              'actions/modals.toggleDappTransactionModal',
              modals.toggleDappTransactionModal,
              null,
            ),
            step(
              'toggle dapp tx modal (undefined)',
              'actions/modals.toggleDappTransactionModal',
              modals.toggleDappTransactionModal,
              undefined,
            ),
            step(
              'toggle dapp tx modal (false)',
              'actions/modals.toggleDappTransactionModal',
              modals.toggleDappTransactionModal,
              false,
            ),
            step(
              'toggle info network modal (undefined)',
              'actions/modals.toggleInfoNetworkModal',
              modals.toggleInfoNetworkModal,
              undefined,
            ),
            step(
              'toggle info network modal (true)',
              'actions/modals.toggleInfoNetworkModal',
              modals.toggleInfoNetworkModal,
              true,
            ),
            step(
              'toggle info network modal (false)',
              'actions/modals.toggleInfoNetworkModal',
              modals.toggleInfoNetworkModal,
              false,
            ),
            step(
              'toggle sign modal (undefined)',
              'actions/modals.toggleSignModal',
              modals.toggleSignModal,
              undefined,
            ),
            step(
              'toggle sign modal (true)',
              'actions/modals.toggleSignModal',
              modals.toggleSignModal,
              true,
            ),
            step(
              'toggle sign modal (false)',
              'actions/modals.toggleSignModal',
              modals.toggleSignModal,
              false,
            ),
            unknownStep(),
            rehydrateStep(),
          ],
        ),
      ],
    },
    {
      reducerKey: 'alert',
      source: 'app/reducers/alert',
      segments: [
        initSegment(),
        segment(
          'hidden',
          { isVisible: false, autodismiss: null, content: null, data: null },
          [
            step(
              'show alert',
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
            unknownStep(),
            rehydrateStep(),
          ],
        ),
      ],
    },
    {
      reducerKey: 'wizard',
      source: 'app/reducers/wizard',
      segments: [
        initSegment(),
        segment('step 2', { step: 2 }, [
          step(
            'set onboarding wizard step',
            'actions/wizard.default',
            setOnboardingWizardStep,
            3,
          ),
          unknownStep(),
          rehydrateStep({ wizard: { step: 5 } }),
        ]),
      ],
    },
    {
      reducerKey: 'privacy',
      source: 'app/reducers/privacy',
      segments: [
        initSegment(),
        segment(
          'approved hosts',
          {
            approvedHosts: { 'app.uniswap.org': true },
            revealSRPTimestamps: [FIXED_NOW - 1000],
          },
          [
            step(
              'approve host',
              'actions/privacy.approveHost',
              privacy.approveHost,
              'opensea.io',
            ),
            step(
              'reject host',
              'actions/privacy.rejectHost',
              privacy.rejectHost,
              'app.uniswap.org',
            ),
            step(
              'reject unknown host',
              'actions/privacy.rejectHost',
              privacy.rejectHost,
              'missing.example',
            ),
            step(
              'record SRP reveal timestamp',
              'actions/privacy.recordSRPRevealTimestamp',
              privacy.recordSRPRevealTimestamp,
              FIXED_NOW,
            ),
            raw('clear hosts', { type: 'CLEAR_HOSTS' }),
            unknownStep(),
            rehydrateStep(),
          ],
        ),
      ],
    },
    {
      reducerKey: 'infuraAvailability',
      source: 'app/reducers/infuraAvailability',
      segments: [
        initSegment(),
        segment('available', { isBlocked: false }, [
          step(
            'infura blocked',
            'actions/infuraAvailability.setInfuraAvailabilityBlocked',
            infura.setInfuraAvailabilityBlocked,
          ),
          step(
            'infura not blocked',
            'actions/infuraAvailability.setInfuraAvailabilityNotBlocked',
            infura.setInfuraAvailabilityNotBlocked,
          ),
          unknownStep(),
          rehydrateStep(),
        ]),
      ],
    },
    {
      reducerKey: 'legalNotices',
      source: 'app/reducers/legalNotices',
      segments: [
        initSegment(),
        segment(
          'toast never shown',
          {
            newPrivacyPolicyToastClickedOrClosed: false,
            newPrivacyPolicyToastShownDate: null,
          },
          [
            step(
              'store privacy policy shown date',
              'reducers/legalNotices.storePrivacyPolicyShownDate',
              storePrivacyPolicyShownDate,
              FIXED_NOW,
            ),
            step(
              'store privacy policy shown date again (no-op)',
              'reducers/legalNotices.storePrivacyPolicyShownDate',
              storePrivacyPolicyShownDate,
              FIXED_NOW + 1,
            ),
            step(
              'privacy policy clicked or closed',
              'reducers/legalNotices.storePrivacyPolicyClickedOrClosed',
              storePrivacyPolicyClickedOrClosed,
            ),
            unknownStep(),
            rehydrateStep(),
          ],
        ),
      ],
    },
    {
      reducerKey: 'signatureRequest',
      source: 'app/reducers/signatureRequest',
      segments: [
        initSegment(),
        segment('no alert', { securityAlertResponse: undefined }, [
          step(
            'set signature security alert response',
            'actions/signatureRequest.default',
            setSignatureRequestSecurityAlertResponse,
            SECURITY_ALERT as unknown as Parameters<
              typeof setSignatureRequestSecurityAlertResponse
            >[0],
          ),
          step(
            'clear signature security alert response',
            'actions/signatureRequest.default',
            setSignatureRequestSecurityAlertResponse,
            undefined,
          ),
          unknownStep(),
          rehydrateStep(),
        ]),
      ],
    },
    {
      reducerKey: 'rpcEvents',
      source: 'app/reducers/rpcEvents',
      segments: [
        initSegment(),
        segment('idle', { signingEvent: { eventStage: 'idle', rpcName: '' } }, [
          step(
            'set event stage (personal_sign request)',
            'actions/rpcEvents.setEventStage',
            rpcEvents.setEventStage,
            'personal_sign',
            'request_send',
          ),
          step(
            'set event stage (eth_signTypedData_v4 complete)',
            'actions/rpcEvents.setEventStage',
            rpcEvents.setEventStage,
            'eth_signTypedData_v4',
            'complete',
          ),
          step(
            'set event stage (non-whitelisted rpc)',
            'actions/rpcEvents.setEventStage',
            rpcEvents.setEventStage,
            'eth_sendTransaction',
            'request_send',
          ),
          step(
            'set event error',
            'actions/rpcEvents.setEventStageError',
            rpcEvents.setEventStageError,
            'eth_signTypedData_v3',
            new Error('User rejected the request.'),
          ),
          step(
            'reset event stage',
            'actions/rpcEvents.resetEventStage',
            rpcEvents.resetEventStage,
            'eth_signTypedData',
          ),
          raw('whitelisted rpc with unknown type', {
            type: 'SOMETHING_ELSE',
            rpcName: 'personal_sign',
          }),
          unknownStep(),
          rehydrateStep(),
        ]),
      ],
    },
    {
      reducerKey: 'sdk',
      source: 'app/reducers/sdk',
      segments: [
        initSegment(),
        segment(
          'one SDK connection',
          {
            connections: { 'channel-1': SDK_CONNECTION },
            approvedHosts: { 'channel-1': FIXED_NOW + 1000 },
            dappConnections: { 'dapp-1': { ...SDK_CONNECTION, id: 'dapp-1' } },
            wc2Metadata: undefined,
          },
          sdkSteps(),
        ),
      ],
    },
    {
      reducerKey: 'networkOnboarded',
      source: 'app/reducers/networkSelector',
      segments: [
        initSegment(),
        segment(
          'mainnet onboarded',
          {
            networkOnboardedState: { '0x1': true },
            networkState: {
              showNetworkOnboarding: false,
              nativeToken: '',
              networkType: '',
              networkUrl: '',
            },
            switchedNetwork: { networkUrl: '', networkStatus: false },
          },
          [
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
            unknownStep(),
            rehydrateStep(),
          ],
        ),
      ],
    },
    {
      reducerKey: 'experimentalSettings',
      source: 'app/reducers/experimentalSettings',
      segments: [
        initSegment(),
        segment('alerts on', { securityAlertsEnabled: true }, [
          raw('set security alerts enabled false', {
            type: 'SET_SECURITY_ALERTS_ENABLED',
            securityAlertsEnabled: false,
          }),
          raw('set PPOM initialization status (unhandled)', {
            type: 'SET_PPOM_INITIALIZATION_STATUS',
            ppomInitializationStatus: 'SUCCESS',
          }),
          unknownStep(),
          rehydrateStep(),
        ]),
      ],
    },
    {
      reducerKey: 'navigation',
      source: 'app/reducers/navigation',
      segments: [
        initSegment(),
        segment(
          'wallet tab',
          { currentRoute: 'WalletView', currentBottomNavRoute: 'Wallet' },
          [
            step(
              'set current route',
              'actions/navigation.setCurrentRoute',
              navigation.setCurrentRoute,
              'BrowserView',
            ),
            step(
              'set current bottom nav route',
              'actions/navigation.setCurrentBottomNavRoute',
              navigation.setCurrentBottomNavRoute,
              'Browser',
            ),
            step(
              'navigation ready (unhandled)',
              'actions/navigation.onNavigationReady',
              navigation.onNavigationReady,
            ),
            unknownStep(),
            rehydrateStep(),
          ],
        ),
      ],
    },
  ];
}

export {
  transactionSteps,
  settingsSteps,
  userSteps,
  browserSteps,
  notificationSteps,
  sdkSteps,
};
