import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { GasEstimateType } from '@metamask/gas-fee-controller';
import { TransactionParams } from '@metamask/transaction-controller';
import { GasTransactionProps } from '../../../../../../core/GasPolling/types';

export interface SelectedAsset {
  address: string;
  decimals: number;
  symbol: string;
  name?: string;
  image?: string;
  tokenId?: string;
  isETH?: boolean;
}

export interface TransactionState {
  selectedAsset: SelectedAsset;
  assetType: string;
  ensRecipient?: string;
  transaction: {
    data?: string;
    from?: string;
    gas?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce?: string;
    proposedNonce?: string;
    to?: string;
    value?: string;
  };
  transactionFromName?: string;
  transactionTo?: string;
  transactionToName?: string;
  transactionValue?: string;
  type?: string;
  warningGasPriceHigh?: string;
  readableValue?: string;
  id?: string;
}

export interface TransactionMeta {
  id: string;
  error?: Error;
  status?: string;
  txParams?: TransactionParams;
}

export interface EIP1559GasTransaction extends GasTransactionProps {
  totalMaxHex: string;
  gasFeeMaxHex: string;
}

export interface LegacyGasTransaction extends GasTransactionProps {
  gasFeeMaxHex: string;
}

export interface ConfirmProps {
  accounts: Record<string, { balance: string; name?: string }>;
  chainId: string;
  contractBalances: Record<string, string>;
  contractExchangeRates: Record<string, { price?: number }>;
  conversionRate: number;
  currentCurrency: string;
  gasFeeEstimates: Record<string, unknown>;
  gasEstimateType: string;
  globalNetworkClientId: string;
  isPaymentRequest: boolean;
  maxValueMode: boolean;
  navigation: NavigationProp<any>;
  networkClientId: string;
  prepareTransaction: (transaction: any) => void;
  providerType: string;
  resetTransaction: () => void;
  setNonce: (nonce: string) => void;
  setProposedNonce: (nonce: string) => void;
  setTransactionId: (id: string) => void;
  setTransactionValue: (value: string) => void;
  shouldUseSmartTransaction: boolean;
  showAlert: (alert: { isVisible: boolean; autodismiss?: number; content: string; data?: any }) => void;
  showCustomNonce: boolean;
  ticker: string;
  transaction: any;
  transactionMetadata: {
    simulationData?: {
      isUpdatedAfterSecurityCheck?: boolean;
    };
  };
  transactionState: TransactionState;
  updateConfirmationMetric: (params: { id: string; params: any }) => void;
  metrics: {
    trackEvent: (event: any) => void;
    createEventBuilder: (event: string) => {
      addProperties: (properties: any) => {
        build: () => any;
      };
      build: () => any;
    };
  };
  selectedAsset: SelectedAsset;
  primaryCurrency: string;
  showHexData: boolean;
  isNativeTokenBuySupported: boolean;
  confirmationMetricsById: Record<string, any>;
  securityAlertResponse: any;
  route: any;
  removeFavoriteCollectible: (selectedAddress: string, chainId: string, collectible: any) => void;
}

export interface ConfirmState {
  gasSelected: string;
  stopUpdateGas: boolean;
  gasEstimationReady: boolean;
  fromSelectedAddress: string;
  transactionValue?: string;
  transactionValueFiat?: string;
  errorMessage?: string;
  mode: string;
  advancedGasInserted: boolean;
  EIP1559GasTransaction: any;
  EIP1559GasObject: any;
  legacyGasObject: any;
  legacyGasTransaction: any;
  multiLayerL1FeeTotal: string;
  ready: boolean;
  transactionMeta: { id: string };
  result: any;
  hexDataModalVisible: boolean;
  warningGasPriceHigh?: string;
  isChangeInSimulationModalShown: boolean;
  hasHandledFirstGasUpdate: boolean;
  pollToken?: any;
  transactionConfirmed?: boolean;
  isAnimating?: boolean;
  animateOnChange?: boolean;
  closeModal?: boolean;
}

export interface ValidationParams {
  transaction: TransactionParams;
}

export interface GasParams {
  transactionId: string;
  isEIP1559Transaction: boolean;
  EIP1559GasTransaction: EIP1559GasTransaction;
  legacyGasTransaction: LegacyGasTransaction;
  accountBalance: string;
  setTransactionValue: (value: string) => void;
}
