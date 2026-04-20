import Engine from '../../core/Engine';
import {
  convertNetworkId,
  deprecatedGetNetworkId,
  fetchEstimatedMultiLayerL1Fee,
  toggleUseSafeChainsListValidation,
} from './engineNetworkUtils';

describe('convertNetworkId', () => {
  it('returns the number as a decimal string', () => {
    expect(convertNetworkId(1)).toBe('1');
    expect(convertNetworkId(137)).toBe('137');
  });

  it('converts a 0x-prefixed hex string to decimal', () => {
    expect(convertNetworkId('0x89')).toBe('137');
  });

  it('returns decimal strings unchanged', () => {
    expect(convertNetworkId('42')).toBe('42');
  });

  it('throws for unparseable values', () => {
    expect(() => convertNetworkId('0xNOT' as unknown as string)).toThrow();
    expect(() => convertNetworkId(Number.NaN)).toThrow();
  });
});

describe('toggleUseSafeChainsListValidation', () => {
  it('delegates to PreferencesController.setUseSafeChainsListValidation', () => {
    const setUseSafeChainsListValidation = jest.fn();
    (
      Engine.context as unknown as {
        PreferencesController: { setUseSafeChainsListValidation: jest.Mock };
      }
    ).PreferencesController = { setUseSafeChainsListValidation };

    toggleUseSafeChainsListValidation(true);
    toggleUseSafeChainsListValidation(false);

    expect(setUseSafeChainsListValidation).toHaveBeenNthCalledWith(1, true);
    expect(setUseSafeChainsListValidation).toHaveBeenNthCalledWith(2, false);
  });
});

describe('fetchEstimatedMultiLayerL1Fee', () => {
  it('strips the 0x prefix from the controller response', async () => {
    const getLayer1GasFee = jest.fn().mockResolvedValue('0xabcd');
    (
      Engine.context as unknown as {
        TransactionController: { getLayer1GasFee: jest.Mock };
      }
    ).TransactionController = { getLayer1GasFee };

    const fee = await fetchEstimatedMultiLayerL1Fee(null, {
      chainId: '0x1',
      networkClientId: 'mainnet',
      txParams: { from: '0x0', to: '0x1' },
    });

    expect(getLayer1GasFee).toHaveBeenCalledWith({
      chainId: '0x1',
      networkClientId: 'mainnet',
      transactionParams: { from: '0x0', to: '0x1' },
    });
    expect(fee).toBe('abcd');
  });

  it('returns the value untouched when there is no 0x prefix', async () => {
    const getLayer1GasFee = jest.fn().mockResolvedValue('abcd');
    (
      Engine.context as unknown as {
        TransactionController: { getLayer1GasFee: jest.Mock };
      }
    ).TransactionController = { getLayer1GasFee };

    const fee = await fetchEstimatedMultiLayerL1Fee(null, {
      txParams: { from: '0x0', to: '0x1' },
    });
    expect(fee).toBe('abcd');
  });
});

describe('deprecatedGetNetworkId', () => {
  it('rejects when no EthQuery is available', async () => {
    (Engine.controllerMessenger as unknown as { call: jest.Mock }).call = jest
      .fn()
      .mockReturnValue(undefined);
    await expect(deprecatedGetNetworkId()).rejects.toThrow(
      'Provider has not been initialized',
    );
  });

  it('resolves the net_version response through convertNetworkId', async () => {
    const sendAsync = jest.fn((_req, cb) => cb(null, 1));
    (Engine.controllerMessenger as unknown as { call: jest.Mock }).call = jest
      .fn()
      .mockReturnValue({ sendAsync });

    await expect(deprecatedGetNetworkId()).resolves.toBe('1');
    expect(sendAsync).toHaveBeenCalledWith(
      { method: 'net_version' },
      expect.any(Function),
    );
  });

  it('rejects with the ethQuery error', async () => {
    const err = new Error('rpc failure');
    const sendAsync = jest.fn((_req, cb) => cb(err));
    (Engine.controllerMessenger as unknown as { call: jest.Mock }).call = jest
      .fn()
      .mockReturnValue({ sendAsync });

    await expect(deprecatedGetNetworkId()).rejects.toBe(err);
  });
});
