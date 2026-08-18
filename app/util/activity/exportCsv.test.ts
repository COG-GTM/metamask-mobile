import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import Logger from '../Logger';
import { strings } from '../../../locales/i18n';
import {
  TX_CONFIRMED,
  TX_FAILED,
  TX_SUBMITTED,
} from '../../constants/transaction';
import { TRANSFER_FUNCTION_SIGNATURE } from '../transactions';
import {
  ActivityStatusCategory,
  ActivityTypeCategory,
  FilterableTransaction,
} from '../../components/hooks/useActivityFilters/types';
import { applyActivityFilters } from '../../components/hooks/useActivityFilters/utils';
import {
  buildCsvFileName,
  CSV_COLUMNS,
  CsvExportContext,
  CsvExportStatus,
  escapeCsvField,
  ExportableTransaction,
  exportTransactionsToCsv,
  serializeTransactionsToCsv,
} from './exportCsv';

jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/mock/caches',
  TemporaryDirectoryPath: '/mock/tmp',
  writeFile: jest.fn(),
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(),
}));

jest.mock('../Logger', () => ({
  error: jest.fn(),
}));

const SELECTED_ADDRESS = '0x1111111111111111111111111111111111111111';
const OTHER_ADDRESS = '0x2222222222222222222222222222222222222222';
const TOKEN_ADDRESS = '0x3333333333333333333333333333333333333333';

const CONTEXT: CsvExportContext = {
  selectedAddress: SELECTED_ADDRESS,
  networkNamesByChainId: { '0x1': 'Ethereum Mainnet', '0xe708': 'Linea' },
  nativeCurrencySymbolsByChainId: { '0x1': 'ETH', '0xe708': 'ETH' },
  fiatValuesByTransactionId: {},
  fiatCurrency: 'usd',
};

const pad64 = (value: string) => value.replace('0x', '').padStart(64, '0');

const transferData = (to: string, amountHex: string) =>
  `${TRANSFER_FUNCTION_SIGNATURE}${pad64(to)}${pad64(amountHex)}`;

const baseTx = (
  overrides: Partial<ExportableTransaction> = {},
): ExportableTransaction => ({
  id: 'tx-1',
  chainId: '0x1',
  hash: '0xabc',
  status: TX_CONFIRMED,
  // 2024-03-05T10:20:30.000Z
  time: 1709634030000,
  txParams: {
    from: SELECTED_ADDRESS,
    to: OTHER_ADDRESS,
    value: '0x0de0b6b3a7640000', // 1 ETH
    nonce: '0x2a',
    gas: '0x5208', // 21000
    gasPrice: '0x3b9aca00', // 1 gwei
  },
  ...overrides,
});

const rowsOf = (csv: string) => csv.split('\n');

const cellsOf = (csv: string, rowIndex: number) =>
  rowsOf(csv)[rowIndex].split(',');

describe('escapeCsvField', () => {
  it('leaves plain values untouched', () => {
    expect(escapeCsvField('ethereum')).toBe('ethereum');
  });

  it('returns an empty string for undefined and null', () => {
    expect(escapeCsvField(undefined)).toBe('');
    expect(escapeCsvField(null)).toBe('');
  });

  it('quotes values containing a comma', () => {
    expect(escapeCsvField('Acme, Inc')).toBe('"Acme, Inc"');
  });

  it('quotes values containing a double quote and doubles the quote', () => {
    expect(escapeCsvField('the "best" token')).toBe('"the ""best"" token"');
  });

  it('quotes values containing a newline', () => {
    expect(escapeCsvField('line one\nline two')).toBe('"line one\nline two"');
    expect(escapeCsvField('line one\r\nline two')).toBe(
      '"line one\r\nline two"',
    );
  });

  it('quotes a value containing a comma, a quote and a newline at once', () => {
    expect(escapeCsvField('a,b "c"\nd')).toBe('"a,b ""c""\nd"');
  });
});

