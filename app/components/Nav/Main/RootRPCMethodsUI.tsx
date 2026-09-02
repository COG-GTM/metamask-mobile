import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Alert } from 'react-native';
import { connect, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import { ethers } from 'ethers';
import abi from 'human-standard-token-abi';

import NotificationManager from '../../../core/NotificationManager';
import Engine from '../../../core/Engine';
import { strings } from '../../../../locales/i18n';
import { hexToBN, fromWei, isZeroValue } from '../../../util/number';
import {
  setEtherTransaction as setEtherTransactionAction,
  setTransactionObject as setTransactionObjectAction,
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
import {
  SwapsTransaction,
  updateSwapsTransaction,
} from '../../../util/swaps/swaps-transactions';
import { RootState } from '../../../reducers';
import {
  IMetaMetricsEvent,
  JsonMap,
} from '../../../core/Analytics/MetaMetrics.types';

///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import InstallSnapApproval from '../../Approvals/InstallSnapApproval';
import { getGlobalEthQuery } from '../../../util/networks/global-network';
import SnapDialogApproval from '../../Snaps/SnapDialogApproval/SnapDialogApproval';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import SnapAccountCustomNameApproval from '../../Approvals/SnapAccountCustomNameApproval';
///: END:ONLY_INCLUDE_IF

const hstInterface = new ethers.utils.Interface(abi);

/**
 * `swapsUtils.calcTokenAmount` is called with hex string amounts, matching the
 * existing call sites.
 */
const calcSwapsTokenAmount = swapsUtils.calcTokenAmount as (
  value: string | number | BigNumber,
  decimals?: number,
) => BigNumber;

type SwapsTransactions = Record<string, SwapsTransaction>;

type MutableTransactionParams = Omit<
  TransactionParams,
  'value' | 'gas' | 'gasPrice' | 'to'
> & {
  value?: unknown;
  gas?: unknown;
  gasPrice?: unknown;
  to?: string;
  assetType?: string;
  readableValue?: string;
};

/**
 * `getSmartTransactionMetricsProperties` is called with two arguments only,
 * matching the existing call site.
 */
const getSmartTransactionMetricsPropertiesForMeta =
  getSmartTransactionMetricsProperties as (
    smartTransactionsController: Parameters<
      typeof getSmartTransactionMetricsProperties
    >[0],
    transactionMeta: TransactionMeta,
  ) => Promise<Record<string, unknown>>;

type TrackSwaps = (
  event: IMetaMetricsEvent,
  transactionMeta: TransactionMeta,
  swapsTransactions: SwapsTransactions,
) => Promise<void>;

interface TokenAsset {
  address?: string;
  symbol?: string;
  decimals?: string | number | BN;
}

interface RootRPCMethodsUIProps {
  navigation: NavigationProp<ParamListBase>;
  setEtherTransaction: (transaction: Record<string, unknown>) => void;
  setTransactionObject: (transaction: Record<string, unknown>) => void;
  tokens: TokenAsset[];
  selectedAddress?: string;
  chainId: Hex;
  shouldUseSmartTransaction: boolean;
}

function useSwapsTransactions() {
  const swapTransactions = useSelector(selectSwapsTransactions, isEqual);

  // Memo prevents fresh fallback empty object on every render.
  return useMemo(() => swapTransactions ?? {}, [swapTransactions]);
}

export const useSwapConfirmedEvent = ({
  trackSwaps,
}: {
  trackSwaps: TrackSwaps;
}) => {
  const [transactionMetaIdsForListening, setTransactionMetaIdsForListening] =
    useState<string[]>([]);

  const addTransactionMetaIdForListening = useCallback((txMetaId: string) => {
    setTransactionMetaIdsForListening((previousTransactionMetaIds) => [
      ...previousTransactionMetaIds,
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
        (transactionMeta) => {
          if (
            swapsTransactions[transactionMeta.id]?.analytics &&
            swapsTransactions[transactionMeta.id]?.paramsForAnalytics
          ) {
            trackSwaps(
              MetaMetricsEvents.SWAP_COMPLETED,
              transactionMeta,
              swapsTransactions,
            );
          }
        },
        (transactionMeta) => transactionMeta.id === txMetaId,
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
  const [transactionModalType, setTransactionModalType] = useState<
    TransactionModalType | undefined
  >(undefined);
  const tokenList = useSelector(selectTokenList);
  const setTransactionObject = props.setTransactionObject;
  const setEtherTransaction = props.setEtherTransaction;

  const initializeWalletConnect = () => {
    WalletConnect.init();
  };

  const trackSwaps: TrackSwaps = useCallback(
    async (event, transactionMeta, swapsTransactions) => {
      try {
        const { TransactionController, SmartTransactionsController } =
          Engine.context;
        const swapTransaction: SwapsTransaction =
          swapsTransactions[transactionMeta.id];

        const {
          sentAt,
          gasEstimate,
          ethAccountBalance,
          approvalTransactionMetaId,
        } = swapTransaction.paramsForAnalytics;

        const approvalTransaction =
          TransactionController.state.transactions.find(
            ({ id }) => id === approvalTransactionMetaId,
          );

        const ethQuery = getGlobalEthQuery();

        const ethBalance = await query(ethQuery, 'getBalance', [
          props.selectedAddress,
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
        const tokensReceived = swapsUtils.getSwapsTokensReceived(
          receipt,
          approvalReceipt,
          transactionMeta?.txParams as TransactionParams,
          approvalTransaction?.txParams as TransactionParams,
          swapTransaction.destinationToken,
          ethAccountBalance,
          ethBalance,
        );

        const timeToMine = currentBlock.timestamp - sentAt;
        const estimatedVsUsedGasRatio = `${new BigNumber(receipt.gasUsed)
          .div(gasEstimate)
          .times(100)
          .toFixed(2)}%`;
        const quoteVsExecutionRatio = `${calcSwapsTokenAmount(
          tokensReceived || '0x0',
          swapTransaction.destinationTokenDecimals,
        )
          .div(swapTransaction.destinationAmount)
          .times(100)
          .toFixed(2)}%`;
        const tokenToAmountReceived = calcSwapsTokenAmount(
          tokensReceived as string,
          swapTransaction.destinationToken.decimals,
        );

        const analyticsParams = {
          ...swapTransaction.analytics,
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
          getSmartTransactionMetricsPropertiesForMeta(
            SmartTransactionsController,
            transactionMeta,
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
          createEventBuilder(event)
            .addProperties({ ...parameters } as unknown as JsonMap)
            .addSensitiveProperties({
              ...sensitiveParameters,
            } as unknown as JsonMap)
            .build(),
        );
      } catch (e) {
        Logger.error(e as Error, MetaMetricsEvents.SWAP_TRACKING_FAILED);
        trackEvent(
          createEventBuilder(MetaMetricsEvents.SWAP_TRACKING_FAILED)
            .addProperties({
              error: e,
            } as JsonMap)
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
          (finishedTransactionMeta) => {
            if (finishedTransactionMeta.status === 'submitted') {
              NotificationManager.watchSubmittedTransaction({
                ...finishedTransactionMeta,
                assetType: (
                  finishedTransactionMeta.txParams as MutableTransactionParams
                ).assetType,
              });
            } else {
              if (swapsTransactions[finishedTransactionMeta.id]?.analytics) {
                trackSwaps(
                  MetaMetricsEvents.SWAP_FAILED,
                  finishedTransactionMeta,
                  swapsTransactions,
                );
              }
              throw finishedTransactionMeta.error;
            }
          },
          (finishedTransactionMeta) =>
            finishedTransactionMeta.id === transactionId,
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

          props.navigation.navigate(
            ...createLedgerTransactionModalNavDetails({
              transactionId: transactionMeta.id,
              deviceId,
              // eslint-disable-next-line no-empty-function
              onConfirmationComplete: () => {},
              type: 'signTransaction',
            } as Parameters<typeof createLedgerTransactionModalNavDetails>[0]),
          );
        } else {
          Engine.acceptPendingApproval(transactionMeta.id);
        }
      } catch (caughtError) {
        const error = caughtError as Error | undefined;
        if (
          !error?.message.startsWith(KEYSTONE_TX_CANCELED) &&
          !error?.message.startsWith(STX_NO_HASH_ERROR)
        ) {
          Alert.alert(
            strings('transactions.transaction_error'),
            error?.message,
            [{ text: strings('navigation.ok') }],
          );
          Logger.error(
            error as Error,
            'error while trying to send transaction (Main)',
          );
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
          txParams: { value, gas, gasPrice },
        } = transactionMeta;
        const { AssetsContractController } = Engine.context;
        (transactionMeta.txParams as MutableTransactionParams).gas = hexToBN(
          gas as string,
        );
        (transactionMeta.txParams as MutableTransactionParams).gasPrice =
          gasPrice && hexToBN(gasPrice);

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
            // try to lookup contract by lowercased address `to`
            asset = tokenList[to];

            if (!asset) {
              try {
                asset = {};
                asset.decimals =
                  await AssetsContractController.getERC20TokenDecimals(to);
                asset.symbol =
                  await AssetsContractController.getERC721AssetSymbol(to);
                // adding `to` here as well
                asset.address = to;
              } catch (e) {
                // This could fail when requesting a transfer in other network
                // adding `to` here as well
                asset = { symbol: 'ERC20', decimals: new BN(0), address: to };
              }
            }
          }

          const tokenData = hstInterface.parseTransaction({ data });
          const tokenValue = getTokenValueParam(tokenData);
          const toAddress = getTokenAddressParam(tokenData);
          const tokenAmount =
            tokenData &&
            calcTokenAmount(
              tokenValue as string,
              asset.decimals as number,
            ).toFixed();

          (transactionMeta.txParams as MutableTransactionParams).value =
            hexToBN(getTokenValueParamAsHex(tokenData));
          (transactionMeta.txParams as MutableTransactionParams).readableValue =
            tokenAmount;
          (transactionMeta.txParams as MutableTransactionParams).to = toAddress;

          setTransactionObject({
            selectedAsset: asset,
            id: transactionMeta.id,
            origin: transactionMeta.origin,
            securityAlertResponse: transactionMeta.securityAlertResponse,
            networkClientId,
            chainId,
            ...transactionMeta.txParams,
          });
        } else {
          (transactionMeta.txParams as MutableTransactionParams).value =
            hexToBN(value as string);
          (transactionMeta.txParams as MutableTransactionParams).readableValue =
            fromWei(
              (transactionMeta.txParams as MutableTransactionParams)
                .value as BN,
            );

          setEtherTransaction({
            id: transactionMeta.id,
            origin: transactionMeta.origin,
            securityAlertResponse: transactionMeta.securityAlertResponse,
            chainId,
            networkClientId,
            ...transactionMeta.txParams,
          });
        }

        if (
          isApprovalTransaction(data as string) &&
          (!value || isZeroValue(value))
        ) {
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
      (
        Engine.context.TokensController as unknown as {
          hub?: { removeAllListeners: () => void };
        }
      )?.hub?.removeAllListeners();
      WalletConnect?.hub?.removeAllListeners();
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
  setEtherTransaction: (transaction: Record<string, unknown>) =>
    dispatch(setEtherTransactionAction(transaction)),
  setTransactionObject: (transaction: Record<string, unknown>) =>
    dispatch(setTransactionObjectAction(transaction)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RootRPCMethodsUI);
