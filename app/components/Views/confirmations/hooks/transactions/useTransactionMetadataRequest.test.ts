import { merge } from 'lodash';

import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';
import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import Engine from '../../../../../core/Engine';
import {
  personalSignatureConfirmationState,
  stakingDepositConfirmationState,
} from '../../../../../util/test/confirm-data-helpers';

jest.mock('../../../../../core/Engine', () => ({
  context: {
    TokenListController: {
      fetchTokenList: jest.fn(),
    },
  },
}));

const fetchTokenListMock = jest.mocked(
  Engine.context.TokenListController.fetchTokenList,
);

const stakingChainId =
  stakingDepositConfirmationState.engine.backgroundState.TransactionController
    .transactions[0].chainId;

function useMultipleInstances() {
  useTransactionMetadataRequest();
  useTransactionMetadataRequest();
  return useTransactionMetadataRequest();
}

function stateWithTransaction(chainId: string, id?: string) {
  return merge({}, stakingDepositConfirmationState, {
    engine: {
      backgroundState: {
        TransactionController: {
          transactions: [
            {
              ...stakingDepositConfirmationState.engine.backgroundState
                .TransactionController.transactions[0],
              chainId,
              ...(id ? { id } : {}),
            },
          ],
        },
      },
    },
  });
}

describe('useTransactionMetadataRequest', () => {
  beforeEach(() => {
    fetchTokenListMock.mockClear();
  });

  it('returns transaction metadata', () => {
    const { result } = renderHookWithProvider(useTransactionMetadataRequest, {
      state: stakingDepositConfirmationState,
    });

    expect(result.current).toEqual(
      stakingDepositConfirmationState.engine.backgroundState
        .TransactionController.transactions[0],
    );
  });

  it('returns undefined when approval type is not Transaction', () => {
    const { result } = renderHookWithProvider(useTransactionMetadataRequest, {
      state: personalSignatureConfirmationState,
    });

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when transaction metadata is not found', () => {
    const state = merge(personalSignatureConfirmationState, {
      engine: {
        backgroundState: {
          TransactionController: {
            transactions: [],
          },
        },
      },
    });

    const { result } = renderHookWithProvider(useTransactionMetadataRequest, {
      state,
    });

    expect(result.current).toBeUndefined();
  });

  it('fetches the token list for the chainId of the transaction', () => {
    const spyOnFetchTokenList = jest.spyOn(
      Engine.context.TokenListController,
      'fetchTokenList',
    );

    renderHookWithProvider(useTransactionMetadataRequest, {
      state: stakingDepositConfirmationState,
    });

    expect(spyOnFetchTokenList).toHaveBeenCalledWith(
      stakingDepositConfirmationState.engine.backgroundState
        .TransactionController.transactions[0].chainId,
    );
  });

  it('fetches the token list once when many instances mount for the same chainId', () => {
    const first = renderHookWithProvider(useMultipleInstances, {
      state: stakingDepositConfirmationState,
    });
    const second = renderHookWithProvider(useTransactionMetadataRequest, {
      state: stakingDepositConfirmationState,
    });

    expect(fetchTokenListMock).toHaveBeenCalledTimes(1);
    expect(fetchTokenListMock).toHaveBeenCalledWith(stakingChainId);

    first.unmount();
    second.unmount();
  });

  it('fetches the token list again once all instances unmount and a new confirmation mounts', () => {
    const first = renderHookWithProvider(useMultipleInstances, {
      state: stakingDepositConfirmationState,
    });
    const second = renderHookWithProvider(useTransactionMetadataRequest, {
      state: stakingDepositConfirmationState,
    });

    first.unmount();
    expect(fetchTokenListMock).toHaveBeenCalledTimes(1);

    const third = renderHookWithProvider(useTransactionMetadataRequest, {
      state: stakingDepositConfirmationState,
    });
    expect(fetchTokenListMock).toHaveBeenCalledTimes(1);

    second.unmount();
    third.unmount();

    const next = renderHookWithProvider(useMultipleInstances, {
      state: stakingDepositConfirmationState,
    });
    expect(fetchTokenListMock).toHaveBeenCalledTimes(2);

    next.unmount();
  });

  it('fetches the token list once per distinct chainId', () => {
    const mainnet = renderHookWithProvider(useMultipleInstances, {
      state: stateWithTransaction('0x1'),
    });
    const sepolia = renderHookWithProvider(useMultipleInstances, {
      state: stateWithTransaction('0xaa36a7'),
    });

    expect(fetchTokenListMock).toHaveBeenCalledTimes(2);
    expect(fetchTokenListMock).toHaveBeenNthCalledWith(1, '0x1');
    expect(fetchTokenListMock).toHaveBeenNthCalledWith(2, '0xaa36a7');

    mainnet.unmount();
    sepolia.unmount();
  });

  it('does not fetch the token list when there is no transaction', () => {
    const { unmount } = renderHookWithProvider(useMultipleInstances, {
      state: personalSignatureConfirmationState,
    });

    expect(fetchTokenListMock).not.toHaveBeenCalled();

    unmount();
  });

  it('fetches the token list for the next queued transaction on the same chainId', () => {
    const persistentInstance = renderHookWithProvider(
      useTransactionMetadataRequest,
      { state: stakingDepositConfirmationState },
    );

    const baseState = stateWithTransaction(
      stakingChainId,
      'next-transaction-id',
    );
    const [currentApproval] = Object.values(
      baseState.engine.backgroundState.ApprovalController.pendingApprovals,
    );
    const nextTransactionState = {
      ...baseState,
      engine: {
        ...baseState.engine,
        backgroundState: {
          ...baseState.engine.backgroundState,
          ApprovalController: {
            ...baseState.engine.backgroundState.ApprovalController,
            pendingApprovals: {
              'next-transaction-id': {
                ...currentApproval,
                id: 'next-transaction-id',
              },
            },
          },
        },
      },
    };

    const nextConfirmation = renderHookWithProvider(useMultipleInstances, {
      state: nextTransactionState,
    });

    expect(nextConfirmation.result.current?.id).toBe('next-transaction-id');
    expect(fetchTokenListMock).toHaveBeenCalledTimes(2);
    expect(fetchTokenListMock).toHaveBeenNthCalledWith(2, stakingChainId);

    persistentInstance.unmount();
    nextConfirmation.unmount();
  });
});
