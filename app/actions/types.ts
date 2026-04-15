/**
 * Shared TypeScript type definitions for all Redux action creators.
 *
 * This file defines:
 *  - String-literal action-type constants
 *  - Typed action interfaces (discriminated union per domain)
 *  - Typed action-creator function signatures
 *
 * Every JS action file under `app/actions/` should eventually import its
 * constants from here so that reducers and middleware can narrow on the
 * same literal types.
 */

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------
export const SHOW_ALERT = 'SHOW_ALERT' as const;
export const HIDE_ALERT = 'HIDE_ALERT' as const;

export interface ShowAlertAction {
  type: typeof SHOW_ALERT;
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}

export interface HideAlertAction {
  type: typeof HIDE_ALERT;
}

export type AlertAction = ShowAlertAction | HideAlertAction;

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------
export const ADD_BOOKMARK = 'ADD_BOOKMARK' as const;
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK' as const;

export interface Bookmark {
  url: string;
  name: string;
}

export interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction {
  type: typeof REMOVE_BOOKMARK;
  bookmark: Bookmark;
}

export type BookmarkAction = AddBookmarkAction | RemoveBookmarkAction;

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------
export const ADD_TO_VIEWED_DAPP = 'ADD_TO_VIEWED_DAPP' as const;
export const ADD_TO_BROWSER_HISTORY = 'ADD_TO_BROWSER_HISTORY' as const;
export const CLEAR_BROWSER_HISTORY = 'CLEAR_BROWSER_HISTORY' as const;
export const ADD_TO_BROWSER_WHITELIST = 'ADD_TO_BROWSER_WHITELIST' as const;
export const CLOSE_ALL_TABS = 'CLOSE_ALL_TABS' as const;
export const CREATE_NEW_TAB = 'CREATE_NEW_TAB' as const;
export const CLOSE_TAB = 'CLOSE_TAB' as const;
export const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB' as const;
export const UPDATE_TAB = 'UPDATE_TAB' as const;
export const STORE_FAVICON_URL = 'STORE_FAVICON_URL' as const;

export interface AddToViewedDappAction {
  type: typeof ADD_TO_VIEWED_DAPP;
  hostname: string;
}

export interface AddToBrowserHistoryAction {
  type: typeof ADD_TO_BROWSER_HISTORY;
  url: string;
  name: string;
}

export interface ClearBrowserHistoryAction {
  type: typeof CLEAR_BROWSER_HISTORY;
  id: number;
  metricsEnabled: boolean;
  marketingEnabled: boolean;
}

export interface AddToBrowserWhitelistAction {
  type: typeof ADD_TO_BROWSER_WHITELIST;
  url: string;
}

export interface CloseAllTabsAction {
  type: typeof CLOSE_ALL_TABS;
}

export interface CreateNewTabAction {
  type: typeof CREATE_NEW_TAB;
  url: string;
  linkType?: string;
  id: number;
}

export interface CloseTabAction {
  type: typeof CLOSE_TAB;
  id: number;
}

export interface SetActiveTabAction {
  type: typeof SET_ACTIVE_TAB;
  id: number;
}

export interface UpdateTabAction {
  type: typeof UPDATE_TAB;
  id: number;
  data: {
    isArchived?: boolean;
    url?: string;
    image?: string;
  };
}

export interface StoreFaviconUrlAction {
  type: typeof STORE_FAVICON_URL;
  origin: string;
  url: string;
}

export type BrowserAction =
  | AddToViewedDappAction
  | AddToBrowserHistoryAction
  | ClearBrowserHistoryAction
  | AddToBrowserWhitelistAction
  | CloseAllTabsAction
  | CreateNewTabAction
  | CloseTabAction
  | SetActiveTabAction
  | UpdateTabAction
  | StoreFaviconUrlAction;

// ---------------------------------------------------------------------------
// Collectibles (NFT Favorites)
// ---------------------------------------------------------------------------
export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE' as const;
export const REMOVE_FAVORITE_COLLECTIBLE =
  'REMOVE_FAVORITE_COLLECTIBLE' as const;
export const SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER' as const;
export const HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER' as const;

