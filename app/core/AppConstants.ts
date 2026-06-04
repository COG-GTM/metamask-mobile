import { CoreTypes } from '@walletconnect/types';
import Device from '../util/device';
import { DEFAULT_SERVER_URL } from '@metamask/sdk-communication-layer';

// ==================== ENVIRONMENT VARIABLES ====================
const DEVELOPMENT = 'development';

const getEnvVar = (key: string, defaultValue: string): string =>
  process.env[key] ?? defaultValue;

const PORTFOLIO_URL = getEnvVar(
  'MM_PORTFOLIO_URL',
  'https://portfolio.metamask.io',
);
const SECURITY_ALERTS_API_URL = getEnvVar(
  'SECURITY_ALERTS_API_URL',
  'https://security-alerts.api.cx.metamask.io',
);
const WALLET_CONNECT_PROJECT_ID = getEnvVar('WALLET_CONNECT_PROJECT_ID', '');
const SDK_COMMLAYER_URL = getEnvVar('SDK_COMMLAYER_URL', DEFAULT_SERVER_URL);
const DECODING_API_URL = getEnvVar(
  'DECODING_API_URL',
  'https://signature-insights.api.cx.metamask.io/v1',
);

// ==================== TIME CONSTANTS ====================
const THIRTY_SECONDS = 30 * 1000;
const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const TEN_SECONDS = 10 * 1000;
const ONE_DAY_IN_HOURS = 24;

// ==================== TYPE DEFINITIONS ====================
interface AppConstants {
  IS_DEV: boolean;
  DEFAULT_LOCK_TIMEOUT: number;
  DEFAULT_SEARCH_ENGINE: string;
  TX_CHECK_BACKGROUND_FREQUENCY: number;
  IPFS_OVERRIDE_PARAM: string;
  IPFS_DEFAULT_GATEWAY_URL: string;
  IPNS_DEFAULT_GATEWAY_URL: string;
  SWARM_DEFAULT_GATEWAY_URL: string;
  supportedTLDs: string[];
  MAX_PUSH_NOTIFICATION_PROMPT_TIMES: number;
  SECURITY_ALERTS_API: { URL: string };
  PORTFOLIO: { URL: string };
  BRIDGE: { ACTIVE: boolean; URL: string };
  STAKE: { URL: string };
  CONNEXT: {
    HUB_EXCHANGE_CEILING_TOKEN: number;
    MIN_DEPOSIT_ETH: number;
    MAX_DEPOSIT_TOKEN: number;
    BLOCKED_DEPOSIT_DURATION_MINUTES: number;
    CONTRACTS: Record<number, string>;
  };
  MM_UNIVERSAL_LINK_HOST: string;
  MM_DEEP_ITMS_APP_LINK: string;
  SAI_ADDRESS: string;
  HOMEPAGE_URL: string;
  OLD_HOMEPAGE_URL_HOST: string;
  SHORT_HOMEPAGE_URL: string;
  ZERO_ADDRESS: string;
  USER_AGENT: string;
  NOTIFICATION_NAMES: {
    accountsChanged: string;
    unlockStateChanged: string;
    chainChanged: string;
  };
  FIAT_ORDERS: { POLLING_FREQUENCY: number };
  DEEPLINKS: {
    ORIGIN_DEEPLINK: string;
    ORIGIN_QR_CODE: string;
    ORIGIN_NOTIFICATION: string;
  };
  WALLET_CONNECT: {
    SESSION_LIFETIME: number;
    LIMIT_SESSIONS: number;
    DEEPLINK_SESSIONS: string;
    PROJECT_ID: string;
    METADATA: CoreTypes.Metadata;
  };
  SWAPS: {
    ACTIVE: boolean;
    ONLY_MAINNET: boolean;
    CLIENT_ID: string;
    LIVENESS_POLLING_FREQUENCY: number;
    POLL_COUNT_LIMIT: number;
    DEFAULT_SLIPPAGE: number;
    DEFAULT_SLIPPAGE_STABLECOINS: number;
    CACHE_AGGREGATOR_METADATA_THRESHOLD: number;
    CACHE_TOKENS_THRESHOLD: number;
    CACHE_TOP_ASSETS_THRESHOLD: number;
  };
  MAX_SAFE_CHAIN_ID: number;
  URLS: {
    ICONS: {
      MASTERCARD_LIGHT: string;
      MASTERCARD_DARK: string;
      VISA_LIGHT: string;
      VISA_DARK: string;
      ACH_LIGHT: string;
      ACH_DARK: string;
    };
    [key: string]: string | Record<string, string>;
  };
  DECODING_API_URL: string;
  ERRORS: {
    INFURA_BLOCKED_MESSAGE: string;
  };
  GAS_OPTIONS: {
    LOW: string;
    MEDIUM: string;
    HIGH: string;
    MARKET: string;
    AGGRESSIVE: string;
  };
  GAS_TIMES: {
    UNKNOWN: string;
    MAYBE: string;
    LIKELY: string;
    VERY_LIKELY: string;
    AT_LEAST: string;
    LESS_THAN: string;
    RANGE: string;
  };
  REVIEW_PROMPT: {
    HIGH_GAS_FEES: string;
    MISSING_TOKENS: string;
    SWAP_ISSUES: string;
    SUPPORT: string;
  };
  BUNDLE_IDS: {
    IOS: string;
    ANDROID: string;
  };
  LEAST_SUPPORTED_ANDROID_API_LEVEL: number;
  ADD_CUSTOM_NETWORK_POPULAR_TAB_ID: string;
  ADD_CUSTOM_NETWORK_CUSTOM_TAB_ID: string;
  REQUEST_SOURCES: {
    SDK_REMOTE_CONN: string;
    WC: string;
    WC2: string;
    IN_APP_BROWSER: string;
  };
  MM_SDK: {
    SDK_CONNECTIONS: string;
    ANDROID_CONNECTIONS: string;
    ANDROID_SDK: string;
    IOS_SDK: string;
    SDK_APPROVEDHOSTS: string;
    SERVER_URL: string;
    PLATFORM: string;
    SDK_REMOTE_ORIGIN: string;
    UNKNOWN_PARAM: string;
  };
  CANCEL_RATE: string;
  SPEED_UP_RATE: string;
  NETWORK_STATE_CHANGE_EVENT: string;
  NETWORK_DID_CHANGE_EVENT: string;
  KEYRING_STATE_CHANGE_EVENT: string;
  TOKEN_LIST_STATE_CHANGE_EVENT: string;
  TERMS_OF_USE: {
    TERMS_DISPLAYED: string;
    TERMS_ACCEPTED: string;
    TERMS_OF_USE_URL_WITHOUT_COOKIES: string;
  };
  FAVICON_CACHE_MAX_SIZE: number;
  PPOM_INITIALISATION_STATE_CHANGE_EVENT: string;
  BASIC_FUNCTIONALITY_BLOCK_LIST: string[];
  FEATURE_FLAGS_API: {
    BASE_URL: string;
    VERSION: string;
    DEFAULT_FETCH_INTERVAL: number;
  };
}

