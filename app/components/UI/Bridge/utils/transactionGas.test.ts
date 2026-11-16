import { TransactionMeta } from '@metamask/transaction-controller';
import { calcHexGasTotal } from './transactionGas';

const buildTxMeta = (
  txParams: Record<string, string> = {},
  txReceipt?: Record<string, string>,
) => ({ txParams, txReceipt } as unknown as TransactionMeta);

describe('calcHexGasTotal', () => {
  it('uses txParams gas and gasPrice when there is no receipt', () => {
    expect(
      calcHexGasTotal(buildTxMeta({ gas: '0x5208', gasPrice: '0x3b9aca00' })),
    ).toBe('0x1319718a5000');
  });

  it('prefers receipt gasUsed over txParams gas', () => {
    expect(
      calcHexGasTotal(
        buildTxMeta({ gas: '0xffff', gasPrice: '0x2' }, { gasUsed: '0x5208' }),
      ),
    ).toBe('0xa410');
  });

  it('prefers txParams gasPrice over receipt effectiveGasPrice', () => {
    expect(
      calcHexGasTotal(
        buildTxMeta(
          { gas: '0x5208', gasPrice: '0x2' },
          { effectiveGasPrice: '0x3' },
        ),
      ),
    ).toBe('0xa410');
  });

  it('falls back to receipt effectiveGasPrice for EIP-1559 transactions', () => {
    expect(
      calcHexGasTotal(
        buildTxMeta(
          { gas: '0xffff', maxFeePerGas: '0x10' },
          { gasUsed: '0x5208', effectiveGasPrice: '0x3' },
        ),
      ),
    ).toBe('0xf618');
  });

  it('returns 0x0 when no gas price is available', () => {
    expect(calcHexGasTotal(buildTxMeta({ gas: '0x5208' }))).toBe('0x0');
  });

  it('returns 0x0 when no gas limit is available', () => {
    expect(calcHexGasTotal(buildTxMeta({ gasPrice: '0x2' }))).toBe('0x0');
  });

  it('returns 0x0 when txParams and txReceipt are both missing', () => {
    expect(calcHexGasTotal({} as unknown as TransactionMeta)).toBe('0x0');
  });
});