export interface CollectibleIdentifier {
  tokenId: string;
  address: string;
}

export interface AddFavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: CollectibleIdentifier;
}

export interface RemoveFavoriteCollectibleAction {
  type: typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: CollectibleIdentifier;
}

export interface ShowNftFetchingLoaderAction {
  type: typeof SHOW_NFT_FETCHING_LOADER;
}

export interface HideNftFetchingLoaderAction {
  type: typeof HIDE_NFT_FETCHING_LOADER;
}

export type CollectibleAction =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction
  | ShowNftFetchingLoaderAction
  | HideNftFetchingLoaderAction;

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------
export const TOGGLE_NETWORK_MODAL = 'TOGGLE_NETWORK_MODAL' as const;
export const TOGGLE_COLLECTIBLE_CONTRACT_MODAL =
  'TOGGLE_COLLECTIBLE_CONTRACT_MODAL' as const;
export const TOGGLE_DAPP_TRANSACTION_MODAL =
  'TOGGLE_DAPP_TRANSACTION_MODAL' as const;
export const TOGGLE_INFO_NETWORK_MODAL =
  'TOGGLE_INFO_NETWORK_MODAL' as const;
export const TOGGLE_SIGN_MODAL = 'TOGGLE_SIGN_MODAL' as const;

export interface ToggleNetworkModalAction {
  type: typeof TOGGLE_NETWORK_MODAL;
  shouldNetworkSwitchPopToWallet: boolean;
}

export interface ToggleCollectibleContractModalAction {
  type: typeof TOGGLE_COLLECTIBLE_CONTRACT_MODAL;
}

export interface ToggleDappTransactionModalAction {
  type: typeof TOGGLE_DAPP_TRANSACTION_MODAL;
  show: boolean | null;
}

export interface ToggleInfoNetworkModalAction {
  type: typeof TOGGLE_INFO_NETWORK_MODAL;
  show: boolean | null;
}

export interface ToggleSignModalAction {
  type: typeof TOGGLE_SIGN_MODAL;
  show: boolean | null;
}

export type ModalAction =
  | ToggleNetworkModalAction
  | ToggleCollectibleContractModalAction
  | ToggleDappTransactionModalAction
  | ToggleInfoNetworkModalAction
  | ToggleSignModalAction;

// ---------------------------------------------------------------------------
// Notification (in-app v1 notification system)
// ---------------------------------------------------------------------------
export const HIDE_CURRENT_NOTIFICATION =
  'HIDE_CURRENT_NOTIFICATION' as const;
export const HIDE_NOTIFICATION_BY_ID = 'HIDE_NOTIFICATION_BY_ID' as const;
export const MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION =
  'MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION' as const;
export const MODIFY_OR_SHOW_SIMPLE_NOTIFICATION =
  'MODIFY_OR_SHOW_SIMPLE_NOTIFICATION' as const;
export const REPLACE_NOTIFICATION_BY_ID =
  'REPLACE_NOTIFICATION_BY_ID' as const;
export const REMOVE_NOTIFICATION_BY_ID =
  'REMOVE_NOTIFICATION_BY_ID' as const;
export const REMOVE_CURRENT_NOTIFICATION =
  'REMOVE_CURRENT_NOTIFICATION' as const;
export const REMOVE_NOT_VISIBLE_NOTIFICATIONS =
  'REMOVE_NOT_VISIBLE_NOTIFICATIONS' as const;
export const SHOW_SIMPLE_NOTIFICATION = 'SHOW_SIMPLE_NOTIFICATION' as const;
export const SHOW_TRANSACTION_NOTIFICATION =
  'SHOW_TRANSACTION_NOTIFICATION' as const;
export const UPDATE_NOTIFICATION_STATUS =
  'UPDATE_NOTIFICATION_STATUS' as const;

export interface NotificationItem {
  id: string;
  isVisible: boolean;
  autodismiss?: number;
  title?: string;
  description?: string;
  status?: string;
  type?: string;
  transaction?: Record<string, unknown>;
}

export interface HideCurrentNotificationAction {
  type: typeof HIDE_CURRENT_NOTIFICATION;
}

