import Share from 'react-native-share'; // eslint-disable-line import/default
import RNFS from 'react-native-fs';
import BigNumber from 'bignumber.js';
import { strings } from '../../../locales/i18n';
import Logger from '../Logger';
import { fromTokenMinimalUnitString, fromWei } from '../number';
import { FilterableTransaction } from '../../components/hooks/useActivityFilters/types';
import {
  classifyTxStatus,
  classifyTxType,
} from '../../components/hooks/useActivityFilters/utils';

/**
 * Columns of the exported file, in order, as specified by the PRD.
 */
export const CSV_COLUMNS = [
  'date_iso8601',
  'network',
  'status',
  'type',
  'hash',
  'from',
  'to',
  'asset',
  'amount',
  'fiat_value',
  'fiat_currency',
  'gas_paid_native',
  'nonce',
] as const;

const ROW_SEPARATOR = '\n';
const FIELD_SEPARATOR = ',';
const DEFAULT_NATIVE_SYMBOL = 'ETH';
const ERC20_TRANSFER_AMOUNT_START = 74;
const ERC20_TRANSFER_AMOUNT_LENGTH = 64;
const SHARE_CANCELLED_MESSAGE = 'User did not share';

/**
 * A transaction as held by the activity list, with the additional raw fields
 * the export reads. Everything beyond `FilterableTransaction` is optional, so
 * the filtered array returned by `useActivityFilters` is assignable as is.
 */
export interface ExportableTransaction extends FilterableTransaction {
  txParams: FilterableTransaction['txParams'] & {
    value?: string;
    nonce?: string;
    gas?: string;
    gasPrice?: string;
  };
  txReceipt?: {
    gasUsed?: string;
    effectiveGasPrice?: string;
  };
}

export interface CsvExportContext {
  /** Checksummed address of the account the activity belongs to. */
  selectedAddress: string;
  /** Chain id to human readable network name. */
  networkNamesByChainId?: Record<string, string>;
  /** Chain id to the ticker of its native currency, e.g. `ETH`. */
  nativeCurrencySymbolsByChainId?: Record<string, string>;
  /**
   * Fiat value already stored on / computed for a transaction, keyed by
   * transaction id, as a raw decimal string. Historical re-pricing is out of
   * scope, so rows without an entry export an empty fiat value.
   */
  fiatValuesByTransactionId?: Record<string, string | undefined>;
  /** Currency the fiat values are denominated in, e.g. `USD`. */
  fiatCurrency?: string;
}

export enum CsvExportStatus {
  Success = 'success',
  Cancelled = 'cancelled',
  Empty = 'empty',
  Error = 'error',
}

export interface CsvExportResult {
  status: CsvExportStatus;
  /** Localised, user facing message for the empty and error cases. */
  message?: string;
}

/**
 * Escapes a single field per RFC 4180: a field containing the field separator,
 * a double quote or a line break is wrapped in double quotes, and inner double
 * quotes are doubled.
 */
