import transactionReducer, { TransactionState } from './index';
import type { TransactionAction } from '../../actions/transaction';

const emptyAction = { type: null } as unknown as TransactionAction;

describe('transactionReducer', () => {
  it('should return initial state', () => {
    const initialState: TransactionState = {
      ensRecipient: undefined,
      assetType: undefined,
      selectedAsset: {},
      transaction: {
        data: undefined,
        from: undefined,
        gas: undefined,
        gasPrice: undefined,
        to: undefined,
        value: undefined,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
      },
      warningGasPriceHigh: undefined,
      transactionTo: undefined,
      transactionToName: undefined,
      transactionFromName: undefined,
      transactionValue: undefined,
      symbol: undefined,
      paymentRequest: undefined,
      readableValue: undefined,
      id: undefined,
      type: undefined,
      proposedNonce: undefined,
      nonce: undefined,
      securityAlertResponses: {},
      useMax: false,
    };
    expect(transactionReducer(undefined, emptyAction)).toEqual(initialState);
  });
});
