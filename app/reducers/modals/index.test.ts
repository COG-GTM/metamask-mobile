import modalsReducer, { ModalsState } from './index';
import type { ModalsAction } from '../../actions/modals';

const emptyAction = { type: null } as unknown as ModalsAction;

describe('modalsReducer', () => {
  it('should return initial state', () => {
    const initialState: ModalsState = {
      networkModalVisible: false,
      shouldNetworkSwitchPopToWallet: true,
      collectibleContractModalVisible: false,
      dappTransactionModalVisible: false,
      signMessageModalVisible: true,
    };
    expect(modalsReducer(undefined, emptyAction)).toEqual(initialState);
  });
});
