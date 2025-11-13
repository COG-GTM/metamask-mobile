import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Alert } from 'react-native';
import { connect, useSelector } from 'react-redux';
import { ethers } from 'ethers';
import abi from 'human-standard-token-abi';

import NotificationManager from '../../../core/NotificationManager';
import Engine from '../../../core/Engine';
import { strings } from '../../../../locales/i18n';
import { hexToBN, fromWei, isZeroValue } from '../../../util/number';
import {
  setEtherTransaction,
  setTransactionObject,
} from '../../../actions/transaction';
import WalletConnect from '../../../core/WalletConnect/WalletConnect';
import {
  getMethodData,
  TOKEN_METHOD_TRANSFER,
  getTokenValueParam,
  getTokenAddressParam,
  calcTokenAmount,
  getTokenValueParamAsHex,
  getIsSwapApproveOrSwapTransaction,
  isApprovalTransaction,
} from '../../../util/transactions';
import BN from 'bnjs4';
import Logger from '../../../util/Logger';
import TransactionTypes from '../../../core/TransactionTypes';
import { swapsUtils } from '@metamask/swaps-controller';
import { query } from '@metamask/controller-utils';
import BigNumber from 'bignumber.js';
import { toLowerCaseEquals } from '../../../util/general';
import { KEYSTONE_TX_CANCELED } from '../../../constants/error';
import { MetaMetricsEvents } from '../../../core/Analytics';
import {
  getAddressAccountType,
  isHardwareAccount,
} from '../../../util/address';
import { TransactionMeta } from '@metamask/transaction-controller';

import {
  selectEvmChainId,
  selectProviderType,
} from '../../../selectors/networkController';
import WatchAssetApproval from '../../Approvals/WatchAssetApproval';
import SignatureApproval from '../../Approvals/SignatureApproval';
import AddChainApproval from '../../Approvals/AddChainApproval';
import SwitchChainApproval from '../../Approvals/SwitchChainApproval';
import WalletConnectApproval from '../../Approvals/WalletConnectApproval';
import ConnectApproval from '../../Approvals/ConnectApproval';
import {
  TransactionApproval,
  TransactionModalType,
} from '../../Approvals/TransactionApproval';
import PermissionApproval from '../../Approvals/PermissionApproval';
import FlowLoaderModal from '../../Approvals/FlowLoaderModal';
import TemplateConfirmationModal from '../../Approvals/TemplateConfirmationModal';
import { selectTokenList } from '../../../selectors/tokenListController';
import { selectTokens } from '../../../selectors/tokensController';
import { getDeviceId } from '../../../core/Ledger/Ledger';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import { createLedgerTransactionModalNavDetails } from '../../UI/LedgerModals/LedgerTransactionModal';
import ExtendedKeyringTypes from '../../../constants/keyringTypes';
import { ConfirmRoot } from '../../../components/Views/confirmations/components/confirm';
import { useMetrics } from '../../../components/hooks/useMetrics';
import { selectShouldUseSmartTransaction } from '../../../selectors/smartTransactionsController';
import { STX_NO_HASH_ERROR } from '../../../util/smart-transactions/smart-publish-hook';
import { getSmartTransactionMetricsProperties } from '../../../util/smart-transactions';
import { cloneDeep, isEqual } from 'lodash';
import { selectSwapsTransactions } from '../../../selectors/transactionController';
import { updateSwapsTransaction } from '../../../util/swaps/swaps-transactions';

import InstallSnapApproval from '../../Approvals/InstallSnapApproval';
import { getGlobalEthQuery } from '../../../util/networks/global-network';
import SnapDialogApproval from '../../Snaps/SnapDialogApproval/SnapDialogApproval';
import SnapAccountCustomNameApproval from '../../Approvals/SnapAccountCustomNameApproval';

const hstInterface = new ethers.utils.Interface(abi);

interface Token {
  address: string;
  symbol?: string;
  decimals?: number;
  image?: string;
  name?: string;
}

interface SwapTransaction {
  analytics?: any;
  paramsForAnalytics?: {
    sentAt: number;
    gasEstimate: string;
    ethAccountBalance: string;
    approvalTransactionMetaId?: string;
  };
  destinationToken?: any;
  destinationTokenDecimals?: number;
  destinationAmount?: string;
  gasUsed?: string;
  receivedDestinationAmount?: string;
}

interface SwapsTransactions {
  [key: string]: SwapTransaction;
}

interface RootRPCMethodsUIProps {
  navigation: any;
  setEtherTransaction: (transaction: any) => void;
  setTransactionObject: (transaction: any) => void;
  tokens: Token[];
  selectedAddress: string;
  chainId: string;
  shouldUseSmartTransaction: boolean;
}