export interface HideNotificationByIdAction {
  type: typeof HIDE_NOTIFICATION_BY_ID;
  id: string;
}

export interface ModifyOrShowTransactionNotificationAction {
  type: typeof MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION;
  autodismiss: number;
  transaction: Record<string, unknown>;
  status: string;
}

export interface ModifyOrShowSimpleNotificationAction {
  type: typeof MODIFY_OR_SHOW_SIMPLE_NOTIFICATION;
  autodismiss: number;
  title: string;
  description: string;
  status: string;
}

export interface ReplaceNotificationByIdAction {
  type: typeof REPLACE_NOTIFICATION_BY_ID;
  notification: NotificationItem;
  id: string;
}

export interface RemoveNotificationByIdAction {
  type: typeof REMOVE_NOTIFICATION_BY_ID;
  id: string;
}

export interface RemoveCurrentNotificationAction {
  type: typeof REMOVE_CURRENT_NOTIFICATION;
}

export interface ShowSimpleNotificationAction {
  type: typeof SHOW_SIMPLE_NOTIFICATION;
  id: string;
  autodismiss: number;
  title: string;
  description: string;
  status: string;
}

export interface ShowTransactionNotificationAction {
  type: typeof SHOW_TRANSACTION_NOTIFICATION;
  autodismiss: number;
  transaction: Record<string, unknown>;
  status: string;
}

export interface RemoveNotVisibleNotificationsAction {
  type: typeof REMOVE_NOT_VISIBLE_NOTIFICATIONS;
}

export type NotificationAction =
  | HideCurrentNotificationAction
  | HideNotificationByIdAction
  | ModifyOrShowTransactionNotificationAction
  | ModifyOrShowSimpleNotificationAction
  | ReplaceNotificationByIdAction
  | RemoveNotificationByIdAction
  | RemoveCurrentNotificationAction
  | ShowSimpleNotificationAction
  | ShowTransactionNotificationAction
  | RemoveNotVisibleNotificationsAction;

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------
export const APPROVE_HOST = 'APPROVE_HOST' as const;
export const REJECT_HOST = 'REJECT_HOST' as const;
export const CLEAR_HOSTS = 'CLEAR_HOSTS' as const;
export const RECORD_SRP_REVEAL_TIMESTAMP =
  'RECORD_SRP_REVEAL_TIMESTAMP' as const;

export interface ApproveHostAction {
  type: typeof APPROVE_HOST;
  hostname: string;
}

export interface RejectHostAction {
  type: typeof REJECT_HOST;
  hostname: string;
}

export interface ClearHostsAction {
  type: typeof CLEAR_HOSTS;
}

export interface RecordSRPRevealTimestampAction {
  type: typeof RECORD_SRP_REVEAL_TIMESTAMP;
  timestamp: number;
}

export type PrivacyAction =
  | ApproveHostAction
  | RejectHostAction
  | ClearHostsAction
  | RecordSRPRevealTimestampAction;

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export const SET_SEARCH_ENGINE = 'SET_SEARCH_ENGINE' as const;
export const SET_SHOW_HEX_DATA = 'SET_SHOW_HEX_DATA' as const;
export const SET_SHOW_CUSTOM_NONCE = 'SET_SHOW_CUSTOM_NONCE' as const;
export const SET_SHOW_FIAT_ON_TESTNETS =
  'SET_SHOW_FIAT_ON_TESTNETS' as const;
export const SET_HIDE_ZERO_BALANCE_TOKENS =
  'SET_HIDE_ZERO_BALANCE_TOKENS' as const;
export const SET_LOCK_TIME = 'SET_LOCK_TIME' as const;
export const SET_PRIMARY_CURRENCY = 'SET_PRIMARY_CURRENCY' as const;
export const SET_USE_BLOCKIE_ICON = 'SET_USE_BLOCKIE_ICON' as const;
export const TOGGLE_BASIC_FUNCTIONALITY =
  'TOGGLE_BASIC_FUNCTIONALITY' as const;
export const TOGGLE_DEVICE_NOTIFICATIONS =
  'TOGGLE_DEVICE_NOTIFICATIONS' as const;