export const escapeCsvField = (value: string | undefined | null): string => {
  if (value === undefined || value === null) {
    return '';
  }
  const stringValue = String(value);
  if (!/[",\r\n]/.test(stringValue)) {
    return stringValue;
  }
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const toBigNumber = (value: string | undefined): BigNumber | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = new BigNumber(value);
  return parsed.isFinite() ? parsed : undefined;
};

const toDecimalString = (value: string | undefined): string => {
  const parsed = toBigNumber(value);
  return parsed === undefined ? '' : parsed.toFixed(0);
};

const toIsoDate = (time: number | undefined): string => {
  if (typeof time !== 'number' || !Number.isFinite(time)) {
    return '';
  }
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString();
};

/**
 * Reads the amount out of an ERC-20 `transfer(address,uint256)` calldata, which
 * is where the value of an outgoing token transfer lives.
 */
const decodeTransferAmount = (data: string | undefined): string | undefined => {
  if (
    !data ||
    data.length < ERC20_TRANSFER_AMOUNT_START + ERC20_TRANSFER_AMOUNT_LENGTH
  ) {
    return undefined;
  }
  const encodedAmount = data.substring(
    ERC20_TRANSFER_AMOUNT_START,
    ERC20_TRANSFER_AMOUNT_START + ERC20_TRANSFER_AMOUNT_LENGTH,
  );
  return toBigNumber(`0x${encodedAmount}`)?.toFixed(0);
};

/**
 * Raw, unformatted amount: full precision decimal, `.` separator, no thousands
 * separator and no currency symbol, so spreadsheets parse it as a number.
 */
const getAmount = (tx: ExportableTransaction): string => {
  const decimals = tx.transferInformation?.decimals;

  if (decimals !== undefined) {
    // Incoming transfers carry the amount on `value`; outgoing ERC-20
    // transfers carry it in the `transfer` calldata.
    const minimalUnit = tx.isTransfer
      ? toDecimalString(tx.txParams?.value)
      : decodeTransferAmount(tx.txParams?.data) ??
        toDecimalString(tx.txParams?.value);
    if (!minimalUnit) {
      return '';
    }
    return fromTokenMinimalUnitString(minimalUnit, decimals);
  }

  const value = toDecimalString(tx.txParams?.value);
  if (!value) {
    return '';
  }
  return fromWei(value);
};

/**
 * Gas actually paid, in the native currency. Uses the receipt when the
 * transaction has one, otherwise falls back to the requested gas limit and
 * price, and exports nothing when neither is available.
 */
const getGasPaid = (tx: ExportableTransaction): string => {
  const gasUsed =
    toBigNumber(tx.txReceipt?.gasUsed) ?? toBigNumber(tx.txParams?.gas);
  const gasPrice =
    toBigNumber(tx.txReceipt?.effectiveGasPrice) ??
    toBigNumber(tx.txParams?.gasPrice);

  if (gasUsed === undefined || gasPrice === undefined) {
    return '';
  }

  return fromWei(gasUsed.times(gasPrice).toFixed(0));
};

const getAsset = (
  tx: ExportableTransaction,
  context: CsvExportContext,
): string => {
  if (tx.transferInformation?.symbol) {
    return tx.transferInformation.symbol;
  }
  if (tx.chainId && context.nativeCurrencySymbolsByChainId?.[tx.chainId]) {
    return context.nativeCurrencySymbolsByChainId[tx.chainId];
  }
  return DEFAULT_NATIVE_SYMBOL;
};

const buildRow = (
  tx: ExportableTransaction,
  context: CsvExportContext,
): string[] => {
  const fiatValue = context.fiatValuesByTransactionId?.[tx.id] ?? '';

  return [
    toIsoDate(tx.time),
    (tx.chainId && context.networkNamesByChainId?.[tx.chainId]) ||
      tx.chainId ||
      '',
    classifyTxStatus(tx),
    classifyTxType(tx, context.selectedAddress),
    tx.hash ?? '',
    tx.txParams?.from ?? '',
    tx.txParams?.to ?? '',
    getAsset(tx, context),
    getAmount(tx),
    fiatValue,
    fiatValue ? context.fiatCurrency?.toUpperCase() ?? '' : '',
    getGasPaid(tx),
    toDecimalString(tx.txParams?.nonce),
  ];
};

/**
 * Serialises transactions to a CSV document: a header row followed by one row
 * per transaction, in the order they are given (which is the order the
 * activity list renders them in). Pure and synchronous.
 */
export const serializeTransactionsToCsv = (
  transactions: ExportableTransaction[],
  context: CsvExportContext,
): string => {
  const header = CSV_COLUMNS.join(FIELD_SEPARATOR);
  const rows = transactions.map((tx) =>
    buildRow(tx, context).map(escapeCsvField).join(FIELD_SEPARATOR),
  );

  return [header, ...rows].join(ROW_SEPARATOR);
};

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * `metamask-activity-<0xabcd1234>-<yyyy-mm-dd>.csv`, with the account segment
 * omitted when no address is given.
 */
export const buildCsvFileName = (
  address?: string,
  now: Date = new Date(),
): string => {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}`;
  const normalized = address?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
  const accountSegment =
    normalized.length >= 8
      ? `-0x${normalized.slice(2, 6)}${normalized.slice(-4)}`
      : '';

  return `metamask-activity${accountSegment}-${date}.csv`;
};

const getExportDirectory = (): string =>
  RNFS.CachesDirectoryPath ?? RNFS.TemporaryDirectoryPath;

const isCancellation = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes(SHARE_CANCELLED_MESSAGE);
};

/**
 * Serialises the given (already filtered) transactions, writes them to a file
 * in the cache directory and hands it to the native share sheet.
 *
 * Nothing is thrown: the caller gets a result it can render. Dismissing the
 * share sheet is not an error.
 */
export const exportTransactionsToCsv = async (
  transactions: ExportableTransaction[],
  context: CsvExportContext,
  now: Date = new Date(),
): Promise<CsvExportResult> => {
  if (!transactions.length) {
    return {
      status: CsvExportStatus.Empty,
      message: strings('activity_view.export_empty'),
    };
  }

  const fileName = buildCsvFileName(context.selectedAddress, now);
  const path = `${getExportDirectory()}/${fileName}`;

  try {
    const csv = serializeTransactionsToCsv(transactions, context);
    await RNFS.writeFile(path, csv, 'utf8');
  } catch (error) {
    Logger.error(error as Error, 'Activity CSV export: failed to write file');
    return {
      status: CsvExportStatus.Error,
      message: strings('activity_view.export_error'),
    };
  }

  try {
    await Share.open({
      url: `file://${path}`,
      type: 'text/csv',
      filename: fileName,
      subject: strings('activity_view.export_share_title'),
      title: strings('activity_view.export_share_title'),
      failOnCancel: false,
    });
  } catch (error) {
    if (isCancellation(error)) {
      return { status: CsvExportStatus.Cancelled };
    }
    Logger.error(error as Error, 'Activity CSV export: share sheet failed');
    return {
      status: CsvExportStatus.Error,
      message: strings('activity_view.export_error'),
    };
  }

  return { status: CsvExportStatus.Success };
};
