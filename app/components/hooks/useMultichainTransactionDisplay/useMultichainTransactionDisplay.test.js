import { renderHook } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/keyring-api';
import { useMultichainTransactionDisplay } from '../useMultichainTransactionDisplay';

jest.mock('../../../../locales/i18n', () => ({
  locale: 'en-US'
}));

jest.mock('../../../util/assets', () => ({
  formatWithThreshold: (amount, threshold) => {
    if (amount === 0) return '0';
    if (amount < threshold) return `<${threshold}`;
    return amount.toString();
  }
}));

describe('useMultichainTransactionDisplay', () => {
  const userAddress = '5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CerVnZgX37D';

  const createMockFungibleAsset = (amount, symbol = 'SOL') => ({
    amount,
    symbol,
    type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:slip44:501',
    unit: symbol,
    fungible: true
  });

  const createMockNonFungibleAsset = () => ({
    id: 'solana:123',
    fungible: false
  });

  const createMockFromToEntry = (
  address,
  amount,
  isFungible = true) => (
  {
    address,
    asset:
    amount === null ?
    null :
    isFungible ?
    createMockFungibleAsset(amount) :
    createMockNonFungibleAsset()
  });

  const createMockFee = (type, amount) => ({
    type,
    asset: createMockFungibleAsset(amount)
  });

  const createBaseMockTransaction = (type) => ({
    id: 'some-id',
    type,
    chain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    account: 'account1',
    status: 'confirmed',
    timestamp: 1742040000,
    events: [],
    from: [],
    to: [],
    fees: []
  });

  describe('TransactionType - Send', () => {
    it('should handle Send transaction when user is the sender', () => {
      const mockTransaction = {
        ...createBaseMockTransaction(TransactionType.Send),
        from: [createMockFromToEntry(userAddress, '1.0')],
        to: [
        createMockFromToEntry(
          '3GbLAVPjoCWvNvpxJTeBZ1fRNVJF7pZfC3qeFkiZTJ2C',
          '1.0'
        )],

        fees: [createMockFee('base', '0.000005')]
      };

      const { result } = renderHook(() =>
      useMultichainTransactionDisplay({
        transaction: mockTransaction,
        userAddress
      })
      );

      expect(result.current.from).toEqual(mockTransaction.from[0]);
      expect(result.current.to).toEqual(mockTransaction.to[0]);
      expect(result.current.asset?.amount).toContain('-');
    });

    it('should handle Send transaction when user is not the sender', () => {
      const mockTransaction = {
        ...createBaseMockTransaction(TransactionType.Send),
        from: [
        createMockFromToEntry(
          'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq',
          '1.0'
        )],

        to: [
        createMockFromToEntry(
          '3GbLAVPjoCWvNvpxJTeBZ1fRNVJF7pZfC3qeFkiZTJ2C',
          '1.0'
        )],

        fees: [createMockFee('base', '0.000005')]
      };

      const { result } = renderHook(() =>
      useMultichainTransactionDisplay({
        transaction: mockTransaction,
        userAddress
      })
      );

      expect(result.current.from).toEqual(mockTransaction.from[0]);
      expect(result.current.to).toEqual(mockTransaction.to[0]);
      expect(result.current.asset?.amount).toContain('-');
    });
  });

  describe('TransactionType - Receive', () => {
    it('should handle Receive transaction when user is the recipient', () => {
      const mockTransaction = {
        ...createBaseMockTransaction(TransactionType.Receive),
        from: [
        createMockFromToEntry(
          'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq',
          '1.0'
        )],

        to: [createMockFromToEntry(userAddress, '1.0')],
        fees: [createMockFee('base', '0.000005')]
      };

      const { result } = renderHook(() =>
      useMultichainTransactionDisplay({
        transaction: mockTransaction,
        userAddress
      })
      );

      expect(result.current.from).toEqual(mockTransaction.from[0]);
      expect(result.current.to).toEqual(mockTransaction.to[0]);
      expect(result.current.asset?.amount).not.toContain('-');
    });
  });

  describe('TransactionType - Swap', () => {
    it('should handle Swap transaction', () => {
      const mockTransaction = {
        ...createBaseMockTransaction(TransactionType.Swap),
        from: [createMockFromToEntry(userAddress, '1.0')],
        to: [createMockFromToEntry(userAddress, '42.5')],
        fees: [
        createMockFee('base', '0.000005'),
        createMockFee('priority', '0.000001')]

      };

      const { result } = renderHook(() =>
      useMultichainTransactionDisplay({
        transaction: mockTransaction,
        userAddress
      })
      );

      expect(result.current.from).toEqual(mockTransaction.from[0]);
      expect(result.current.to).toEqual(mockTransaction.to[0]);
      expect(result.current.asset?.amount).toContain('-');
      expect(result.current.baseFee).toBeTruthy();
      expect(result.current.priorityFee).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle transaction with empty from and to arrays', () => {
      const mockTransaction = {
        ...createBaseMockTransaction(TransactionType.Send),
        fees: [createMockFee('base', '0.000005')]
      };

      const { result } = renderHook(() =>
      useMultichainTransactionDisplay({
        transaction: mockTransaction,
        userAddress
      })
      );

      expect(result.current.from).toBeNull();
      expect(result.current.to).toBeNull();
      expect(result.current.asset).toBeNull();
    });

    it('should handle transaction with non-fungible assets', () => {
      const mockTransaction = {
        ...createBaseMockTransaction(TransactionType.Send),
        from: [createMockFromToEntry(userAddress, '1.0', false)],
        to: [
        createMockFromToEntry(
          '3GbLAVPjoCWvNvpxJTeBZ1fRNVJF7pZfC3qeFkiZTJ2C',
          '1.0'
        )],

        fees: [createMockFee('base', '0.000005')]
      };

      const { result } = renderHook(() =>
      useMultichainTransactionDisplay({
        transaction: mockTransaction,
        userAddress
      })
      );

      expect(result.current.asset).toBeNull();
    });

    it('should handle transactions with null asset values', () => {
      const mockTransaction = {
        ...createBaseMockTransaction(TransactionType.Send),
        from: [createMockFromToEntry(userAddress, null)],
        to: [
        createMockFromToEntry(
          '3GbLAVPjoCWvNvpxJTeBZ1fRNVJF7pZfC3qeFkiZTJ2C',
          null
        )],

        fees: [createMockFee('base', '0.000005')]
      };

      const { result } = renderHook(() =>
      useMultichainTransactionDisplay({
        transaction: mockTransaction,
        userAddress
      })
      );

      expect(result.current.asset).toBeNull();
    });

    it('should handle transactions with multiple fees', () => {
      const mockTransaction = {
        ...createBaseMockTransaction(TransactionType.Send),
        from: [createMockFromToEntry(userAddress, '1.0')],
        to: [
        createMockFromToEntry(
          '3GbLAVPjoCWvNvpxJTeBZ1fRNVJF7pZfC3qeFkiZTJ2C',
          '1.0'
        )],

        fees: [
        createMockFee('base', '0.000005'),
        createMockFee('priority', '0.000001'),
        createMockFee('base', '0.00001')]

      };

      const { result } = renderHook(() =>
      useMultichainTransactionDisplay({
        transaction: mockTransaction,
        userAddress
      })
      );

      expect(result.current.baseFee).toBeTruthy();
      expect(result.current.priorityFee).toBeTruthy();
      expect(result.current.baseFee?.amount).not.toContain('0.00001');
    });
  });
});