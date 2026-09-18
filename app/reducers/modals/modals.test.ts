import modalsReducer from './index';
import {
  toggleNetworkModal,
  toggleCollectibleContractModal,
  toggleDappTransactionModal,
  toggleInfoNetworkModal,
  toggleSignModal,
} from '../../actions/modals';

interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
}

const reduce = (
  state: ModalsState | undefined,
  action: Parameters<typeof modalsReducer>[1],
): ModalsState =>
  modalsReducer(
    state as Parameters<typeof modalsReducer>[0],
    action,
  ) as ModalsState;

const initialState = reduce(undefined, { type: 'UNKNOWN' });

describe('modalsReducer', () => {
  it('returns the initial state', () => {
    expect(initialState).toEqual({
      networkModalVisible: false,
      shouldNetworkSwitchPopToWallet: true,
      collectibleContractModalVisible: false,
      dappTransactionModalVisible: false,
      signMessageModalVisible: true,
    });
  });

  it('toggles the network modal', () => {
    let state = reduce(initialState, toggleNetworkModal(false));
    expect(state.networkModalVisible).toBe(true);
    expect(state.shouldNetworkSwitchPopToWallet).toBe(false);

    state = reduce(state, toggleNetworkModal());
    expect(state.networkModalVisible).toBe(false);
    expect(state.shouldNetworkSwitchPopToWallet).toBe(true);
  });

  it('toggles the collectible contract modal', () => {
    const state = reduce(initialState, toggleCollectibleContractModal());
    expect(state.collectibleContractModalVisible).toBe(true);
  });

  describe('dapp transaction modal', () => {
    it('hides when show is false', () => {
      const state = reduce(
        { ...initialState, dappTransactionModalVisible: true },
        toggleDappTransactionModal(false),
      );
      expect(state.dappTransactionModalVisible).toBe(false);
    });

    it('toggles when show is null', () => {
      const state = reduce(
        initialState,
        toggleDappTransactionModal(null),
      );
      expect(state.dappTransactionModalVisible).toBe(true);
    });

    it('sets to the given value when show is true', () => {
      const state = reduce(
        initialState,
        toggleDappTransactionModal(true),
      );
      expect(state.dappTransactionModalVisible).toBe(true);
    });
  });

  describe('info network modal', () => {
    it('hides when show is false', () => {
      const state = reduce(
        { ...initialState, infoNetworkModalVisible: true },
        toggleInfoNetworkModal(false),
      );
      expect(state.infoNetworkModalVisible).toBe(false);
    });

    it('toggles otherwise', () => {
      const state = reduce(initialState, toggleInfoNetworkModal());
      expect(state.infoNetworkModalVisible).toBe(true);
    });
  });

  describe('sign modal', () => {
    it('hides when show is false', () => {
      const state = reduce(initialState, toggleSignModal(false));
      expect(state.signMessageModalVisible).toBe(false);
    });

    it('toggles otherwise', () => {
      const state = reduce(initialState, toggleSignModal());
      expect(state.signMessageModalVisible).toBe(false);
      expect(reduce(state, toggleSignModal()).signMessageModalVisible).toBe(
        true,
      );
    });
  });
});