function useSwapsTransactions(): SwapsTransactions {
  const swapTransactions = useSelector(selectSwapsTransactions, isEqual);

  return useMemo(() => swapTransactions ?? {}, [swapTransactions]);
}

export const useSwapConfirmedEvent = ({ trackSwaps }: { trackSwaps: (event: string, transactionMeta: TransactionMeta, swapsTransactions: SwapsTransactions) => void }) => {
  const [transactionMetaIdsForListening, setTransactionMetaIdsForListening] =
    useState<string[]>([]);

  const addTransactionMetaIdForListening = useCallback((txMetaId: string) => {
    setTransactionMetaIdsForListening((transactionMetaIdsForListening) => [
      ...transactionMetaIdsForListening,
      txMetaId,
    ]);
  }, []);
  const swapsTransactions = useSwapsTransactions();

  useEffect(() => {
    const [txMetaId, ...restTxMetaIds] = transactionMetaIdsForListening;

    if (txMetaId && swapsTransactions[txMetaId]) {
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:transactionConfirmed',
        (transactionMeta: TransactionMeta) => {
          if (
            swapsTransactions[transactionMeta.id]?.analytics &&
            swapsTransactions[transactionMeta.id]?.paramsForAnalytics
          ) {
            trackSwaps(
              MetaMetricsEvents.SWAP_COMPLETED as any,
              transactionMeta,
              swapsTransactions,
            );
          }
        },
        (transactionMeta: TransactionMeta) => transactionMeta.id === txMetaId,
      );
      setTransactionMetaIdsForListening(restTxMetaIds);
    }
  }, [trackSwaps, transactionMetaIdsForListening, swapsTransactions]);

  return {
    addTransactionMetaIdForListening,
    transactionMetaIdsForListening,
  };
};

