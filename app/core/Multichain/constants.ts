import { CaipChainId } from '@metamask/utils';
import {
  BtcAccountType,
  BtcScope,
  SolAccountType,
  SolScope,
} from '@metamask/keyring-api';
import { MultichainBlockExplorerFormatUrls } from './networks';

export const MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP: Record<
  CaipChainId,
  MultichainBlockExplorerFormatUrls
> = {
  [BtcScope.Mainnet]: {
    url: 'https://mempool.space/',
    address: 'https://mempool.space/address/{address}',
    transaction: 'https://mempool.space/tx/{txId}',
  },
  [BtcScope.Testnet]: {
    url: 'https://mempool.space/',
    address: 'https://mempool.space/testnet/address/{address}',
    transaction: 'https://mempool.space/testnet/tx/{txId}',
  },

  [SolScope.Mainnet]: {
    url: 'https://solscan.io',
    address: 'https://solscan.io/account/{address}',
    transaction: 'https://solscan.io/tx/{txId}',
  },
  [SolScope.Devnet]: {
    url: 'https://solscan.io',
    address: 'https://solscan.io/account/{address}?cluster=devnet',
    transaction: 'https://solscan.io/tx/{txId}?cluster=devnet',
  },
  [SolScope.Testnet]: {
    url: 'https://solscan.io',
    address: 'https://solscan.io/account/{address}?cluster=testnet',
    transaction: 'https://solscan.io/tx/{txId}?cluster=testnet',
  },
} as const;

export const MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET = {
  [BtcAccountType.P2wpkh]: BtcScope.Mainnet,
  [SolAccountType.DataAccount]: SolScope.Mainnet,
} as const;

export const PRICE_API_CURRENCIES = [
  'aud',
  'hkd',
  'sgd',
  'idr',
  'inr',
  'nzd',
  'php',
  'btc',
  'cad',
  'eur',
  'gbp',
  'jpy',
  'ltc',
  'rub',
  'uah',
  'usd',
  'xlm',
  'xrp',
  'sek',
  'aed',
  'ars',
  'bch',
  'bnb',
  'brl',
  'clp',
  'cny',
  'czk',
  'dkk',
  'chf',
  'dot',
  'eos',
  'eth',
  'gel',
  'huf',
  'ils',
  'krw',
  'mxn',
  'myr',
  'ngn',
  'nok',
  'pln',
  'thb',
  'try',
  'zar',
];
