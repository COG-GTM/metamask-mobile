import {
  toggleNetworkModal,
  toggleCollectibleContractModal,
  toggleDappTransactionModal,
  toggleInfoNetworkModal,
  toggleSignModal,
} from '.';

describe('Modals Actions', () => {
  it('toggleNetworkModal should return correct action with default', () => {
    expect(toggleNetworkModal()).toStrictEqual({
      type: 'TOGGLE_NETWORK_MODAL',
      shouldNetworkSwitchPopToWallet: true,
    });
  });

  it('toggleNetworkModal should accept custom value', () => {
    expect(toggleNetworkModal(false)).toStrictEqual({
      type: 'TOGGLE_NETWORK_MODAL',
      shouldNetworkSwitchPopToWallet: false,
    });
  });

  it('toggleCollectibleContractModal should return correct action', () => {
    expect(toggleCollectibleContractModal()).toStrictEqual({
      type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
    });
  });

  it('toggleDappTransactionModal should return correct action', () => {
    expect(toggleDappTransactionModal(true)).toStrictEqual({
      type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
      show: true,
    });
  });

  it('toggleInfoNetworkModal should return correct action', () => {
    expect(toggleInfoNetworkModal(true)).toStrictEqual({
      type: 'TOGGLE_INFO_NETWORK_MODAL',
      show: true,
    });
  });

  it('toggleSignModal should return correct action', () => {
    expect(toggleSignModal(false)).toStrictEqual({
      type: 'TOGGLE_SIGN_MODAL',
      show: false,
    });
  });
});