export const SET_TOKEN_SORT_CONFIG = 'SET_TOKEN_SORT_CONFIG' as const;

export interface SetSearchEngineAction {
  type: typeof SET_SEARCH_ENGINE;
  searchEngine: string;
}

export interface SetShowHexDataAction {
  type: typeof SET_SHOW_HEX_DATA;
  showHexData: boolean;
}

export interface SetShowCustomNonceAction {
  type: typeof SET_SHOW_CUSTOM_NONCE;
  showCustomNonce: boolean;
}

export interface SetShowFiatOnTestnetsAction {
  type: typeof SET_SHOW_FIAT_ON_TESTNETS;
  showFiatOnTestnets: boolean;
}

export interface SetHideZeroBalanceTokensAction {
  type: typeof SET_HIDE_ZERO_BALANCE_TOKENS;
  hideZeroBalanceTokens: boolean;
}

export interface SetLockTimeAction {
  type: typeof SET_LOCK_TIME;
  lockTime: number;
}

export interface SetPrimaryCurrencyAction {
  type: typeof SET_PRIMARY_CURRENCY;
  primaryCurrency: string;
}

export interface SetUseBlockieIconAction {
  type: typeof SET_USE_BLOCKIE_ICON;
  useBlockieIcon: boolean;
}

export interface ToggleBasicFunctionalityAction {
  type: typeof TOGGLE_BASIC_FUNCTIONALITY;
  basicFunctionalityEnabled: boolean;
}

export interface ToggleDeviceNotificationAction {
  type: typeof TOGGLE_DEVICE_NOTIFICATIONS;
  deviceNotificationEnabled: boolean;
}

export interface SetTokenSortConfigAction {
  type: typeof SET_TOKEN_SORT_CONFIG;
  tokenSortConfig: Record<string, string>;
}

export type SettingsAction =
  | SetSearchEngineAction
  | SetShowHexDataAction
  | SetShowCustomNonceAction
  | SetShowFiatOnTestnetsAction
  | SetHideZeroBalanceTokensAction
  | SetLockTimeAction
  | SetPrimaryCurrencyAction
  | SetUseBlockieIconAction
  | ToggleBasicFunctionalityAction
  | ToggleDeviceNotificationAction
  | SetTokenSortConfigAction;

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------
export const RESET_TRANSACTION = 'RESET_TRANSACTION' as const;
export const NEW_ASSET_TRANSACTION = 'NEW_ASSET_TRANSACTION' as const;
export const SET_RECIPIENT = 'SET_RECIPIENT' as const;
export const SET_SELECTED_ASSET = 'SET_SELECTED_ASSET' as const;
export const PREPARE_TRANSACTION = 'PREPARE_TRANSACTION' as const;
export const SET_TRANSACTION_SECURITY_ALERT_RESPONSE =
  'SET_TRANSACTION_SECURITY_ALERT_RESPONSE' as const;
export const SET_TRANSACTION_OBJECT = 'SET_TRANSACTION_OBJECT' as const;
export const SET_TRANSACTION_ID = 'SET_TRANSACTION_ID' as const;
export const SET_TOKENS_TRANSACTION = 'SET_TOKENS_TRANSACTION' as const;
export const SET_ETHER_TRANSACTION = 'SET_ETHER_TRANSACTION' as const;
export const SET_NONCE = 'SET_NONCE' as const;
export const SET_PROPOSED_NONCE = 'SET_PROPOSED_NONCE' as const;
export const SET_MAX_VALUE_MODE = 'SET_MAX_VALUE_MODE' as const;
export const SET_TRANSACTION_VALUE = 'SET_TRANSACTION_VALUE' as const;

export interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  symbol?: string;
  address?: string;
  decimals?: number;
  image?: string;
  name?: string;
}

