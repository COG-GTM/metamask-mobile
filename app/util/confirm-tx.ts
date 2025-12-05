import BigNumber from 'bignumber.js';
import { addHexPrefix } from './number';

import {
  conversionUtil,
  addCurrencies,
  multiplyCurrencies,
  conversionGreaterThan,
} from './conversion';
import I18n from '../../locales/i18n';

/**
 * Ethereum denomination type
 */
type EthDenomination = 'WEI' | 'GWEI' | 'ETH';

/**
 * Parameters for gas total calculation
 */
interface GasTotalParams {
  gasLimit: string;
  gasPrice: string;
}

/**
 * Parameters for getValueFromWeiHex function
 */
interface GetValueFromWeiHexParams {
  value: string;
  fromCurrency?: string;
  toCurrency: string;
  conversionRate: number;
  numberOfDecimals: number;
  toDenomination?: EthDenomination;
}

/**
 * Parameters for getTransactionFee function
 */
interface GetTransactionFeeParams {
  value: string | BigNumber;
  fromCurrency?: string;
  toCurrency: string;
  conversionRate: number;
  numberOfDecimals: number;
}

/**
 * Parameters for convertTokenToFiat function
 */
interface ConvertTokenToFiatParams {
  value: string;
  fromCurrency?: string;
  toCurrency: string;
  conversionRate: number;
  contractExchangeRate: number | null | undefined;
}

const NON_ISO4217_CRYPTO_CODES: string[] = [
  '1ST',
  'DASH',
  'MYST',
  'PTOY',
  'QTUM',
  'SC',
  'SNGLS',
  'STORJ',
  'STEEM',
  'TIME',
  'TRST',
  'USDC',
  'USDT',
  'WINGS',
  'ZEC',
];

/**
 * Increases the last gas price by 10%
 *
 * @param lastGasPrice - The last gas price as a hex string
 * @returns The increased gas price as a hex string with '0x' prefix
 */
export function increaseLastGasPrice(lastGasPrice: string): string {
  return addHexPrefix(
    multiplyCurrencies(lastGasPrice || '0x0', 1.1, {
      multiplicandBase: 16,
      multiplierBase: 10,
      toNumericBase: 'hex',
    }) as string,
  );
}

/**
 * Compares two hex values
 *
 * @param a - First hex value
 * @param b - Second hex value
 * @returns True if a is greater than b
 */
export function hexGreaterThan(a: string, b: string): boolean {
  return conversionGreaterThan(
    { value: a, fromNumericBase: 'hex' },
    { value: b, fromNumericBase: 'hex' },
  );
}

/**
 * Calculates the total gas cost in hex
 *
 * @param params - Object containing gasLimit and gasPrice
 * @returns The total gas cost as a hex string with '0x' prefix
 */
export function getHexGasTotal({ gasLimit, gasPrice }: GasTotalParams): string {
  return addHexPrefix(
    multiplyCurrencies(gasLimit || '0x0', gasPrice || '0x0', {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 16,
    }) as string,
  );
}

/**
 * Adds multiple ETH amounts together
 *
 * @param args - ETH amounts to add
 * @returns The sum of all ETH amounts
 */
export function addEth(...args: string[]): string {
  return args.reduce(
    (acc, ethAmount) =>
      addCurrencies(acc, ethAmount, {
        toNumericBase: 'dec',
        numberOfDecimals: 6,
        aBase: 10,
        bBase: 10,
      }) as string,
    args[0],
  );
}

/**
 * Adds multiple fiat amounts together
 *
 * @param args - Fiat amounts to add
 * @returns The sum of all fiat amounts
 */
export function addFiat(...args: string[]): string {
  return args.reduce(
    (acc, fiatAmount) =>
      addCurrencies(acc, fiatAmount, {
        toNumericBase: 'dec',
        numberOfDecimals: 2,
        aBase: 10,
        bBase: 10,
      }) as string,
    args[0],
  );
}

/**
 * Converts a value from wei (hex) to a specified currency
 *
 * @param params - Conversion parameters
 * @returns The converted value as a string
 */
export function getValueFromWeiHex({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination,
}: GetValueFromWeiHexParams): string {
  return conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency,
    toCurrency,
    numberOfDecimals,
    fromDenomination: 'WEI',
    toDenomination,
    conversionRate,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as string;
}

/**
 * Gets the transaction fee in a specified currency
 *
 * @param params - Transaction fee parameters
 * @returns The transaction fee as a string
 */
export function getTransactionFee({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  numberOfDecimals,
}: GetTransactionFeeParams): string {
  return conversionUtil(value, {
    fromNumericBase: 'BN',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    fromCurrency,
    toCurrency,
    numberOfDecimals,
    conversionRate,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as string;
}

/**
 * Formats a currency value according to locale and currency code
 *
 * @param value - The value to format
 * @param currencyCode - The currency code (e.g., 'USD', 'ETH')
 * @returns The formatted currency string
 */
export function formatCurrency(value: string, currencyCode: string): string {
  const upperCaseCurrencyCode = currencyCode.toUpperCase();

  const formatedCurrency = NON_ISO4217_CRYPTO_CODES.includes(
    upperCaseCurrencyCode,
  )
    ? `${Number(value)} ${upperCaseCurrencyCode}`
    : new Intl.NumberFormat(I18n.locale, {
        currency: upperCaseCurrencyCode,
        style: 'currency',
      }).format(Number(value));

  return formatedCurrency;
}

/**
 * Converts a token value to fiat currency
 *
 * @param params - Conversion parameters
 * @returns The fiat value as a string, or 0 if no contract exchange rate
 */
export function convertTokenToFiat({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  contractExchangeRate,
}: ConvertTokenToFiatParams): string | number {
  if (!contractExchangeRate) return 0;
  const totalExchangeRate = conversionRate * contractExchangeRate;

  return conversionUtil(value, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromCurrency,
    toCurrency,
    numberOfDecimals: 2,
    conversionRate: totalExchangeRate,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as string;
}

/**
 * Rounds the given decimal string to 4 significant digits.
 *
 * @param decimalString - The base-ten number to round.
 * @returns The rounded number, or the original number if no
 * rounding was necessary.
 */
export function roundExponential(decimalString: string): string {
  const PRECISION = 4;
  const bigNumberValue = new BigNumber(decimalString);

  // In JS, numbers with exponentials greater than 20 get displayed as an exponential.
  return bigNumberValue.e !== null && bigNumberValue.e > 20
    ? bigNumberValue.toPrecision(PRECISION)
    : decimalString;
}
