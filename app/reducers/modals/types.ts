/**
 * Asset object for receive modal
 */
export interface ReceiveAsset {
  symbol?: string;
  address?: string;
  decimals?: number;
  image?: string;
  name?: string;
  isETH?: boolean;
}

/**
 * Modals state interface
 */
export interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
  receiveAsset?: ReceiveAsset;
  receiveModalVisible?: boolean;
}
