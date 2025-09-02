import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { connect, useSelector } from 'react-redux';
import { ethers } from 'ethers';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const abi: any = require('human-standard-token-abi');
import { setEtherTransaction, setTransactionObject } from '../../../actions/transaction';
import { swapsUtils } from '@metamask/swaps-controller';
import { selectProviderType } from '../../../selectors/networkController';
import {
  selectSelectedInternalAccountFormattedAddress,
} from '../../../selectors/accountsController';
import { selectTokens } from '../../../selectors/tokensController';
import { selectShouldUseSmartTransaction } from '../../../selectors/smartTransactionsController';
import { selectEvmChainId } from '../../../selectors/networkController';
import { useMetrics } from '../../../components/hooks/useMetrics';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { Token } from '@metamask/assets-controllers';
import { RootState } from '../../../reducers';
import Engine from '../../../core/Engine';
import { strings } from '../../../../locales/i18n';
import { WALLET_CONNECT_ORIGIN } from '../../../util/walletconnect';
import { getAddressAccountType } from '../../../util/address';
import { toLowerCaseEquals } from '../../../util/general';
import { TransactionMeta as BaseTransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';

import TransactionTypes from '../../../core/TransactionTypes';
import WalletConnectApproval from '../../Approvals/WalletConnectApproval';
import AccountApproval from '../../UI/AccountApproval';
import { TransactionApproval } from '../../Approvals/TransactionApproval';
import PersonalSign from '../../Views/confirmations/legacy/components/PersonalSign';
import TypedSign from '../../Views/confirmations/legacy/components/TypedSign';
import WatchAssetRequest from '../../Views/confirmations/legacy/components/WatchAssetRequest';
import ApprovalModal from '../../Approvals/ApprovalModal';
import Approve from '../../../components/Views/confirmations/legacy/Approve';
import WalletConnect from '../../../core/WalletConnect/WalletConnect';
import { ApprovalTypes } from '../../../core/RPCMethods/RPCMethodMiddleware';
import PermissionApproval from '../../Approvals/PermissionApproval';
import InstallSnapApproval from '../../Approvals/InstallSnapApproval';
import ConnectApproval from '../../Approvals/ConnectApproval';


type TransactionMeta = BaseTransactionMeta & {
  transaction?: {
    to?: string;
    from?: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
  };
  transactionReceipt?: {
    gasUsed?: string;
  };
  submittedTime?: number;
  confirmedTime?: number;
  swapsInfo?: {
    isSwap?: boolean;
    hasApproveTx?: boolean;
    gasPrice?: string;
    sourceTokenSymbol?: string;
    sourceTokenAmount?: string;
    destinationTokenSymbol?: string;
    destinationTokenAmount?: string;
    slippage?: number;
    customSlippage?: boolean;
    responseTime?: number;
    topAggId?: string;
    usedQuote?: {
      aggregator?: string;
    };
    savings?: {
      total?: string;
      performance?: string;
      fee?: string;
      medianMetaMaskFee?: string;
    };
    quoteVsExecutionRatio?: number;
    estimatedVsUsedGasRatio?: number;
    approvalTransactionMetaId?: string;
    tokensReceived?: string;
    quoteValue?: string;
  };
  txParams?: {
    to?: string;
    from?: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
    readableValue?: string;
  };
  origin?: string;
};

interface UseSwapConfirmedEventProps {
  trackSwaps: (event: string, transactionMeta: TransactionMeta, swapsTransactions: TransactionMeta[]) => Promise<void>;
}

interface TransactionModalType {
  type: string;
  [key: string]: any;
}

export const useSwapConfirmedEvent = ({ trackSwaps }: UseSwapConfirmedEventProps) => {
  const [transactionMetaIdsForListening, setTransactionMetaIdsForListening] =
    useState<string[]>([]);

  const addTransactionMetaIdForListening = useCallback(
    (transactionMetaId: string) => {
      setTransactionMetaIdsForListening((prevTransactionMetaIds) => [
        ...prevTransactionMetaIds,
        transactionMetaId,
      ]);
    },
    [],
  );

  const removeTransactionMetaIdForListening = useCallback(
    (transactionMetaId: string) => {
      setTransactionMetaIdsForListening((prevTransactionMetaIds) =>
        prevTransactionMetaIds.filter((id) => id !== transactionMetaId),
      );
    },
    [],
  );

  const handleTransactionConfirmed = useCallback(
    async (transactionMeta: TransactionMeta) => {
      if (transactionMetaIdsForListening.includes(transactionMeta.id)) {
        const { TransactionController } = Engine.context;
        const swapsTransactions = TransactionController.state.transactions.filter(
          (transaction: TransactionMeta) => transaction?.swapsInfo?.hasApproveTx || transaction?.swapsInfo?.isSwap,
        );
        await trackSwaps('SWAP_COMPLETED', transactionMeta, swapsTransactions);
        removeTransactionMetaIdForListening(transactionMeta.id);
      }
    },
    [transactionMetaIdsForListening, trackSwaps, removeTransactionMetaIdForListening],
  );

  return {
    transactionMetaIdsForListening,
    addTransactionMetaIdForListening,
    removeTransactionMetaIdForListening,
    handleTransactionConfirmed,
  };
};

interface RootRPCMethodsUIProps {
  navigation: any;
  setEtherTransaction: (transaction: object) => void;
  setTransactionObject: (transaction: object) => void;
  tokens: Token[];
  selectedAddress: string;
  chainId: Hex;
  providerType: string;
  shouldUseSmartTransaction: boolean;
}

const RootRPCMethodsUI = (props: RootRPCMethodsUIProps) => {
  const [transactionModalType, setTransactionModalType] = useState<TransactionModalType | undefined>(undefined);
  const { trackEvent, createEventBuilder } = useMetrics();

  const trackSwaps = useCallback(
    async (event: string, transactionMeta: TransactionMeta, swapsTransactions: TransactionMeta[]) => {
      try {
        const { TransactionController } = Engine.context;
        const fullTx = TransactionController.state.transactions.find(
          (transaction: TransactionMeta) => transaction.id === transactionMeta.id,
        ) as TransactionMeta;
        const gasEstimate = fullTx?.transaction?.gas;
        const gasUsed = fullTx?.transactionReceipt?.gasUsed;
        const submittedTime = fullTx?.submittedTime;
        const confirmedTime = fullTx?.confirmedTime;
        const gasLimitRatio = gasEstimate && gasUsed ? Number(gasUsed) / Number(gasEstimate) : undefined;
        const quoteVsExecutionRatio = fullTx?.swapsInfo?.quoteVsExecutionRatio;
        const estimatedVsUsedGasRatio = fullTx?.swapsInfo?.estimatedVsUsedGasRatio;
        const approvalTransactionMetaId = fullTx?.swapsInfo?.approvalTransactionMetaId;

        let approvalTx: TransactionMeta | undefined;
        if (approvalTransactionMetaId) {
          approvalTx = TransactionController.state.transactions.find(
            (transaction: TransactionMeta) => transaction.id === approvalTransactionMetaId,
          ) as TransactionMeta;
        }

        const tokensReceived = fullTx?.swapsInfo?.tokensReceived;
        const quoteValue = fullTx?.swapsInfo?.quoteValue;
        const approvalGasEstimate = approvalTx?.transaction?.gas;
        const approvalGasUsed = approvalTx?.transactionReceipt?.gasUsed;
        const approvalGasLimitRatio =
          approvalGasEstimate && approvalGasUsed ? Number(approvalGasUsed) / Number(approvalGasEstimate) : undefined;

        const timeToMine = submittedTime && confirmedTime ? confirmedTime - submittedTime : undefined;

        const anonymousEventProperties = {
          token_from: fullTx?.swapsInfo?.sourceTokenSymbol,
          token_from_amount: fullTx?.swapsInfo?.sourceTokenAmount,
          token_to: fullTx?.swapsInfo?.destinationTokenSymbol,
          token_to_amount: tokensReceived || fullTx?.swapsInfo?.destinationTokenAmount,
          request_type: fullTx?.origin,
          slippage: fullTx?.swapsInfo?.slippage,
          custom_slippage: fullTx?.swapsInfo?.customSlippage,
          response_time: fullTx?.swapsInfo?.responseTime,
          best_quote_source: fullTx?.swapsInfo?.topAggId,
          available_quotes: fullTx?.swapsInfo?.usedQuote?.aggregator,
          selected_quote: fullTx?.swapsInfo?.usedQuote?.aggregator,
          suggested_gas_price: fullTx?.swapsInfo?.gasPrice,
          used_gas_price: fullTx?.transaction?.gasPrice,
          average_savings: fullTx?.swapsInfo?.savings?.total,
          performance_savings: fullTx?.swapsInfo?.savings?.performance,
          fee_savings: fullTx?.swapsInfo?.savings?.fee,
          median_metamask_fee: fullTx?.swapsInfo?.savings?.medianMetaMaskFee,
          estimated_gas: gasEstimate,
          used_gas: gasUsed,
          gas_limit_ratio: gasLimitRatio,
          approval_gas_cost_in_eth: approvalTx?.transaction?.value,
          swap_gas_cost_in_eth: fullTx?.transaction?.value,
          approval_gas_estimate: approvalGasEstimate,
          approval_gas_used: approvalGasUsed,
          approval_gas_limit_ratio: approvalGasLimitRatio,
          quote_vs_execution_ratio: quoteVsExecutionRatio,
          estimated_vs_used_gasRatio: estimatedVsUsedGasRatio,
          quote_value: quoteValue,
          time_to_mine: timeToMine,
        };

        const nonAnonymousEventProperties = {
          chain_id: props.chainId,
          is_hardware_wallet: getAddressAccountType(props.selectedAddress) === 'QR',
          address: props.selectedAddress,
          network: props.providerType,
        };

        trackEvent(
          createEventBuilder(MetaMetricsEvents.SWAP_COMPLETED)
            .addProperties(nonAnonymousEventProperties)
            .addSensitiveProperties(anonymousEventProperties)
            .build(),
        );
      } catch (error) {
        console.log(error);
      }
    },
    [props.chainId, props.selectedAddress, props.providerType, trackEvent, createEventBuilder],
  );

  const { addTransactionMetaIdForListening, handleTransactionConfirmed } = useSwapConfirmedEvent({
    trackSwaps,
  });

  const autoSign = useCallback(
    async (transactionMeta: TransactionMeta) => {
      const { KeyringController } = Engine.context;
      try {
        await KeyringController.resetQRKeyringState();
        if (transactionMeta.transaction) {
          await KeyringController.signTransaction(transactionMeta.transaction as any, transactionMeta.transaction.from as string);
        }
      } catch (error) {
        Alert.alert(strings('transactions.transaction_error'), error instanceof Error ? error.message : 'Unknown error', [
          { text: strings('navigation.ok') },
        ]);
      }
    },
    [],
  );

  const onUnapprovedTransaction = useCallback(
    async (transactionMeta: TransactionMeta) => {
      if (transactionMeta.origin === WALLET_CONNECT_ORIGIN) {
        autoSign(transactionMeta);
        return;
      }

      const to = transactionMeta.transaction?.to?.toString().toLowerCase();
      const { selectedAddress, tokens } = props;
      let symbol, decimals;
      const contract = tokens.find((token: Token) => toLowerCaseEquals(token.address, to));
      if (contract) {
        symbol = contract.symbol;
        decimals = contract.decimals;
      } else {
        try {
          const { AssetsContractController } = Engine.context;
          const tokenContract = (AssetsContractController as any).getERC20TokenContract?.(to as Hex);
          symbol = await tokenContract.symbol();
          decimals = await tokenContract.decimals();
        } catch (e) {
        }
      }

      if (symbol && decimals !== undefined) {
        const tokenData = abi.find((item: any) => item.name === 'transfer');
        const transferData = tokenData && transactionMeta.transaction?.data && ethers.utils.defaultAbiCoder.decode(tokenData.inputs, transactionMeta.transaction.data);
        const tokenAmountToTransfer = transferData && transferData[1];
        const renderableTxObject = {
          ...transactionMeta.transaction,
          value: tokenAmountToTransfer,
          readableValue: ethers.utils.formatUnits(tokenAmountToTransfer, decimals),
          to: transferData && transferData[0],
          contractAddress: to,
          symbol,
          decimals,
        };
        props.setTransactionObject(renderableTxObject);
      } else {
        if (transactionMeta.transaction) {
          props.setEtherTransaction(transactionMeta.transaction);
        }
      }

      if (transactionMeta.swapsInfo?.isSwap) {
        addTransactionMetaIdForListening(transactionMeta.id);
      }

      setTransactionModalType(transactionMeta as any);
    },
    [props, autoSign, addTransactionMetaIdForListening],
  );

  const onSignAction = useCallback(() => setTransactionModalType(undefined), []);

  const currentPageInformation = useMemo(() => ({ title: '', url: '' }), []);

  const onWalletConnectSessionApproval = useCallback(() => setTransactionModalType(undefined), []);

  const onAccountChange = useCallback(() => setTransactionModalType(undefined), []);

  const onCancel = useCallback(() => setTransactionModalType(undefined), []);

  const onConfirm = useCallback(() => setTransactionModalType(undefined), []);

  const onSubmit = useCallback(() => setTransactionModalType(undefined), []);

  const secureKeypad = useSelector((state: RootState) => state.settings.useBlockieIcon);

  useEffect(() => {
    (Engine.context.TransactionController as any).hub.on('unapprovedTransaction', onUnapprovedTransaction);
    (Engine.context.TransactionController as any).hub.on('transactionConfirmed', handleTransactionConfirmed);
    (Engine.context as any).MessageManager.hub.on('unapprovedMessage', (messageParams: any) => {
      const { data } = messageParams;
      delete messageParams.data;
      setTransactionModalType({ ...messageParams, message: data });
    });
    (Engine.context as any).PersonalMessageManager.hub.on('unapprovedMessage', (messageParams: any) => {
      const { data } = messageParams;
      delete messageParams.data;
      setTransactionModalType({ ...messageParams, message: data });
    });
    (Engine.context as any).TypedMessageManager.hub.on('unapprovedMessage', (messageParams: any) => {
      setTransactionModalType(messageParams);
    });
    (Engine.context.TokensController as any).hub.on('pendingWatchAsset', () => {
      setTransactionModalType({ type: 'watch_asset_request' });
    });
    (Engine.context.NetworkController as any).hub.on('networkWillChange', () => {
      setTransactionModalType(undefined);
    });
    (Engine.context.NetworkController as any).hub.on('addCustomNetworkRequest', () => {
      setTransactionModalType({ type: 'add_custom_network_request' });
    });
    (Engine.context.NetworkController as any).hub.on('switchCustomNetworkRequest', () => {
      setTransactionModalType({ type: 'switch_custom_network_request' });
    });

    return function cleanup() {
      (Engine.context.TransactionController as any).hub.removeAllListeners();
      (Engine.context as any).MessageManager.hub.removeAllListeners();
      (Engine.context as any).PersonalMessageManager.hub.removeAllListeners();
      (Engine.context as any).TypedMessageManager.hub.removeAllListeners();
      (Engine.context.TokensController as any).hub.removeAllListeners();
      (Engine.context.NetworkController as any).hub.removeAllListeners();
    };
  }, [onUnapprovedTransaction, handleTransactionConfirmed]);

  const renderQRDetails = useCallback(() => {
    if (transactionModalType && (transactionModalType as any).origin === WALLET_CONNECT_ORIGIN) {
      return (
        <WalletConnectApproval
          {...({
            onCancel,
            onConfirm: onWalletConnectSessionApproval,
            currentPageInformation,
            walletConnectRequest: (transactionModalType as any).walletConnectRequest,
          } as any)}
        />
      );
    }
    return (
      <AccountApproval
        onCancel={onCancel}
        onConfirm={onAccountChange}
        currentPageInformation={currentPageInformation}
        navigation={props.navigation}
      />
    );
  }, [transactionModalType, onCancel, onWalletConnectSessionApproval, currentPageInformation, onAccountChange, props.navigation]);

  const renderTransactionApproval = useCallback(() => {
    const {
      selectedAddress,
      chainId,
      tokens,
      providerType,
      shouldUseSmartTransaction,
    } = props;
    return (
      <TransactionApproval
        navigation={props.navigation}
        onCancel={onCancel}
        onConfirm={onConfirm}
        currentPageInformation={currentPageInformation}
        transactionMeta={transactionModalType as TransactionMeta}
        keyringType={''}
        selectedAddress={selectedAddress}
        chainId={chainId}
        tokens={tokens}
        providerType={providerType}
        shouldUseSmartTransaction={shouldUseSmartTransaction}
        secureKeypad={secureKeypad}
      />
    );
  }, [props, transactionModalType, onCancel, onConfirm, currentPageInformation, secureKeypad]);

  const renderApproval = useCallback(() => (
    <Approve currentPageInformation={currentPageInformation} navigation={props.navigation} />
  ), [currentPageInformation, props.navigation]);

  if (transactionModalType) {
    return (
      <ApprovalModal
        {...({
          isVisible: true,
          onCancel,
          onConfirm,
          onSubmit,
        } as any)}
      >
        {transactionModalType.type === TransactionTypes.MMM && renderQRDetails()}
        {transactionModalType.type === 'PERSONAL_SIGN' && (
          <PersonalSign
            {...({
              navigation: props.navigation,
              onCancel: onSignAction,
              onConfirm: onSignAction,
              currentPageInformation,
              messageParams: transactionModalType,
            } as any)}
          />
        )}
        {transactionModalType.type === 'TYPED_SIGN' && (
          <TypedSign
            navigation={props.navigation}
            onCancel={onSignAction}
            onConfirm={onSignAction}
            currentPageInformation={currentPageInformation}
            messageParams={transactionModalType as any}
          />
        )}
        {transactionModalType.type === 'watch_asset_request' && (
          <WatchAssetRequest {...({ navigation: props.navigation, onCancel, onConfirm, currentPageInformation } as any)} />
        )}
        {transactionModalType.type === ApprovalTypes.CONNECT_ACCOUNTS && (
          <ConnectApproval navigation={props.navigation} />
        )}
        {transactionModalType.type === ApprovalTypes.REQUEST_PERMISSIONS && (
          <PermissionApproval navigation={props.navigation} />
        )}
        {transactionModalType.type === ApprovalTypes.INSTALL_SNAP && (
          <InstallSnapApproval {...({ navigation: props.navigation } as any)} />
        )}
        {!transactionModalType.type && renderTransactionApproval()}
        {transactionModalType.type === 'APPROVE' && renderApproval()}
      </ApprovalModal>
    );
  }
  return null;
};

const mapStateToProps = (state: RootState) => ({
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  chainId: selectEvmChainId(state),
  tokens: selectTokens(state),
  providerType: selectProviderType(state),
  shouldUseSmartTransaction: selectShouldUseSmartTransaction(
    state,
    selectEvmChainId(state),
  ),
});

const mapDispatchToProps = (dispatch: any) => ({
  setEtherTransaction: (transaction: object) =>
    dispatch(setEtherTransaction(transaction)),
  setTransactionObject: (transaction: object) =>
    dispatch(setTransactionObject(transaction)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RootRPCMethodsUI as any);
