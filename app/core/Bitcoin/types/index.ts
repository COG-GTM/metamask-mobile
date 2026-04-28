/**
 * Bitcoin type definitions for MetaMask Mobile.
 *
 * This barrel file re-exports all Bitcoin-specific types used by
 * controllers, services, UI components, and selectors.
 */

export {
  BitcoinAddressType,
  BITCOIN_ADDRESS_TYPES,
  type BitcoinAddress,
  type BitcoinAddressTypeInfo,
} from './address';

export {
  type BitcoinAccountData,
  type BitcoinBalance,
  type BitcoinUtxo,
  type CreateBitcoinAccountParams,
} from './account';

export {
  BitcoinNetworkId,
  BitcoinNetworkType,
  BITCOIN_NETWORK_ID_TO_TYPE,
  BITCOIN_NETWORKS,
  type BitcoinNetworkConfig,
} from './network';

export {
  BitcoinTransactionStatus,
  CoinSelectionStrategy,
  type BitcoinFeeRates,
  type BitcoinTransaction,
  type BitcoinTransactionInput,
  type BitcoinTransactionOutput,
  type BitcoinTransactionParams,
  type CoinSelectionResult,
} from './transaction';

export {
  BitcoinCoinType,
  BitcoinDerivationPurpose,
  ADDRESS_TYPE_TO_PURPOSE,
  DEFAULT_DERIVATION_PATHS,
  NETWORK_TO_COIN_TYPE,
  formatDerivationPath,
  formatAddressDerivationPath,
  type BitcoinDerivationPath,
  type SingleKeyAddressType,
} from './keyring';

export {
  type BitcoinAccountService,
  type BitcoinTransactionService,
  type BitcoinNetworkService,
  type BitcoinControllerRegistration,
} from './controller';
