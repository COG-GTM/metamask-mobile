import {
  toggleNetworkModal,
  toggleCollectibleContractModal,
  toggleDappTransactionModal,
  toggleInfoNetworkModal,
  toggleSignModal,
} from './';

describe('Modal Actions', () => {
  describe('toggleNetworkModal', () => {
    it('returns TOGGLE_NETWORK_MODAL with default shouldNetworkSwitchPopToWallet', () => {
      expect(toggleNetworkModal()).toEqual({
        type: 'TOGGLE_NETWORK_MODAL',
        shouldNetworkSwitchPopToWallet: true,
      });
    });

    it('returns TOGGLE_NETWORK_MODAL with shouldNetworkSwitchPopToWallet false', () => {
      expect(toggleNetworkModal(false)).toEqual({
        type: 'TOGGLE_NETWORK_MODAL',
        shouldNetworkSwitchPopToWallet: false,
      });
    });
  });

  describe('toggleCollectibleContractModal', () => {
    it('returns TOGGLE_COLLECTIBLE_CONTRACT_MODAL action', () => {
      expect(toggleCollectibleContractModal()).toEqual({
        type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
      });
    });
  });

  describe('toggleDappTransactionModal', () => {
    it('returns TOGGLE_DAPP_TRANSACTION_MODAL with show=true', () => {
      expect(toggleDappTransactionModal(true)).toEqual({
        type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
        show: true,
      });
    });

    it('returns TOGGLE_DAPP_TRANSACTION_MODAL with show=false', () => {
      expect(toggleDappTransactionModal(false)).toEqual({
        type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
        show: false,
      });
    });
  });

  describe('toggleInfoNetworkModal', () => {
    it('returns TOGGLE_INFO_NETWORK_MODAL with show=true', () => {
      expect(toggleInfoNetworkModal(true)).toEqual({
        type: 'TOGGLE_INFO_NETWORK_MODAL',
        show: true,
      });
    });

    it('returns TOGGLE_INFO_NETWORK_MODAL with show=false', () => {
      expect(toggleInfoNetworkModal(false)).toEqual({
        type: 'TOGGLE_INFO_NETWORK_MODAL',
        show: false,
      });
    });
  });

  describe('toggleSignModal', () => {
    it('returns TOGGLE_SIGN_MODAL with show=true', () => {
      expect(toggleSignModal(true)).toEqual({
        type: 'TOGGLE_SIGN_MODAL',
        show: true,
      });
    });

    it('returns TOGGLE_SIGN_MODAL with show=false', () => {
      expect(toggleSignModal(false)).toEqual({
        type: 'TOGGLE_SIGN_MODAL',
        show: false,
      });
    });
  });
});
