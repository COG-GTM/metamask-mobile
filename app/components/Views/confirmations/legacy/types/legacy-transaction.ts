import { Hex } from '@metamask/utils';
import { SecurityAlertResponse } from '../components/BlockaidBanner/BlockaidBanner.types';

/**
 * Asset selected for the legacy send/approve flows, as stored in the
 * `transaction` reducer.
 */
export interface LegacySelectedAsset {
  address?: string;
  balance?: string;
  balanceError?: string;
  balanceFiat?: string;
  decimals?: number;
  image?: string;
  isETH?: boolean;
  logo?: string;
  name?: string;
  standard?: string;
  symbol?: string;
  tokenId?: string;
}

/**
 * The transaction parameters held by the legacy `transaction` reducer.
 */
export interface LegacyTransactionParams {
  data?: string;
  estimatedBaseFee?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  to?: string;
  value?: string;
}

/**
 * State of the legacy `transaction` reducer, as normalized by
 * `getNormalizedTxState`.
 */
interface LegacyTransactionStateFields {
  assetType?: string;
  chainId?: Hex;
  ensRecipient?: string;
  id?: string;
  networkClientId?: string;
  nonce?: number;
  origin?: string;
  paymentRequest?: boolean;
  proposedNonce?: number;
  readableValue?: string;
  securityAlertResponses?: Record<string, SecurityAlertResponse>;
  selectedAsset: LegacySelectedAsset;
  symbol?: string;
  transaction: LegacyTransactionParams;
  transactionFromName?: string;
  transactionTo?: string;
  transactionToName?: string;
  transactionValue?: string;
  type?: string;
  useMax?: boolean;
  warningGasPriceHigh?: string;
}

/**
 * `getNormalizedTxState` spreads the nested `transaction` params over the
 * reducer state, so both shapes are available on the same object.
 */
export interface LegacyTransactionState
  extends LegacyTransactionStateFields,
    LegacyTransactionParams {}
