import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Alert } from 'react-native';
import { connect, useSelector } from 'react-redux';
import type { Dispatch } from 'redux';
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
import type { RootState } from '../../../reducers';

///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import InstallSnapApproval from '../../Approvals/InstallSnapApproval';
import { getGlobalEthQuery } from '../../../util/networks/global-network';
import SnapDialogApproval from '../../Snaps/SnapDialogApproval/SnapDialogApproval';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import SnapAccountCustomNameApproval from '../../Approvals/SnapAccountCustomNameApproval';
///: END:ONLY_INCLUDE_IF

const hstInterface = new ethers.utils.Interface(abi);

interface SwapsTransactions {
  [key: string]: {
    analytics?: unknown;
    paramsForAnalytics?: {
      sentAt: number;
      gasEstimate: string;
      ethAccountBalance: string;
      approvalTransactionMetaId?: string;
    };
    destinationToken?: {
      decimals: number;
      address?: string;
      symbol?: string;
    };
    destinationTokenDecimals?: number;
    destinationAmount?: string;
    gasUsed?: string;
    receivedDestinationAmount?: string;
  };
}

interface TxParamsLite {
  from?: string;
  to?: string;
  data?: string;
  value?: string;
  gas?: unknown;
  gasPrice?: unknown;
  maxFeePerGas?: unknown;
  maxPriorityFeePerGas?: unknown;
  readableValue?: string;
  assetType?: string;
}

interface TransactionMetaLite {
  id: string;
  hash?: string;
  origin?: string;
  chainId?: string | number;
  networkClientId?: string;
  securityAlertResponse?: unknown;
  txParams: TxParamsLite;
  error?: Error;
}

function useSwapsTransactions(): SwapsTransactions {
  const swapTransactions = useSelector(selectSwapsTransactions, isEqual);

  // Memo prevents fresh fallback empty object on every render.
  return useMemo(() => swapTransactions ?? {}, [swapTransactions]);
}

interface UseSwapConfirmedEventProps {
  trackSwaps: (event: string, transactionMeta: TransactionMetaLite, swapsTransactions: SwapsTransactions) => Promise<void>;
}

export const useSwapConfirmedEvent = ({ trackSwaps }: UseSwapConfirmedEventProps) => {
  const [transactionMetaIdsForListening, setTransactionMetaIdsForListening] =
    useState<string[]>([]);

  const addTransactionMetaIdForListening = useCallback((txMetaId: string) => {
    setTransactionMetaIdsForListening((prevIds: string[]) => [
      ...prevIds,
      txMetaId,
    ]);
  }, []);
  const swapsTransactions = useSwapsTransactions();

  useEffect(() => {
    // Cannot directly call trackSwaps from the event listener in autoSign due to stale closure of swapsTransactions
    const [txMetaId, ...restTxMetaIds] = transactionMetaIdsForListening;

    if (txMetaId && swapsTransactions[txMetaId]) {
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:transactionConfirmed',
        (txMetaEvent) => {
          if (
            swapsTransactions[txMetaEvent.id]?.analytics &&
            swapsTransactions[txMetaEvent.id]?.paramsForAnalytics
          ) {
            trackSwaps(
              MetaMetricsEvents.SWAP_COMPLETED,
              txMetaEvent as TransactionMetaLite,
              swapsTransactions,
            );
          }
        },
        (txMetaEvent) => txMetaEvent.id === txMetaId,
      );
      setTransactionMetaIdsForListening(restTxMetaIds);
    }
  }, [trackSwaps, transactionMetaIdsForListening, swapsTransactions]);

  return {
    addTransactionMetaIdForListening,
    transactionMetaIdsForListening,
  };
};

interface RootRPCMethodsUIProps {
  navigation: {
    navigate: (...args: unknown[]) => void;
  };
  setEtherTransaction: (transaction: unknown) => void;
  setTransactionObject: (transaction: unknown) => void;
  tokens: {
    address: string;
    decimals: number;
    symbol: string;
  }[];
  selectedAddress?: string;
  chainId: string;
  providerType?: string;
  shouldUseSmartTransaction: boolean;
}