describe('serializeTransactionsToCsv', () => {
  it('writes the header row in the order specified by the PRD', () => {
    expect(rowsOf(serializeTransactionsToCsv([], CONTEXT))[0]).toBe(
      'date_iso8601,network,status,type,hash,from,to,asset,amount,fiat_value,fiat_currency,gas_paid_native,nonce',
    );
    expect(CSV_COLUMNS).toHaveLength(13);
  });

  it('returns only the header row when there is nothing to export', () => {
    expect(rowsOf(serializeTransactionsToCsv([], CONTEXT))).toHaveLength(1);
  });

  it('serialises a native send with raw, spreadsheet friendly values', () => {
    const csv = serializeTransactionsToCsv([baseTx()], {
      ...CONTEXT,
      fiatValuesByTransactionId: { 'tx-1': '3210.5' },
    });

    expect(cellsOf(csv, 1)).toStrictEqual([
      '2024-03-05T10:20:30.000Z',
      'Ethereum Mainnet',
      ActivityStatusCategory.Confirmed,
      ActivityTypeCategory.Send,
      '0xabc',
      SELECTED_ADDRESS,
      OTHER_ADDRESS,
      'ETH',
      '1',
      '3210.5',
      'USD',
      '0.000021',
      '42',
    ]);
  });

  it('preserves the order of the transactions it is given', () => {
    const csv = serializeTransactionsToCsv(
      [
        baseTx({ id: 'tx-1', hash: '0xone' }),
        baseTx({ id: 'tx-2', hash: '0xtwo' }),
      ],
      CONTEXT,
    );

    expect(rowsOf(csv)).toHaveLength(3);
    expect(cellsOf(csv, 1)[4]).toBe('0xone');
    expect(cellsOf(csv, 2)[4]).toBe('0xtwo');
  });

  it('escapes fields that contain commas, quotes and newlines', () => {
    const csv = serializeTransactionsToCsv(
      [
        baseTx({
          transferInformation: {
            contractAddress: TOKEN_ADDRESS,
            symbol: 'A "weird",\ntoken',
            decimals: 18,
          },
          isTransfer: true,
        }),
      ],
      {
        ...CONTEXT,
        networkNamesByChainId: { '0x1': 'Chain, "Prime"' },
      },
    );

    expect(csv).toContain('"Chain, ""Prime"""');
    expect(csv).toContain('"A ""weird"",\ntoken"');
  });

  it('reuses the shared classifiers for the status and type columns', () => {
    const csv = serializeTransactionsToCsv(
      [
        baseTx({ id: 'tx-1', status: TX_SUBMITTED }),
        baseTx({ id: 'tx-2', status: TX_FAILED }),
        baseTx({
          id: 'tx-3',
          txParams: {
            from: OTHER_ADDRESS,
            to: SELECTED_ADDRESS,
            value: '0x1',
          },
        }),
      ],
      CONTEXT,
    );

    expect(cellsOf(csv, 1)[2]).toBe(ActivityStatusCategory.Pending);
    expect(cellsOf(csv, 2)[2]).toBe(ActivityStatusCategory.Failed);
    expect(cellsOf(csv, 3)[3]).toBe(ActivityTypeCategory.Receive);
  });

  it('exports an empty `to` and a contract interaction for contract creation', () => {
    const csv = serializeTransactionsToCsv(
      [
        baseTx({
          txParams: {
            from: SELECTED_ADDRESS,
            value: '0x0',
            data: '0x60806040',
          },
        }),
      ],
      CONTEXT,
    );

    expect(cellsOf(csv, 1)[6]).toBe('');
    expect(cellsOf(csv, 1)[3]).toBe(ActivityTypeCategory.ContractInteraction);
  });

  it('decodes the amount of an outgoing token transfer from its calldata', () => {
    const csv = serializeTransactionsToCsv(
      [
        baseTx({
          txParams: {
            from: SELECTED_ADDRESS,
            to: TOKEN_ADDRESS,
            value: '0x0',
            // 12.5 USDC
            data: transferData(OTHER_ADDRESS, '0xbebc20'),
          },
          transferInformation: {
            contractAddress: TOKEN_ADDRESS,
            symbol: 'USDC',
            decimals: 6,
          },
        }),
      ],
      CONTEXT,
    );

    expect(cellsOf(csv, 1)[7]).toBe('USDC');
    expect(cellsOf(csv, 1)[8]).toBe('12.5');
  });

  it('reads the amount of an incoming token transfer from the value', () => {
    const csv = serializeTransactionsToCsv(
      [
        baseTx({
          isTransfer: true,
          txParams: {
            from: OTHER_ADDRESS,
            to: SELECTED_ADDRESS,
            value: '0x1e8480', // 2 USDC
          },
          transferInformation: {
            contractAddress: TOKEN_ADDRESS,
            symbol: 'USDC',
            decimals: 6,
          },
        }),
      ],
      CONTEXT,
    );

    expect(cellsOf(csv, 1)[8]).toBe('2');
  });

  it('writes amounts without symbols, thousands separators or rounding', () => {
    const csv = serializeTransactionsToCsv(
      [
        baseTx({
          txParams: {
            from: SELECTED_ADDRESS,
            to: OTHER_ADDRESS,
            value: '0x56bc75e2d63100000', // 100 ETH
          },
        }),
        baseTx({
          id: 'tx-2',
          txParams: {
            from: SELECTED_ADDRESS,
            to: OTHER_ADDRESS,
            value: '0x2386f26fc10000', // 0.01 ETH
          },
        }),
        baseTx({
          id: 'tx-3',
          txParams: {
            from: SELECTED_ADDRESS,
            to: OTHER_ADDRESS,
            value: '0x2710', // 0.00000000000001 ETH
          },
        }),
      ],
      CONTEXT,
    );

    expect(cellsOf(csv, 1)[8]).toBe('100');
    expect(cellsOf(csv, 2)[8]).toBe('0.01');
    expect(cellsOf(csv, 3)[8]).toBe('0.00000000000001');
  });

  it('falls back to the chain id when the network name is unknown', () => {
    const csv = serializeTransactionsToCsv(
      [baseTx({ chainId: '0x99' })],
      CONTEXT,
    );

    expect(cellsOf(csv, 1)[1]).toBe('0x99');
  });

  it('prefers the receipt over the requested gas for gas paid', () => {
    const csv = serializeTransactionsToCsv(
      [
        baseTx({
          txReceipt: { gasUsed: '0x2710', effectiveGasPrice: '0x3b9aca00' },
        }),
      ],
      CONTEXT,
    );

    expect(cellsOf(csv, 1)[11]).toBe('0.00001');
  });

  it('leaves gas paid and nonce empty when they are unknown', () => {
    const csv = serializeTransactionsToCsv(
      [
        baseTx({
          txParams: { from: SELECTED_ADDRESS, to: OTHER_ADDRESS, value: '0x1' },
        }),
      ],
      CONTEXT,
    );

    expect(cellsOf(csv, 1)[11]).toBe('');
    expect(cellsOf(csv, 1)[12]).toBe('');
  });

  it('leaves the date empty when the transaction has no usable timestamp', () => {
    const csv = serializeTransactionsToCsv(
      [baseTx({ time: Number.NaN })],
      CONTEXT,
    );

    expect(cellsOf(csv, 1)[0]).toBe('');
  });

  it('omits the fiat currency when there is no fiat value for the row', () => {
    const csv = serializeTransactionsToCsv([baseTx()], CONTEXT);

    expect(cellsOf(csv, 1)[9]).toBe('');
    expect(cellsOf(csv, 1)[10]).toBe('');
  });

  it('accepts the filtered array produced by the activity filters', () => {
    const transactions: FilterableTransaction[] = [
      baseTx({ id: 'tx-1' }),
      baseTx({ id: 'tx-2', status: TX_FAILED }),
    ];
    const filtered = applyActivityFilters(
      transactions,
      {
        query: '',
        types: [],
        statuses: [ActivityStatusCategory.Failed],
      },
      {},
      SELECTED_ADDRESS,
    );

    const csv = serializeTransactionsToCsv(filtered, CONTEXT);

    expect(rowsOf(csv)).toHaveLength(2);
    expect(cellsOf(csv, 1)[2]).toBe(ActivityStatusCategory.Failed);
  });
});