export interface TransactionData {
  data?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
  to?: string;
  value?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface SecurityAlertResponse {
  result_type: string;
  reason: string;
  description: string;
  features: string[];
}

export interface ResetTransactionAction {
  type: typeof RESET_TRANSACTION;
}

export interface NewAssetTransactionAction {
  type: typeof NEW_ASSET_TRANSACTION;
  selectedAsset: SelectedAsset;
  assetType: string;
}

export interface SetRecipientAction {
  type: typeof SET_RECIPIENT;
  from: string;
  to: string;
  ensRecipient?: string;
  transactionToName?: string;
  transactionFromName?: string;
}

export interface SetSelectedAssetAction {
  type: typeof SET_SELECTED_ASSET;
  selectedAsset: SelectedAsset;
  assetType: string;
}

export interface PrepareTransactionAction {
  type: typeof PREPARE_TRANSACTION;
  transaction: TransactionData;
}

export interface SetTransactionSecurityAlertResponseAction {
  type: typeof SET_TRANSACTION_SECURITY_ALERT_RESPONSE;
  transactionId: string;
  securityAlertResponse: SecurityAlertResponse;
}

export interface SetTransactionObjectAction {
  type: typeof SET_TRANSACTION_OBJECT;
  transaction: Record<string, unknown>;
}

export interface SetTransactionIdAction {
  type: typeof SET_TRANSACTION_ID;
  transactionId: string;
}

export interface SetTokensTransactionAction {
  type: typeof SET_TOKENS_TRANSACTION;
  asset: SelectedAsset;
}

export interface SetEtherTransactionAction {
  type: typeof SET_ETHER_TRANSACTION;
  transaction: Record<string, unknown>;
}

export interface SetNonceAction {
  type: typeof SET_NONCE;
  nonce: string;
}

export interface SetProposedNonceAction {
  type: typeof SET_PROPOSED_NONCE;
  proposedNonce: string;
}

export interface SetMaxValueModeAction {
  type: typeof SET_MAX_VALUE_MODE;
  maxValueMode: boolean;
}

export interface SetTransactionValueAction {
  type: typeof SET_TRANSACTION_VALUE;
  value: string;
}

export type TransactionAction =
  | ResetTransactionAction
  | NewAssetTransactionAction
  | SetRecipientAction
  | SetSelectedAssetAction
  | PrepareTransactionAction
  | SetTransactionSecurityAlertResponseAction
  | SetTransactionObjectAction
  | SetTransactionIdAction
  | SetTokensTransactionAction
  | SetEtherTransactionAction
  | SetNonceAction
  | SetProposedNonceAction
  | SetMaxValueModeAction
  | SetTransactionValueAction;

// ---------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------
export const SET_ONBOARDING_WIZARD_STEP =
  'SET_ONBOARDING_WIZARD_STEP' as const;

export interface SetOnboardingWizardStepAction {
  type: typeof SET_ONBOARDING_WIZARD_STEP;
  step: number;
}

export type WizardAction = SetOnboardingWizardStepAction;

// ---------------------------------------------------------------------------
// Infura Availability
// ---------------------------------------------------------------------------
export const INFURA_AVAILABILITY_BLOCKED =
  'INFURA_AVAILABILITY_BLOCKED' as const;
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED' as const;

export interface InfuraAvailabilityBlockedAction {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
}

export interface InfuraAvailabilityNotBlockedAction {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
}

export type InfuraAvailabilityAction =
  | InfuraAvailabilityBlockedAction
  | InfuraAvailabilityNotBlockedAction;

// ---------------------------------------------------------------------------
// Swaps
// ---------------------------------------------------------------------------
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS' as const;
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED' as const;

export interface SwapsSetLivenessAction {
  type: typeof SWAPS_SET_LIVENESS;
  payload: {
    chainId: string;
    featureFlags: Record<string, unknown> | null;
  };
}

export interface SwapsSetHasOnboardedAction {
  type: typeof SWAPS_SET_HAS_ONBOARDED;
  payload: boolean;
}

export type SwapsAction =
  | SwapsSetLivenessAction
  | SwapsSetHasOnboardedAction;

// ---------------------------------------------------------------------------
// Combined Action Type
// ---------------------------------------------------------------------------
export type Action =
  | AlertAction
  | BookmarkAction
  | BrowserAction
  | CollectibleAction
  | ModalAction
  | NotificationAction
  | PrivacyAction
  | SettingsAction
  | TransactionAction
  | WizardAction
  | InfuraAvailabilityAction
  | SwapsAction;