const RootRPCMethodsUI = (props: RootRPCMethodsUIProps) => {
  const { trackEvent, createEventBuilder } = useMetrics();
  const [transactionModalType, setTransactionModalType] = useState<TransactionModalType | undefined>(undefined);
  const tokenList = useSelector(selectTokenList);
  const setTransactionObject = props.setTransactionObject;
  const setEtherTransaction = props.setEtherTransaction;

  const initializeWalletConnect = () => {
    WalletConnect.init();
  };

  const trackSwaps = useCallback(
    async (event: string, transactionMeta: TransactionMeta, swapsTransactions: SwapsTransactions) => {
      try {
        const { TransactionController, SmartTransactionsController } =
          Engine.context;
        const swapTransaction = swapsTransactions[transactionMeta.id];

        const {
          sentAt,
          gasEstimate,
          ethAccountBalance,
          approvalTransactionMetaId,
        } = swapTransaction.paramsForAnalytics!;

        const approvalTransaction =
          TransactionController.state.transactions.find(
            ({ id }: { id: string }) => id === approvalTransactionMetaId,
          );

        const ethQuery = getGlobalEthQuery();

        const ethBalance = await query(ethQuery, 'getBalance', [
          props.selectedAddress,
        ]);
        const receipt = await query(ethQuery, 'getTransactionReceipt', [
          transactionMeta.hash as any,
        ]);

        const currentBlock = await query(ethQuery, 'getBlockByHash', [
          receipt.blockHash,
          false,
        ]);
        let approvalReceipt;
        if (approvalTransaction?.hash) {
          approvalReceipt = await query(ethQuery, 'getTransactionReceipt', [
            approvalTransaction.hash,
          ]);
        }
        const tokensReceived = swapsUtils.getSwapsTokensReceived(
          receipt,
          approvalReceipt,
          transactionMeta?.txParams,
          approvalTransaction?.txParams,
          swapTransaction.destinationToken,
          ethAccountBalance,
          ethBalance,
        );

        const timeToMine = currentBlock.timestamp - sentAt;
        const estimatedVsUsedGasRatio = `${new BigNumber(receipt.gasUsed)
          .div(gasEstimate)
          .times(100)
          .toFixed(2)}%`;
        const quoteVsExecutionRatio = `${swapsUtils
          .calcTokenAmount(
            tokensReceived || '0x0',
            swapTransaction.destinationTokenDecimals,
          )
          .div(swapTransaction.destinationAmount)
          .times(100)
          .toFixed(2)}%`;
        const tokenToAmountReceived = swapsUtils.calcTokenAmount(
          tokensReceived,
          swapTransaction.destinationToken.decimals,
        );

        const analyticsParams = {
          ...swapTransaction.analytics,
          account_type: getAddressAccountType(transactionMeta.txParams.from),
        };

        updateSwapsTransaction(transactionMeta.id, (swapsTransaction: SwapTransaction) => {
          swapsTransaction.gasUsed = receipt.gasUsed;

          if (tokensReceived) {
            swapsTransaction.receivedDestinationAmount = new BigNumber(
              tokensReceived,
              16,
            ).toString(10);
          }

          delete swapsTransaction.analytics;
          delete swapsTransaction.paramsForAnalytics;
        });

        const smartTransactionMetricsProperties =
          getSmartTransactionMetricsProperties(
            SmartTransactionsController as any,
            transactionMeta as any,
          );

        const parameters = {
          time_to_mine: timeToMine,
          estimated_vs_used_gasRatio: estimatedVsUsedGasRatio,
          quote_vs_executionRatio: quoteVsExecutionRatio,
          token_to_amount_received: tokenToAmountReceived.toString(),
          is_smart_transaction: props.shouldUseSmartTransaction,
          gas_included: analyticsParams.isGasIncludedTrade,
          ...smartTransactionMetricsProperties,
          available_quotes: analyticsParams.available_quotes,
          best_quote_source: analyticsParams.best_quote_source,
          chain_id: analyticsParams.chain_id,
          custom_slippage: analyticsParams.custom_slippage,
          network_fees_USD: analyticsParams.network_fees_USD,
          other_quote_selected: analyticsParams.other_quote_selected,
          request_type: analyticsParams.request_type,
          token_from: analyticsParams.token_from,
          token_to: analyticsParams.token_to,
        };
        const sensitiveParameters = {
          token_from_amount: analyticsParams.token_from_amount,
          token_to_amount: analyticsParams.token_to_amount,
          network_fees_ETH: analyticsParams.network_fees_ETH,
        };

        Logger.log('Swaps', 'Sending metrics event', event);

        trackEvent(
          createEventBuilder(event as any)
            .addProperties({ ...parameters } as any)
            .addSensitiveProperties({ ...sensitiveParameters } as any)
            .build(),
        );
      } catch (e) {
        Logger.error(e as Error, MetaMetricsEvents.SWAP_TRACKING_FAILED);
        trackEvent(
          createEventBuilder(MetaMetricsEvents.SWAP_TRACKING_FAILED)
            .addProperties({
              error: e,
            })
            .build(),
        );
      }
    },
    [
      props.selectedAddress,
      props.shouldUseSmartTransaction,
      trackEvent,
      createEventBuilder,
    ],
  );

  const { addTransactionMetaIdForListening } = useSwapConfirmedEvent({
    trackSwaps,
  });
  const swapsTransactions = useSwapsTransactions();

  const autoSign = useCallback(
    async (transactionMeta: TransactionMeta) => {
      const { KeyringController } = Engine.context;
      const { id: transactionId } = transactionMeta;

      try {
        Engine.controllerMessenger.subscribeOnceIf(
          'TransactionController:transactionFinished',
          (transactionMeta: TransactionMeta) => {
            if (transactionMeta.status === 'submitted') {
              NotificationManager.watchSubmittedTransaction({
                ...transactionMeta,
                assetType: transactionMeta.txParams.assetType,
              });
            } else {
              if (swapsTransactions[transactionMeta.id]?.analytics) {
                trackSwaps(
                  MetaMetricsEvents.SWAP_FAILED,
                  transactionMeta,
                  swapsTransactions,
                );
              }
              throw transactionMeta.error;
            }
          },
          (transactionMeta: TransactionMeta) => transactionMeta.id === transactionId,
        );

        addTransactionMetaIdForListening(transactionMeta.id);

        await KeyringController.resetQRKeyringState();

        const isLedgerAccount = isHardwareAccount(
          transactionMeta.txParams.from,
          [ExtendedKeyringTypes.ledger],
        );

        if (isLedgerAccount) {
          const deviceId = await getDeviceId();

          props.navigation.navigate(
            ...createLedgerTransactionModalNavDetails({
              transactionId: transactionMeta.id,
              deviceId,
              onConfirmationComplete: () => {},
            } as any),
          );
        } else {
          Engine.acceptPendingApproval(transactionMeta.id);
        }
      } catch (error) {
        if (
          !(error as Error)?.message.startsWith(KEYSTONE_TX_CANCELED) &&
          !(error as Error)?.message.startsWith(STX_NO_HASH_ERROR)
        ) {
          Alert.alert(
            strings('transactions.transaction_error'),
            (error as any)?.message || '',
            [{ text: strings('navigation.ok') }],
          );
          Logger.error(error as Error, 'error while trying to send transaction (Main)');
        } else {
          trackEvent(
            createEventBuilder(
              MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
            ).build(),
          );
        }
      }
    },
    [
      props.navigation,
      trackSwaps,
      trackEvent,
      swapsTransactions,
      addTransactionMetaIdForListening,
      createEventBuilder,
    ],
  );

  const onUnapprovedTransaction = useCallback(
    async (transactionMetaOriginal: TransactionMeta) => {
      const transactionMeta = cloneDeep(transactionMetaOriginal);

      if (transactionMeta.origin === TransactionTypes.MMM) return;

      const to = transactionMeta.txParams.to?.toLowerCase();
      const { data } = transactionMeta.txParams;

      if (
        getIsSwapApproveOrSwapTransaction(
          data,
          transactionMeta.origin,
          to,
          props.chainId,
        )
      ) {
        autoSign(transactionMeta);
      } else {
        const {
          chainId,
          networkClientId,
          txParams: { value, gas, gasPrice, data },
        } = transactionMeta;
        const { AssetsContractController } = Engine.context;
        transactionMeta.txParams.gas = hexToBN(gas!) as any;
        transactionMeta.txParams.gasPrice = gasPrice && (hexToBN(gasPrice) as any);

        if (
          (value === '0x0' || !value) &&
          data &&
          data !== '0x' &&
          to &&
          (await getMethodData(data, networkClientId)).name ===
            TOKEN_METHOD_TRANSFER
        ) {
          let asset = props.tokens.find(({ address }) =>
            toLowerCaseEquals(address, to),
          );
          if (!asset) {
            asset = tokenList[to];

            if (!asset) {
              try {
                asset = {} as Token;
                asset.decimals =
                  await AssetsContractController.getERC20TokenDecimals(to);
                asset.symbol =
                  await AssetsContractController.getERC721AssetSymbol(to);
                asset.address = to;
              } catch (e) {
                asset = { symbol: 'ERC20', decimals: 0, address: to };
              }
            }
          }

          const tokenData = hstInterface.parseTransaction({ data });
          const tokenValue = getTokenValueParam(tokenData);
          const toAddress = getTokenAddressParam(tokenData);
          const tokenAmount =
            tokenData && calcTokenAmount(tokenValue, asset.decimals!).toFixed();

          transactionMeta.txParams.value = hexToBN(
            getTokenValueParamAsHex(tokenData),
          ) as any;
          (transactionMeta.txParams as any).readableValue = tokenAmount;
          transactionMeta.txParams.to = toAddress;

          setTransactionObject({
            selectedAsset: asset,
            id: transactionMeta.id,
            origin: transactionMeta.origin,
            securityAlertResponse: transactionMeta.securityAlertResponse,
            networkClientId,
            chainId,
            ...transactionMeta.txParams,
          } as any);
        } else {
          transactionMeta.txParams.value = hexToBN(value!) as any;
          (transactionMeta.txParams as any).readableValue = fromWei(
            transactionMeta.txParams.value as any,
          );

          setEtherTransaction({
            id: transactionMeta.id,
            origin: transactionMeta.origin,
            securityAlertResponse: transactionMeta.securityAlertResponse,
            chainId,
            networkClientId,
            ...transactionMeta.txParams,
          } as any);
        }

        if (isApprovalTransaction(data) && (!value || isZeroValue(value as any))) {
          setTransactionModalType(TransactionModalType.Transaction);
        } else {
          setTransactionModalType(TransactionModalType.Dapp);
        }
      }
    },
    [
      props.chainId,
      props.tokens,
      autoSign,
      setTransactionObject,
      tokenList,
      setEtherTransaction,
    ],
  );

  const onTransactionComplete = useCallback(() => {
    setTransactionModalType(undefined);
  }, []);

  useEffect(() => {
    Engine.controllerMessenger.subscribe(
      'TransactionController:unapprovedTransactionAdded',
      onUnapprovedTransaction,
    );
    return () => {
      Engine.controllerMessenger.unsubscribe(
        'TransactionController:unapprovedTransactionAdded',
        onUnapprovedTransaction,
      );
    };
  }, [onUnapprovedTransaction]);

  useEffect(() => {
    initializeWalletConnect();

    return function cleanup() {
      (Engine.context.TokensController as any)?.hub?.removeAllListeners();
      WalletConnect?.hub?.removeAllListeners();
    };
  }, []);

  return (
    <React.Fragment>
      <ConfirmRoot />
      <SignatureApproval />
      <WalletConnectApproval />
      <TransactionApproval
        transactionType={transactionModalType}
        navigation={props.navigation}
        onComplete={onTransactionComplete}
      />
      <AddChainApproval />
      <SwitchChainApproval />
      <WatchAssetApproval />
      <ConnectApproval navigation={props.navigation} />
      <PermissionApproval navigation={props.navigation} />
      <FlowLoaderModal />
      <TemplateConfirmationModal />
      {
      }
      <InstallSnapApproval />
      <SnapDialogApproval />
      {
      }
      {
      }
      <SnapAccountCustomNameApproval />
      {
      }
    </React.Fragment>
  );
};

const mapStateToProps = (state: any) => ({
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
  setEtherTransaction: (transaction: any) =>
    dispatch(setEtherTransaction(transaction)),
  setTransactionObject: (transaction: any) =>
    dispatch(setTransactionObject(transaction)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RootRPCMethodsUI);
