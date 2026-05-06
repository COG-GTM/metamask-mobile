import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Alert } from 'react-native';
import { connect, useSelector } from 'react-redux';
import { ethers } from 'ethers';
// @ts-expect-error - human-standard-token-abi has no published TypeScript types
import abi from 'human-standard-token-abi';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type {
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import type { Dispatch } from 'redux';
import type { RootState } from '../../../reducers';

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

///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import InstallSnapApproval from '../../Approvals/InstallSnapApproval';
import { getGlobalEthQuery } from '../../../util/networks/global-network';
import SnapDialogApproval from '../../Snaps/SnapDialogApproval/SnapDialogApproval';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import SnapAccountCustomNameApproval from '../../Approvals/SnapAccountCustomNameApproval';
///: END:ONLY_INCLUDE_IF

const hstInterface = new ethers.utils.Interface(abi);

function useSwapsTransactions() {
  const swapTransactions = useSelector(selectSwapsTransactions, isEqual);

  // Memo prevents fresh fallback empty object on every render.
  return useMemo(() => swapTransactions ?? {}, [swapTransactions]);
}

type SwapsTransactions = Record<string, TrackedSwap | undefined>;

type TrackSwapsFn = (
  event: typeof MetaMetricsEvents[keyof typeof MetaMetricsEvents],
  transactionMeta: TransactionMeta,
  swapsTransactions: SwapsTransactions,
) => void;

export const useSwapConfirmedEvent = ({
  trackSwaps,
}: {
  trackSwaps: TrackSwapsFn;
}) => {
  const [transactionMetaIdsForListening, setTransactionMetaIdsForListening] =
    useState<string[]>([]);

  const addTransactionMetaIdForListening = useCallback((txMetaId: string) => {
    setTransactionMetaIdsForListening(
      (previousTransactionMetaIdsForListening) => [
        ...previousTransactionMetaIdsForListening,
        txMetaId,
      ],
    );
  }, []);
  const swapsTransactions = useSwapsTransactions();

  useEffect(() => {
    // Cannot directly call trackSwaps from the event listener in autoSign due to stale closure of swapsTransactions
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
              MetaMetricsEvents.SWAP_COMPLETED,
              transactionMeta,
              swapsTransactions,
            );
          }
        },
        (transactionMeta: TransactionMeta) =>
          transactionMeta.id === txMetaId,
      );
      setTransactionMetaIdsForListening(restTxMetaIds);
    }
  }, [trackSwaps, transactionMetaIdsForListening, swapsTransactions]);

  return {
    addTransactionMetaIdForListening,
    transactionMetaIdsForListening,
  };
};

interface TrackedSwap {
  analytics?: Record<string, unknown>;
  paramsForAnalytics?: {
    sentAt: number;
    gasEstimate: string;
    ethAccountBalance: string;
    approvalTransactionMetaId: string;
  };
  destinationToken: { address: string; decimals: number };
  destinationTokenDecimals: number;
  destinationAmount: string;
  gasUsed?: string;
  receivedDestinationAmount?: string;
}

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number | BN;
}

interface RootRPCMethodsUIProps {
  navigation: NavigationProp<ParamListBase>;
  setEtherTransaction: (transaction: Record<string, unknown>) => void;
  setTransactionObject: (transaction: Record<string, unknown>) => void;
  tokens: TokenInfo[];
  selectedAddress: string;
  chainId: string;
  shouldUseSmartTransaction: boolean;
  providerType?: string;
}

