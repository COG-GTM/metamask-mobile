import modalsReducer, { initialState } from '.';
import {
  toggleNetworkModal,
  toggleCollectibleContractModal,
  toggleDappTransactionModal,
  toggleInfoNetworkModal,
  toggleSignModal,
} from '../../actions/modals';

describe('modalsReducer', () => {
  it('returns the initial state by default', () => {
    expect(modalsReducer(undefined, { type: 'UNKNOWN' } as never)).toEqual(
      initialState,
    );
  });

  it('handles TOGGLE_NETWORK_MODAL', () => {
    const state = modalsReducer(initialState, toggleNetworkModal(false));
    expect(state.networkModalVisible).toBe(true);
    expect(state.shouldNetworkSwitchPopToWallet).toBe(false);
  });

  it('handles TOGGLE_COLLECTIBLE_CONTRACT_MODAL', () => {
    const state = modalsReducer(
      initialState,
      toggleCollectibleContractModal(),
    );
    expect(state.collectibleContractModalVisible).toBe(true);
  });

  it('handles TOGGLE_DAPP_TRANSACTION_MODAL with explicit show', () => {
    expect(
      modalsReducer(initialState, toggleDappTransactionModal(true))
        .dappTransactionModalVisible,
    ).toBe(true);
    expect(
      modalsReducer(initialState, toggleDappTransactionModal(false))
        .dappTransactionModalVisible,
    ).toBe(false);
  });

  it('toggles TOGGLE_DAPP_TRANSACTION_MODAL when called without arg', () => {
    const visibleState = { ...initialState, dappTransactionModalVisible: true };
    expect(
      modalsReducer(visibleState, toggleDappTransactionModal())
        .dappTransactionModalVisible,
    ).toBe(false);
  });

  it('handles TOGGLE_INFO_NETWORK_MODAL', () => {
    expect(
      modalsReducer(initialState, toggleInfoNetworkModal(true))
        .infoNetworkModalVisible,
    ).toBe(true);
  });

  it('handles TOGGLE_SIGN_MODAL', () => {
    expect(
      modalsReducer(initialState, toggleSignModal(false))
        .signMessageModalVisible,
    ).toBe(false);
  });
});