// ==================== APP CONSTANTS ====================
export default {
  // Development
  IS_DEV: process.env?.NODE_ENV === DEVELOPMENT,

  // Core Settings
  DEFAULT_LOCK_TIMEOUT: THIRTY_SECONDS,
  DEFAULT_SEARCH_ENGINE: 'Google',
  TX_CHECK_BACKGROUND_FREQUENCY: THIRTY_SECONDS,

  // Decentralized Storage
  IPFS_OVERRIDE_PARAM: 'mm_override',
  IPFS_DEFAULT_GATEWAY_URL: 'https://dweb.link/ipfs/',
  IPNS_DEFAULT_GATEWAY_URL: 'https://gateway.pinata.cloud/ipns/',
  SWARM_DEFAULT_GATEWAY_URL: 'https://swarm-gateways.net/bzz:/',
  supportedTLDs: ['eth', 'xyz', 'test'],

  // Notifications
  MAX_PUSH_NOTIFICATION_PROMPT_TIMES: 2,

  // Service URLs
  SECURITY_ALERTS_API: {
    URL: SECURITY_ALERTS_API_URL,
  },
  PORTFOLIO: {
    URL: PORTFOLIO_URL,
  },
  BRIDGE: {
    ACTIVE: true,
    URL: `${PORTFOLIO_URL}/bridge`,
  },
  STAKE: {
    URL: `${PORTFOLIO_URL}/stake`,
  },
  // Cross-chain / Connext
  CONNEXT: {
    HUB_EXCHANGE_CEILING_TOKEN: 69,
    MIN_DEPOSIT_ETH: 0.03,
    MAX_DEPOSIT_TOKEN: 30,
    BLOCKED_DEPOSIT_DURATION_MINUTES: 5,
    CONTRACTS: {
      4: '0x0Fa90eC3AC3245112c6955d8F9DD74Ec9D599996',
      1: '0xdfa6edAe2EC0cF1d4A60542422724A48195A5071',
    },
  },
  // App Links & Addresses
  MM_UNIVERSAL_LINK_HOST: 'metamask.app.link',
  MM_DEEP_ITMS_APP_LINK: 'https://metamask.app.link/skAH3BaF99',
  SAI_ADDRESS: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
  HOMEPAGE_URL: 'https://portfolio.metamask.io/explore?MetaMaskEntry=mobile/',
  OLD_HOMEPAGE_URL_HOST: 'home.metamask.io',
  SHORT_HOMEPAGE_URL: 'MetaMask.io',
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',

  // User Agent
  USER_AGENT: Device.isAndroid()
    ? 'Mozilla/5.0 (Linux; Android 10; Android SDK built for x86 Build/OSM1.180201.023) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36'
    : 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/76.0.3809.123 Mobile/15E148 Safari/605.1',

  // Event Names
  NOTIFICATION_NAMES: {
    accountsChanged: 'metamask_accountsChanged',
    unlockStateChanged: 'metamask_unlockStateChanged',
    chainChanged: 'metamask_chainChanged',
  },

  // Fiat Orders
  FIAT_ORDERS: {
    POLLING_FREQUENCY: TEN_SECONDS,
  },

  // Deeplinks
  DEEPLINKS: {
    ORIGIN_DEEPLINK: 'deeplink',
    ORIGIN_QR_CODE: 'qr-code',
    ORIGIN_NOTIFICATION: 'notifications',
  },
  // WalletConnect
  WALLET_CONNECT: {
    SESSION_LIFETIME: ONE_DAY_IN_HOURS,
    LIMIT_SESSIONS: 20,
    DEEPLINK_SESSIONS: 'wc2sessions_deeplink',
    PROJECT_ID: WALLET_CONNECT_PROJECT_ID,
    METADATA: {
      name: 'MetaMask Wallet',
      description: 'MetaMask Wallet Integration',
      url: 'https://metamask.io/',
      icons: [
        'https://raw.githubusercontent.com/MetaMask/metamask-mobile/main/logo.png',
      ],
      redirect: {
        native: 'metamask://',
        universal: 'https://metamask.app.link/',
      },
    } as CoreTypes.Metadata,
  },
  // Swaps
  SWAPS: {
    ACTIVE: true,
    ONLY_MAINNET: true,
    CLIENT_ID: 'mobile',
    LIVENESS_POLLING_FREQUENCY: FIVE_MINUTES,
    POLL_COUNT_LIMIT: 4,
    DEFAULT_SLIPPAGE: 2,
    DEFAULT_SLIPPAGE_STABLECOINS: 0.5,
    CACHE_AGGREGATOR_METADATA_THRESHOLD: FIVE_MINUTES,
    CACHE_TOKENS_THRESHOLD: FIVE_MINUTES,
    CACHE_TOP_ASSETS_THRESHOLD: FIVE_MINUTES,
  },

  // Chain
  MAX_SAFE_CHAIN_ID: 4503599627370476,
  URLS: {
    ICONS: {
      MASTERCARD_LIGHT:
        'https://on-ramp.dev-api.cx.metamask.io/assets/Mastercard-regular@3x.png',
      MASTERCARD_DARK:
        'https://on-ramp.dev-api.cx.metamask.io/assets/Mastercard@3x.png',
      VISA_LIGHT:
        'https://on-ramp.dev-api.cx.metamask.io/assets/Visa-regular@3x.png',
      VISA_DARK: 'https://on-ramp.dev-api.cx.metamask.io/assets/Visa@3x.png',
      ACH_LIGHT:
        'https://on-ramp.dev-api.cx.metamask.io/assets/ACHBankTransfer-regular@3x.png',
      ACH_DARK:
        'https://on-ramp.dev-api.cx.metamask.io/assets/ACHBankTransfer@3x.png',
    },
    TERMS_AND_CONDITIONS: 'https://legal.consensys.io/metamask/terms-of-use/',
    TERMS_OF_USE: 'https://metamask.io/terms',
    PRIVACY_POLICY: 'https://consensys.io/privacy-policy',
    PROFILE_SYNC:
      'https://support.metamask.io/privacy-and-security/profile-privacy',
    DATA_RETENTION_UPDATE:
      'https://consensys.net/blog/news/consensys-data-retention-update/',
    CONNECTIVITY_ISSUES:
      'https://support.metamask.io/troubleshooting/why-infura-cannot-serve-certain-areas/',
    NFT: 'https://support.metamask.io/nfts/nft-tokens-in-your-metamask-wallet/',
    SECURITY:
      'https://support.metamask.io/privacy-and-security/basic-safety-and-security-tips-for-metamask/',
    TOKEN_BALANCE:
      'https://support.metamask.io/troubleshooting/what-to-do-when-your-balance-of-tokens-is-incorrect/',
    WHY_TRANSACTION_TAKE_TIME:
      'https://community.metamask.io/t/what-is-gas-why-do-transactions-take-so-long/3172',
    TESTNET_ETH_SCAMS:
      'https://support.metamask.io/privacy-and-security/staying-safe-in-web3/testnet-eth-scams/',
    WHAT_IS_SRP:
      'https://community.metamask.io/t/what-is-a-secret-recovery-phrase-and-how-to-keep-your-crypto-wallet-secure/3440',
    PRIVACY_POLICY_2024: 'https://consensys.io/privacy-policy',
    PRIVACY_BEST_PRACTICES:
      'https://support.metamask.io/privacy-and-security/privacy-best-practices',
    SMART_TXS:
      'https://support.metamask.io/transactions-and-gas/transactions/smart-transactions/',
    STAKING_RISK_DISCLOSURE: 'https://consensys.io/staking-risk-disclosures',
    ADD_SOLANA_ACCOUNT_PRIVACY_POLICY: 'https://support.metamask.io/configure/accounts/how-to-add-accounts-in-your-wallet/#solana-accounts',
  },
  DECODING_API_URL,

  // Errors
  ERRORS: {
    INFURA_BLOCKED_MESSAGE:
      'EthQuery - RPC Error - This service is not available in your country',
  },

  // Gas
  GAS_OPTIONS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    MARKET: 'market',
    AGGRESSIVE: 'aggressive',
  },
  GAS_TIMES: {
    UNKNOWN: 'unknown',
    MAYBE: 'maybe',
    LIKELY: 'likely',
    VERY_LIKELY: 'very_likely',
    AT_LEAST: 'at_least',
    LESS_THAN: 'less_than',
    RANGE: 'range',
  },

  // Review Prompts
  REVIEW_PROMPT: {
    HIGH_GAS_FEES:
      'https://support.metamask.io/transactions-and-gas/gas-fees/why-are-my-gas-fees-so-high/',
    MISSING_TOKENS:
      'https://support.metamask.io/managing-my-tokens/custom-tokens/how-to-display-tokens-in-metamask/',
    SWAP_ISSUES:
      'https://support.metamask.io/token-swaps/error-fetching-quote/',
    SUPPORT: 'https://support.metamask.io',
  },

  // Platform
  BUNDLE_IDS: {
    IOS: 'io.metamask.MetaMask',
    ANDROID: 'io.metamask',
  },
  LEAST_SUPPORTED_ANDROID_API_LEVEL: 29,

  // Network Configuration
  ADD_CUSTOM_NETWORK_POPULAR_TAB_ID: 'popular-tab',
  ADD_CUSTOM_NETWORK_CUSTOM_TAB_ID: 'custom-tab',
  REQUEST_SOURCES: {
    SDK_REMOTE_CONN: 'MetaMask-SDK-Remote-Conn',
    WC: 'WalletConnect',
    WC2: 'WalletConnectV2',
    IN_APP_BROWSER: 'In-App-Browser',
  },
  // SDK Configuration
  MM_SDK: {
    SDK_CONNECTIONS: 'sdkConnections',
    ANDROID_CONNECTIONS: 'androidConnections',
    ANDROID_SDK: 'AndroidSDK',
    IOS_SDK: 'iOSSDK',
    SDK_APPROVEDHOSTS: 'sdkApprovedHosts',
    SERVER_URL: SDK_COMMLAYER_URL,
    PLATFORM: 'metamask-mobile',
    SDK_REMOTE_ORIGIN: 'MMSDKREMOTE::',
    UNKNOWN_PARAM: 'UNKNOWN',
  },

  // Transaction Rates
  CANCEL_RATE: 'Transactions (Cancel)',
  SPEED_UP_RATE: 'Transactions (Speed Up)',

  // Controller Events
  NETWORK_STATE_CHANGE_EVENT: 'NetworkController:stateChange',
  NETWORK_DID_CHANGE_EVENT: 'NetworkController:networkDidChange',
  KEYRING_STATE_CHANGE_EVENT: 'KeyringController:stateChange',
  TOKEN_LIST_STATE_CHANGE_EVENT: 'TokenListController:stateChange',
  PPOM_INITIALISATION_STATE_CHANGE_EVENT:
    'PPOMController:initialisationStateChangeEvent',

  // Terms of Use
  TERMS_OF_USE: {
    TERMS_DISPLAYED: 'ToU Displayed',
    TERMS_ACCEPTED: 'ToU Accepted',
    TERMS_OF_USE_URL_WITHOUT_COOKIES:
      'https://legal.consensys.io/plain/terms-of-use/',
  },

  // Cache
  FAVICON_CACHE_MAX_SIZE: 100,

  // Block List
  BASIC_FUNCTIONALITY_BLOCK_LIST: [
    'token-api',
    'token.api',
    'gas-api',
    'gas.api',
    'price-api',
    'price.api',
    'phishing-detection',
    'dapp-scanning',
    'infura.io',
    'static.metafi',
    'static.cx',
    'config-api.metamask.io/featureFlags',
  ],

  // Feature Flags
  FEATURE_FLAGS_API: {
    BASE_URL: 'https://client-config.api.cx.metamask.io',
    VERSION: 'v1',
    DEFAULT_FETCH_INTERVAL: FIFTEEN_MINUTES,
  },
} as const;
