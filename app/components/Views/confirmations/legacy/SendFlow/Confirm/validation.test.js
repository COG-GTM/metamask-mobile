import BN from 'bnjs4';
import { validateSufficientBalance, validateSufficientTokenBalance } from './validation';
import { renderFromWei, hexToBN } from '../../../../../../util/number';
import {
  getTicker,
  decodeTransferData } from
'../../../../../../util/transactions';
import { strings } from '../../../../../../../locales/i18n';

jest.mock('../../../../../../util/number', () => ({
  renderFromWei: jest.fn(),
  hexToBN: jest.fn()
}));

jest.mock('../../../../../../util/transactions', () => ({
  getTicker: jest.fn(),
  decodeTransferData: jest.fn()
}));

jest.mock('../../../../../../../locales/i18n', () => ({
  strings: jest.fn()
}));

describe('validateSufficientBalance', () => {
  it('returns an error message if weiBalance is less than totalTransactionValue', () => {
    const weiBalance = '0x3e8'; // 1000 in hex
    const totalTransactionValue = '0x7d0'; // 2000 in hex
    const ticker = 'TOKEN';

    hexToBN.mockImplementation((value) => new BN(value));
    renderFromWei.mockReturnValue('1');
    getTicker.mockReturnValue('TOKEN');
    strings.mockReturnValue('Insufficient amount');

    const result = validateSufficientBalance(
      weiBalance,
      totalTransactionValue,
      ticker
    );

    expect(result).toBe('Insufficient amount');
    expect(hexToBN).toHaveBeenCalledWith(weiBalance);
    expect(hexToBN).toHaveBeenCalledWith(totalTransactionValue);
    expect(renderFromWei).toHaveBeenCalled();
    expect(getTicker).toHaveBeenCalledWith(ticker);
    expect(strings).toHaveBeenCalledWith('transaction.insufficient_amount', {
      amount: '1',
      tokenSymbol: 'TOKEN'
    });
  });

  it('returns undefined if weiBalance is sufficient', () => {
    const weiBalance = '0x7d0'; // 2000 in hex
    const totalTransactionValue = '0x3e8'; // 1000 in hex
    const ticker = 'TOKEN';

    hexToBN.mockImplementation((value) => new BN(value));

    const result = validateSufficientBalance(
      weiBalance,
      totalTransactionValue,
      ticker
    );

    expect(result).toBeUndefined();
    expect(hexToBN).toHaveBeenCalledWith(weiBalance);
    expect(hexToBN).toHaveBeenCalledWith(totalTransactionValue);
  });
});

describe('validateSufficientTokenBalance', () => {
  it('returns an error message if tokenBalance is less than weiInput', () => {
    const transaction = { data: '0x' };
    const contractBalances = { '0x123': '1000' };
    const selectedAsset = { address: '0x123', decimals: '18', symbol: 'TOKEN' };

    decodeTransferData.mockReturnValue([null, null, '5000']);
    hexToBN.mockImplementation((value) => new BN(value));
    strings.mockReturnValue('Insufficient tokens');

    const result = validateSufficientTokenBalance(
      transaction,
      contractBalances,
      selectedAsset
    );

    expect(result).toBe('Insufficient tokens');
    expect(decodeTransferData).toHaveBeenCalledWith(
      'transfer',
      transaction.data
    );
    expect(hexToBN).toHaveBeenCalledWith('5000');
    expect(strings).toHaveBeenCalledWith('transaction.insufficient_tokens', {
      token: 'TOKEN'
    });
  });

  it('returns undefined if tokenBalance is sufficient', () => {
    const transaction = { data: '0x' };
    const contractBalances = { '0x123': '5000' };
    const selectedAsset = { address: '0x123', decimals: '18', symbol: 'TOKEN' };

    decodeTransferData.mockReturnValue([null, null, '1000']);
    hexToBN.mockImplementation((value) => new BN(value));

    const result = validateSufficientTokenBalance(
      transaction,
      contractBalances,
      selectedAsset
    );

    expect(result).toBeUndefined();
  });
});