const RootRPCMethodsUI = (props: RootRPCMethodsUIProps) => {
  const { trackEvent, createEventBuilder } = useMetrics();
  const [transactionModalType, setTransactionModalType] = useState<TransactionModalType | undefined>(undefined);
  const tokenList = useSelector(selectTokenList);
  const { selectedAddress, chainId: propsChainId, tokens, shouldUseSmartTransaction, navigation, setEtherTransaction: dispatchSetEtherTransaction, setTransactionObject: dispatchSetTransactionObject } = props;

  const initializeWalletConnect = () => {
    WalletConnect.init();
  };

  const trackSwaps = useCallback(
    async (event: string, transactionMeta: TransactionMetaLite, swapsTransactions: SwapsTransactions) => {
      try {
        const { TransactionController, SmartTransactionsController } =
          Engine.context;
        const swapTransaction = swapsTransactions[transactionMeta.id];

        const paramsForAnalytics = swapTransaction.paramsForAnalytics;
        if (!paramsForAnalytics) {
          throw new Error('Missing paramsForAnalytics');
        }
        const {
          sentAt,
          gasEstimate,
          ethAccountBalance,
          approvalTransactionMetaId,
        } = paramsForAnalytics;

        const approvalTransaction =
          TransactionController.state.transactions.find(
            ({ id }) => id === approvalTransactionMetaId,
          );

        const ethQuery = getGlobalEthQuery();

        const ethBalance = await query(ethQuery, 'getBalance', [
          selectedAddress,
        ]);
        const receipt = await query(ethQuery, 'getTransactionReceipt', [
          transactionMeta.hash,
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
        const destinationToken: { decimals: number; address: string; symbol: string } = {
          decimals: swapTransaction.destinationToken?.decimals ?? 0,
          address: swapTransaction.destinationToken?.address ?? '',
          symbol: swapTransaction.destinationToken?.symbol ?? '',
        };

        const tokensReceived = swapsUtils.getSwapsTokensReceived(
          receipt,
          approvalReceipt,
          transactionMeta?.txParams ?? null,
          approvalTransaction?.txParams ?? null,
          destinationToken,
          ethAccountBalance,
          ethBalance,
        );

        const tokensReceivedValue = tokensReceived ?? '0x0';
        const timeToMine = currentBlock.timestamp - sentAt;
        const estimatedVsUsedGasRatio = `${new BigNumber(receipt.gasUsed)
          .div(new BigNumber(gasEstimate))
          .times(100)
          .toFixed(2)}%`;
        const destinationTokenDecimals = Number(swapTransaction.destinationTokenDecimals ?? 0);
        const destinationAmount = new BigNumber(swapTransaction.destinationAmount ?? '0');

        const quoteVsExecutionRatio = `${swapsUtils
          .calcTokenAmount(
            new BigNumber(tokensReceivedValue, 16),
            destinationTokenDecimals,
          )
          .div(destinationAmount)
          .times(100)
          .toFixed(2)}%`;
        const tokenToAmountReceived = swapsUtils.calcTokenAmount(
          new BigNumber(tokensReceivedValue, 16),
          Number(destinationToken.decimals),
        );

        const analyticsParams: Record<string, unknown> = {
          ...(swapTransaction.analytics as Record<string, unknown> ?? {}),
          account_type: getAddressAccountType(transactionMeta.txParams.from),
        };

        updateSwapsTransaction(transactionMeta.id, (swapsTransaction) => {
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
          await getSmartTransactionMetricsProperties(
            SmartTransactionsController,
            transactionMeta,
            shouldUseSmartTransaction,
          );

        const parameters = {
          time_to_mine: timeToMine,
          estimated_vs_used_gasRatio: estimatedVsUsedGasRatio,
          quote_vs_executionRatio: quoteVsExecutionRatio,
          token_to_amount_received: tokenToAmountReceived.toString(),
          is_smart_transaction: shouldUseSmartTransaction,
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
          createEventBuilder(MetaMetricsEvents.SWAP_COMPLETED)
            .addProperties({ ...parameters, ...await smartTransactionMetricsProperties })
            .addSensitiveProperties({ ...sensitiveParameters })
            .build(),
        );
      } catch (e) {
        const error = e as Error;
        Logger.error(error, MetaMetricsEvents.SWAP_TRACKING_FAILED);
        trackEvent(
          createEventBuilder(MetaMetricsEvents.SWAP_TRACKING_FAILED)
            .addProperties({
              error: error.message,
            })
            .build(),
        );
      }
    },
    [
      selectedAddress,
      shouldUseSmartTransaction,
      trackEvent,
      createEventBuilder,
    ],
  );

  const { addTransactionMetaIdForListening } = useSwapConfirmedEvent({
    trackSwaps,
  });
  const swapsTransactions = useSwapsTransactions();

  const autoSign = useCallback(
    async (transactionMeta: TransactionMetaLite) => {
      const { KeyringController } = Engine.context;
      const { id: transactionId } = transactionMeta;

      try {
        Engine.controllerMessenger.subscribeOnceIf(
          'TransactionController:transactionFinished',
          (txMetaEvent) => {
            if (txMetaEvent.status === 'submitted') {
              const txParams = txMetaEvent.txParams as Record<string, unknown>;
              const assetType = typeof txParams.assetType === 'string' ? txParams.assetType : undefined;
              NotificationManager.watchSubmittedTransaction({
                ...txMetaEvent,
                assetType,
              });
            } else {
              if (swapsTransactions[txMetaEvent.id]?.analytics) {
                trackSwaps(
                  MetaMetricsEvents.SWAP_FAILED,
                  txMetaEvent as TransactionMetaLite,
                  swapsTransactions,
                );
              }
              throw txMetaEvent.error;
            }
          },
          (txMetaEvent) => txMetaEvent.id === transactionId,
        );

        // Queue txMetaId to listen for confirmation event
        addTransactionMetaIdForListening(transactionMeta.id);

        await KeyringController.resetQRKeyringState();

        const isLedgerAccount = isHardwareAccount(
          transactionMeta.txParams.from,
          [ExtendedKeyringTypes.ledger],
        );

        // For Ledger Accounts we handover the signing to the confirmation flow
        if (isLedgerAccount) {
          const deviceId = await getDeviceId();

          navigation.navigate(
            ...createLedgerTransactionModalNavDetails({
              transactionId: transactionMeta.id,
              deviceId,
              onConfirmationComplete: () => undefined,
            }),
          );
        } else {
          Engine.acceptPendingApproval(transactionMeta.id);
        }
      } catch (error) {
        const err = error as Error;
        if (
          !err?.message?.startsWith(KEYSTONE_TX_CANCELED) &&
          !err?.message?.startsWith(STX_NO_HASH_ERROR)
        ) {
          Alert.alert(
            strings('transactions.transaction_error'),
            err?.message ?? 'Unknown error',
            [{ text: strings('navigation.ok') }],
          );
          Logger.error(err, 'error while trying to send transaction (Main)');
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
      navigation,
      trackSwaps,
      trackEvent,
      swapsTransactions,
      addTransactionMetaIdForListening,
      createEventBuilder,
    ],
  );

  const onUnapprovedTransaction = useCallback(
    async (transactionMetaOriginal: TransactionMetaLite) => {
      const transactionMeta = cloneDeep(transactionMetaOriginal);

      if (transactionMeta.origin === TransactionTypes.MMM) return;

      const to = transactionMeta.txParams.to?.toLowerCase();
      const txData = transactionMeta.txParams.data;

      if (
        getIsSwapApproveOrSwapTransaction(
          txData,
          transactionMeta.origin,
          to,
          propsChainId,
        )
      ) {
        autoSign(transactionMeta);
      } else {
        const {
          chainId: txChainId,
          networkClientId,
          txParams: { value, gas, gasPrice },
        } = transactionMeta;
        const { AssetsContractController } = Engine.context;
        transactionMeta.txParams.gas = hexToBN(gas);
        transactionMeta.txParams.gasPrice = gasPrice && hexToBN(gasPrice);

        if (
          (value === '0x0' || !value) &&
          txData &&
          txData !== '0x' &&
          to &&
          (await getMethodData(txData, networkClientId)).name ===
            TOKEN_METHOD_TRANSFER
        ) {
          let asset = tokens.find(({ address }) =>
            toLowerCaseEquals(address, to),
          );
          if (!asset) {
            // try to lookup contract by lowercased address `to`
            asset = tokenList[to];

            if (!asset) {
              try {
                const decimals =
                  await AssetsContractController.getERC20TokenDecimals(to);
                const symbol =
                  await AssetsContractController.getERC721AssetSymbol(to);
                asset = { address: to, decimals: Number(decimals), symbol };
              } catch (e) {
                asset = { symbol: 'ERC20', decimals: 0, address: to };
              }
            }
          }

          const tokenData = hstInterface.parseTransaction({ data: txData });
          const tokenValue = getTokenValueParam(tokenData);
          const toAddress = getTokenAddressParam(tokenData);
          const tokenAmount =
            tokenData && asset ? calcTokenAmount(tokenValue ?? '0', asset.decimals).toFixed() : '0';

          const tokenValueHex = getTokenValueParamAsHex(tokenData);
          transactionMeta.txParams.value = tokenValueHex;
          transactionMeta.txParams.readableValue = tokenAmount;
          transactionMeta.txParams.to = toAddress;

          dispatchSetTransactionObject({
            selectedAsset: asset,
            id: transactionMeta.id,
            origin: transactionMeta.origin,
            securityAlertResponse: transactionMeta.securityAlertResponse,
            networkClientId,
            chainId: txChainId,
            ...transactionMeta.txParams,
          });
        } else {
          const valueBN = hexToBN(value);
          transactionMeta.txParams.value = value;
          transactionMeta.txParams.readableValue = fromWei(valueBN);

          dispatchSetEtherTransaction({
            id: transactionMeta.id,
            origin: transactionMeta.origin,
            securityAlertResponse: transactionMeta.securityAlertResponse,
            chainId: txChainId,
            networkClientId,
            ...transactionMeta.txParams,
          });
        }

        if (isApprovalTransaction(txData) && (!value || isZeroValue(value))) {
          setTransactionModalType(TransactionModalType.Transaction);
        } else {
          setTransactionModalType(TransactionModalType.Dapp);
        }
      }
    },
    [
      propsChainId,
      tokens,
      dispatchSetTransactionObject,
      dispatchSetEtherTransaction,
      autoSign,
      tokenList,
    ],
  );

  const onTransactionComplete = useCallback(() => {
    setTransactionModalType(undefined);
  }, []);

  // unapprovedTransaction effect
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
      const tokensController = Engine.context.TokensController as unknown;
      if (
        tokensController &&
        typeof tokensController === 'object' &&
        'hub' in tokensController
      ) {
        const tokensHub = (tokensController as { hub?: { removeAllListeners?: (event?: string) => void } }).hub;
        if (tokensHub && typeof tokensHub.removeAllListeners === 'function') {
          tokensHub.removeAllListeners();
        }
      }
      const walletConnectObj = WalletConnect as unknown;
      if (
        walletConnectObj &&
        typeof walletConnectObj === 'object' &&
        'hub' in walletConnectObj
      ) {
        const walletConnectHub = (walletConnectObj as { hub?: { removeAllListeners?: (event?: string) => void } }).hub;
        if (walletConnectHub && typeof walletConnectHub.removeAllListeners === 'function') {
          walletConnectHub.removeAllListeners();
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <React.Fragment>
      <ConfirmRoot />
      <SignatureApproval />
      <WalletConnectApproval />
      <TransactionApproval
        transactionType={transactionModalType}
        navigation={navigation}
        onComplete={onTransactionComplete}
      />
      <AddChainApproval />
      <SwitchChainApproval />
      <WatchAssetApproval />
      <ConnectApproval navigation={navigation} />
      <PermissionApproval navigation={navigation} />
      <FlowLoaderModal />
      <TemplateConfirmationModal />
      {
        ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
      }
      <InstallSnapApproval />
      <SnapDialogApproval />
      {
        ///: END:ONLY_INCLUDE_IF
      }
      {
        ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      }
      <SnapAccountCustomNameApproval />
      {
        ///: END:ONLY_INCLUDE_IF
      }
    </React.Fragment>
  );
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

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setEtherTransaction: (transaction: Parameters<typeof setEtherTransaction>[0]) =>
    dispatch(setEtherTransaction(transaction)),
  setTransactionObject: (transaction: Parameters<typeof setTransactionObject>[0]) =>
    dispatch(setTransactionObject(transaction)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RootRPCMethodsUI);
