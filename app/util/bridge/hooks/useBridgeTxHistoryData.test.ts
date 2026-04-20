import { renderHook } from '@testing-library/react-hooks';
import {
  FINAL_NON_CONFIRMED_STATUSES,
  useBridgeTxHistoryData,
} from './useBridgeTxHistoryData';

const mockedSelectBridgeHistoryForAccount = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (sel: (state: unknown) => unknown) => sel({}),
}));

jest.mock('../../../selectors/bridgeStatusController', () => ({
  selectBridgeHistoryForAccount: (state: unknown) =>
    mockedSelectBridgeHistoryForAccount(state),
}));

describe('useBridgeTxHistoryData', () => {
  beforeEach(() => {
    mockedSelectBridgeHistoryForAccount.mockReset();
  });

  it('exposes FINAL_NON_CONFIRMED_STATUSES constant', () => {
    expect(FINAL_NON_CONFIRMED_STATUSES).toEqual(
      expect.arrayContaining(['failed', 'dropped', 'rejected']),
    );
  });

  it('returns undefined history and null completion when no tx is provided', () => {
    mockedSelectBridgeHistoryForAccount.mockReturnValue({});
    const { result } = renderHook(() => useBridgeTxHistoryData({}));
    expect(result.current).toEqual({
      bridgeTxHistoryItem: undefined,
      isBridgeComplete: null,
    });
  });

  it('looks up the bridge history item by EVM tx id and marks complete', () => {
    const item = {
      status: {
        srcChain: { txHash: '0xsrc' },
        destChain: { txHash: '0xdest' },
      },
    };
    mockedSelectBridgeHistoryForAccount.mockReturnValue({ 'tx-1': item });

    const { result } = renderHook(() =>
      useBridgeTxHistoryData({
        // Only the `id` field is read from the tx meta.
        evmTxMeta: { id: 'tx-1' } as unknown as import('@metamask/transaction-controller').TransactionMeta,
      }),
    );

    expect(result.current.bridgeTxHistoryItem).toBe(item);
    expect(result.current.isBridgeComplete).toBe(true);
  });

  it('finds the bridge history item by multichain tx hash and marks incomplete without dest hash', () => {
    const item = {
      status: {
        srcChain: { txHash: '0xsrc' },
        destChain: undefined,
      },
    };
    mockedSelectBridgeHistoryForAccount.mockReturnValue({ k: item });

    const { result } = renderHook(() =>
      useBridgeTxHistoryData({
        multiChainTx: { id: '0xsrc' } as unknown as import('@metamask/keyring-api').Transaction,
      }),
    );

    expect(result.current.bridgeTxHistoryItem).toBe(item);
    expect(result.current.isBridgeComplete).toBe(false);
  });
});