const RootRPCMethodsUI = (props: RootRPCMethodsUIProps) => {
  const { trackEvent, createEventBuilder } = useMetrics();
  const [transactionModalType, setTransactionModalType] = useState<
    TransactionModalType | undefined
  >(undefined);
  const tokenList = useSelector(selectTokenList);
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const setTransactionObject = props.setTransactionObject;
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const setEtherTransaction = props.setEtherTransaction;

  const initializeWalletConnect = () => {
    WalletConnect.init();
  };

  const trackSwaps = useCallback<TrackSwapsFn>(
    async (event, transactionMeta, swapsTransactions) => {
      try {
        const { TransactionController, SmartTransactionsController } =
          Engine.context;
        const swapTransaction = swapsTransactions[transactionMeta.id];

        if (!swapTransaction?.paramsForAnalytics) {
          return;
        }

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
          transactionMeta?.txParams ?? null,
          approvalTransaction?.txParams ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          swapTransaction.destinationToken as any,
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
            new BigNumber(tokensReceived || '0x0'),
            Number(swapTransaction.destinationTokenDecimals),
          )
          .div(swapTransaction.destinationAmount)
          .times(100)
          .toFixed(2)}%`;
        const tokenToAmountReceived = swapsUtils.calcTokenAmount(
          new BigNumber(tokensReceived ?? '0x0'),
          Number(swapTransaction.destinationToken.decimals),
        );

        const analyticsParams: Record<string, unknown> = {
          ...swapTransaction.analytics,
          account_type: getAddressAccountType(
            transactionMeta.txParams.from ?? '',
          ),
        };

        updateSwapsTransaction(
          transactionMeta.id,
          ((innerSwapsTransaction: TrackedSwap) => {
            innerSwapsTransaction.gasUsed = receipt.gasUsed;

            if (tokensReceived) {
              innerSwapsTransaction.receivedDestinationAmount = new BigNumber(
                tokensReceived,
                16,
              ).toString(10);
            }

            delete innerSwapsTransaction.analytics;
            delete innerSwapsTransaction.paramsForAnalytics;
          }) as Parameters<typeof updateSwapsTransaction>[1],
        );

        const smartTransactionMetricsProperties = (
          getSmartTransactionMetricsProperties as unknown as (
            ...args: unknown[]
          ) => Record<string, unknown>
        )(SmartTransactionsController, transactionMeta);

        const parameters: Record<string, unknown> = {
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
        const sensitiveParameters: Record<string, unknown> = {
          token_from_amount: analyticsParams.token_from_amount,
          token_to_amount: analyticsParams.token_to_amount,
          network_fees_ETH: analyticsParams.network_fees_ETH,
        };

        Logger.log('Swaps', 'Sending metrics event', event);

        trackEvent(
          createEventBuilder(event)
            .addProperties({
              ...parameters,
            } as Record<string, unknown> as Parameters<
              ReturnType<typeof createEventBuilder>['addProperties']
            >[0])
            .addSensitiveProperties({
              ...sensitiveParameters,
            } as Record<string, unknown> as Parameters<
              ReturnType<typeof createEventBuilder>['addSensitiveProperties']
            >[0])
            .build(),
        );
      } catch (e) {
        Logger.error(
          e as Error,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          MetaMetricsEvents.SWAP_TRACKING_FAILED as any,
        );
        trackEvent(
          createEventBuilder(MetaMetricsEvents.SWAP_TRACKING_FAILED)
            .addProperties({
              error: String(e),
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
          (innerTransactionMeta: TransactionMeta) => {
            if (innerTransactionMeta.status === 'submitted') {
              NotificationManager.watchSubmittedTransaction({
                ...innerTransactionMeta,
                assetType: (
                  innerTransactionMeta.txParams as TransactionParams & {
                    assetType?: string;
                  }
                ).assetType,
              });
            } else {
              if (swapsTransactions[innerTransactionMeta.id]?.analytics) {
                trackSwaps(
                  MetaMetricsEvents.SWAP_FAILED,
                  innerTransactionMeta,
                  swapsTransactions,
                );
              }
              throw innerTransactionMeta.error;
            }
          },
          (innerTransactionMeta: TransactionMeta) =>
            innerTransactionMeta.id === transactionId,
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(createLedgerTransactionModalNavDetails({
              transactionId: transactionMeta.id,
              deviceId,
              // eslint-disable-next-line no-empty-function
              onConfirmationComplete: () => {},
              // `type` is consumed by legacy navigation params and is not
              // part of the typed `LedgerTransactionModalParams` shape.
              type: 'signTransaction',
            } as unknown as Parameters<
              typeof createLedgerTransactionModalNavDetails
            >[0]) as unknown as Parameters<
              typeof props.navigation.navigate
            >),
          );
        } else {
          Engine.acceptPendingApproval(transactionMeta.id);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error ?? '');
        if (
          !errorMessage.startsWith(KEYSTONE_TX_CANCELED) &&
          !errorMessage.startsWith(STX_NO_HASH_ERROR)
        ) {
          Alert.alert(
            strings('transactions.transaction_error'),
            errorMessage,
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
    // Only `props.navigation` is read from props inside this callback; the
    // exhaustive-deps rule asks for `props` itself but depending on the whole
    // `props` object would defeat memoisation (a new reference each render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          // eslint-disable-next-line @typescript-eslint/no-shadow
          txParams: { value, gas, gasPrice, data },
        } = transactionMeta;
        const { AssetsContractController } = Engine.context;
        // Mutating txParams with BN values to keep behaviour parity with the
        // original JS implementation; the typed `TransactionParams` shape
        // expects strings here.
        const txParamsLoose = transactionMeta.txParams as unknown as Record<
          string,
          unknown
        >;
        txParamsLoose.gas = hexToBN(gas as unknown as string);
        txParamsLoose.gasPrice =
          gasPrice && hexToBN(gasPrice as unknown as string);

        if (
          (value === '0x0' || !value) &&
          data &&
          data !== '0x' &&
          to &&
          (await getMethodData(data, networkClientId)).name ===
            TOKEN_METHOD_TRANSFER
        ) {
          let asset: Partial<TokenInfo> | undefined = props.tokens.find(
            ({ address }: { address: string }) =>
              toLowerCaseEquals(address, to),
          );
          if (!asset) {
            // try to lookup contract by lowercased address `to`
            asset = tokenList[to as string] as
              | Partial<TokenInfo>
              | undefined;

            if (!asset) {
              try {
                asset = {};
                asset.decimals = (await AssetsContractController.getERC20TokenDecimals(
                  to as string,
                )) as unknown as number | BN;
                asset.symbol =
                  await AssetsContractController.getERC721AssetSymbol(
                    to as string,
                  );
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
              (tokenValue ?? 0) as string | number | BigNumber,
              (asset.decimals as unknown as number | undefined) ?? 0,
            ).toFixed();

          txParamsLoose.value = hexToBN(getTokenValueParamAsHex(tokenData));
          txParamsLoose.readableValue = tokenAmount;
          txParamsLoose.to = toAddress;

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
          txParamsLoose.value = hexToBN(value as unknown as string);
          txParamsLoose.readableValue = fromWei(
            txParamsLoose.value as unknown as string,
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
          isApprovalTransaction(data ?? '') &&
          (!value || isZeroValue(value as unknown as string))
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
      (
        WalletConnect as unknown as {
          hub?: { removeAllListeners: () => void };
        }
      )?.hub?.removeAllListeners();
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
    dispatch(setEtherTransaction(transaction)),
  setTransactionObject: (transaction: Record<string, unknown>) =>
    dispatch(setTransactionObject(transaction)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RootRPCMethodsUI as unknown as React.ComponentType<unknown>);
