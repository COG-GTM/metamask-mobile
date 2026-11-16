import BigNumber from 'bignumber.js';
import {
  fromTokenMinimalUnitString,
  fromWei,
} from '../../../../../../util/number';
import { generateTransferData } from '../../../../../../util/transactions';

const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

export class InvalidPaymentRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPaymentRequestError';
  }
}

export interface PaymentRequestToken {
  address: string;
  decimals?: number | string;
  symbol?: string;
  [key: string]: unknown;
}

/**
 * Parses a payment request amount (EIP-681 `value` / `uint256`) into an exact
 * integer. Missing amounts resolve to zero. Decimal, scientific notation
 * (e.g. `1.5e+23`) and integer strings are accepted, but the resulting amount
 * must be a non-negative integer that fits in a uint256.
 *
 * @param amount - Raw amount from the deeplink parameters.
 * @returns The amount as an exact BigNumber.
 */
export function parsePaymentRequestAmount(amount: unknown): BigNumber {
  if (amount === undefined || amount === null || amount === '') {
    return new BigNumber(0);
  }
  if (typeof amount !== 'string' && typeof amount !== 'number') {
    throw new InvalidPaymentRequestError('Invalid amount');
  }
  const parsed = new BigNumber(String(amount).trim(), 10);
  if (
    !parsed.isFinite() ||
    parsed.isNegative() ||
    !parsed.isInteger() ||
    parsed.gt(MAX_UINT256)
  ) {
    throw new InvalidPaymentRequestError(`Invalid amount: ${amount}`);
  }
  return parsed;
}

function parseTokenDecimals(decimals: unknown): number {
  const parsed = Number(decimals);
  if (
    decimals === undefined ||
    decimals === null ||
    decimals === '' ||
    !Number.isInteger(parsed) ||
    parsed < 0
  ) {
    throw new InvalidPaymentRequestError(`Invalid token decimals: ${decimals}`);
  }
  return parsed;
}

/**
 * Builds the amount-related fields of a `send-eth` payment request.
 *
 * @param params - Recipient and optional wei `value` from the deeplink.
 * @param params.to - Resolved recipient address.
 * @param params.value - Optional amount in wei.
 * @returns Partial transaction meta for `setTransactionObject`.
 */
export function buildSendEthTxMeta({
  to,
  value,
}: {
  to: string;
  value?: unknown;
}) {
  const txMeta: {
    symbol: string;
    assetType: string;
    paymentRequest: boolean;
    selectedAsset: { symbol: string; isETH: boolean };
    to: string;
    transactionTo: string;
    value?: string;
    transactionValue?: string;
    readableValue?: string;
  } = {
    symbol: 'ETH',
    assetType: 'ETH',
    paymentRequest: true,
    selectedAsset: { symbol: 'ETH', isETH: true },
    to,
    transactionTo: to,
  };

  if (value !== undefined && value !== null && value !== '') {
    const hexValue = `0x${parsePaymentRequestAmount(value).toString(16)}`;
    txMeta.value = hexValue;
    txMeta.transactionValue = hexValue;
    txMeta.readableValue = fromWei(hexValue);
  }

  return txMeta;
}

/**
 * Builds the ERC-20 `transfer` transaction meta of a `send-token` payment
 * request. The transfer data encodes the exact `uint256` amount and
 * `readableValue` is derived from the same amount using the token decimals.
 *
 * @param params - Token, recipient and optional `uint256` from the deeplink.
 * @param params.selectedAsset - Token being transferred (address and decimals).
 * @param params.to - Resolved recipient address.
 * @param params.ensRecipient - ENS name of the recipient, if any.
 * @param params.uint256 - Optional amount in the token's minimal unit.
 * @returns Partial transaction meta for `setTransactionObject`.
 */
export function buildSendTokenTxMeta({
  selectedAsset,
  to,
  ensRecipient,
  uint256,
}: {
  selectedAsset: PaymentRequestToken;
  to: string;
  ensRecipient?: string;
  uint256?: unknown;
}) {
  const decimals = parseTokenDecimals(selectedAsset?.decimals);
  const amount = parsePaymentRequestAmount(uint256);

  return {
    assetType: 'ERC20',
    paymentRequest: true,
    selectedAsset,
    ensRecipient,
    to: selectedAsset.address,
    transactionTo: to,
    data: generateTransferData('transfer', {
      toAddress: to,
      amount: amount.toString(16),
    }) as string,
    value: '0x0',
    readableValue: fromTokenMinimalUnitString(amount.toFixed(), decimals),
  };
}