describe('buildCsvFileName', () => {
  it('includes the shortened account and the local date', () => {
    expect(buildCsvFileName(SELECTED_ADDRESS, new Date(2024, 2, 5))).toBe(
      'metamask-activity-0x11111111-2024-03-05.csv',
    );
  });

  it('pads single digit months and days', () => {
    expect(buildCsvFileName(undefined, new Date(2024, 0, 9))).toBe(
      'metamask-activity-2024-01-09.csv',
    );
  });
});

describe('exportTransactionsToCsv', () => {
  const writeFile = RNFS.writeFile as jest.Mock;
  const shareOpen = Share.open as jest.Mock;
  const loggerError = Logger.error as jest.Mock;
  const now = new Date(2024, 2, 5);

  beforeEach(() => {
    jest.clearAllMocks();
    writeFile.mockResolvedValue(undefined);
    shareOpen.mockResolvedValue({ success: true });
  });

  it('writes the file to the cache directory and opens the share sheet', async () => {
    const result = await exportTransactionsToCsv([baseTx()], CONTEXT, now);

    const expectedPath =
      '/mock/caches/metamask-activity-0x11111111-2024-03-05.csv';
    expect(writeFile).toHaveBeenCalledWith(
      expectedPath,
      serializeTransactionsToCsv([baseTx()], CONTEXT),
      'utf8',
    );
    expect(shareOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `file://${expectedPath}`,
        type: 'text/csv',
        filename: 'metamask-activity-0x11111111-2024-03-05.csv',
        failOnCancel: false,
      }),
    );
    expect(result).toStrictEqual({ status: CsvExportStatus.Success });
  });

  it('does nothing but report the empty case when there is nothing to export', async () => {
    const result = await exportTransactionsToCsv([], CONTEXT, now);

    expect(writeFile).not.toHaveBeenCalled();
    expect(shareOpen).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      status: CsvExportStatus.Empty,
      message: strings('activity_view.export_empty'),
    });
  });

  it('reports a user facing message when the file cannot be written', async () => {
    writeFile.mockRejectedValue(new Error('ENOSPC'));

    const result = await exportTransactionsToCsv([baseTx()], CONTEXT, now);

    expect(shareOpen).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      status: CsvExportStatus.Error,
      message: strings('activity_view.export_error'),
    });
    expect(loggerError).toHaveBeenCalled();
  });

  it('treats a dismissed share sheet as a non error', async () => {
    shareOpen.mockRejectedValue(new Error('User did not share'));

    const result = await exportTransactionsToCsv([baseTx()], CONTEXT, now);

    expect(result).toStrictEqual({ status: CsvExportStatus.Cancelled });
    expect(loggerError).not.toHaveBeenCalled();
  });

  it('reports a user facing message when sharing fails', async () => {
    shareOpen.mockRejectedValue(new Error('share unavailable'));

    const result = await exportTransactionsToCsv([baseTx()], CONTEXT, now);

    expect(result).toStrictEqual({
      status: CsvExportStatus.Error,
      message: strings('activity_view.export_error'),
    });
    expect(loggerError).toHaveBeenCalled();
  });

  it('never logs addresses, hashes or amounts', async () => {
    writeFile.mockRejectedValue(new Error('write failed'));

    await exportTransactionsToCsv([baseTx()], CONTEXT, now);

    const loggedContext = loggerError.mock.calls[0][1] as string;
    expect(loggedContext).not.toContain(SELECTED_ADDRESS);
    expect(loggedContext).not.toContain('0xabc');
  });
});
