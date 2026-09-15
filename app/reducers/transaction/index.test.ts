import reducer, { initialState } from './index';
import {
  setTransactionId,
  type TransactionAction,
} from '../../actions/transaction';

describe('transactionReducer', () => {
  it('returns initial state for an unknown action', () => {
    expect(
      reducer(undefined, { type: 'UNKNOWN' } as unknown as TransactionAction),
    ).toEqual(initialState);
  });

  it('sets the transaction id', () => {
    expect(reducer(undefined, setTransactionId('transaction-id'))).toEqual({
      ...initialState,
      id: 'transaction-id',
    });
  });
});
