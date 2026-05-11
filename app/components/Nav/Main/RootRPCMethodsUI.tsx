import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Alert } from 'react-native';
import { connect, useSelector } from 'react-redux';
import type { Dispatch, AnyAction } from 'redux';
import { ethers } from 'ethers';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error no types for human-standard-token-abi
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

interface SwapTransactionAnalyticsParams {
  sentAt: number;
  gasEstimate: string;
  ethAccountBalance: string;
  approvalTransactionMetaId?: string;
}

interface SwapTransaction {
  paramsForAnalytics: SwapTransactionAnalyticsParams;
  analytics?: Record<string, unknown>;
  destinationToken: { decimals: number };
  destinationTokenDecimals: number;
  destinationAmount: string;
}

interface SwapsTransactions {
  [id: string]: SwapTransaction | undefined;
}

interface TransactionMeta {
  id: string;
  hash?: string;
  status?: string;
  origin?: string;
  error?: Error & { message: string };
  txParams: {
    from: string;
    to?: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
    assetType?: string;
    readableValue?: string;
  };
  securityAlertResponse?: unknown;
  chainId?: string;
  networkClientId?: string;
}

function useSwapsTransactions(): SwapsTransactions {
  const swapTransactions = useSelector(selectSwapsTransactions, isEqual);

  // Memo prevents fresh fallback empty object on every render.
  return useMemo(
    () => (swapTransactions ?? {}) as SwapsTransactions,
    [swapTransactions],
  );
}

interface UseSwapConfirmedEventOptions {
  trackSwaps: (
    event: unknown,
    transactionMeta: TransactionMeta,
    swapsTransactions: SwapsTransactions,
  ) => void;
}

export const useSwapConfirmedEvent = ({
  trackSwaps,
}: UseSwapConfirmedEventOptions) => {
  const [transactionMetaIdsForListening, setTransactionMetaIdsForListening] =
    useState<string[]>([]);

  const addTransactionMetaIdForListening = useCallback((txMetaId: string) => {
    setTransactionMetaIdsForListening((prev) => [...prev, txMetaId]);
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

interface RootRPCMethodsUIProps {
  navigation: {
    navigate: (...args: unknown[]) => void;
  };
  setEtherTransaction: (transaction: Record<string, unknown>) => void;
  setTransactionObject: (transaction: Record<string, unknown>) => void;
  tokens: { address: string; decimals?: number; symbol?: string }[];
  selectedAddress?: string;
  chainId?: string;
  shouldUseSmartTransaction?: boolean;
}

const RootRPCMethodsUI = (props: RootRPCMethodsUIProps) => {
  const { trackEvent, createEventBuilder } = useMetrics();
  const [transactionModalType, setTransactionModalType] = useState<
    string | undefined
  >(undefined);
  const tokenList = useSelector(selectTokenList);
  const setTransactionObject = props.setTransactionObject;
  const setEtherTransaction = props.setEtherTransaction;

  const initializeWalletConnect = () => {
    WalletConnect.init();
  };

  const trackSwaps = useCallback(
    async (
      event: unknown,
      transactionMeta: TransactionMeta,
      swapsTransactions: SwapsTransactions,
    ) => {
      try {
        const { TransactionController, SmartTransactionsController } =
          Engine.context;
        const swapTransaction = swapsTransactions[
          transactionMeta.id
        ] as SwapTransaction;

        const {
          sentAt,
          gasEstimate,
          ethAccountBalance,
          approvalTransactionMetaId,
        } = swapTransaction.paramsForAnalytics;

        const approvalTransaction = (
          TransactionController.state
            .transactions as { id: string; hash?: string; txParams?: unknown }[]
        ).find(({ id }) => id === approvalTransactionMetaId);

        const ethQuery = getGlobalEthQuery();

        const ethBalance = (await query(ethQuery, 'getBalance', [
          props.selectedAddress,
        ])) as string;
        const receipt = (await query(
          ethQuery,
          'getTransactionReceipt',
          [transactionMeta.hash],
        )) as unknown as { blockHash: string; gasUsed: string };

        const currentBlock = (await query(
          ethQuery,
          'getBlockByHash',
          [receipt.blockHash, false],
        )) as unknown as { timestamp: number };
        let approvalReceipt;
        if (approvalTransaction?.hash) {
          approvalReceipt = await query(ethQuery, 'getTransactionReceipt', [
            approvalTransaction.hash,
          ]);
        }
        const tokensReceived = (
          swapsUtils.getSwapsTokensReceived as unknown as (
            ...args: unknown[]
          ) => string
        )(
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
          .div(gasEstimate as unknown as BigNumber.Value)
          .times(100)
          .toFixed(2)}%`;
        const calcTokenAmountAny = swapsUtils.calcTokenAmount as unknown as (
          value: unknown,
          decimals: unknown,
        ) => BigNumber;
        const quoteVsExecutionRatio = `${calcTokenAmountAny(
          tokensReceived || '0x0',
          swapTransaction.destinationTokenDecimals,
        )
          .div(swapTransaction.destinationAmount as unknown as BigNumber.Value)
          .times(100)
          .toFixed(2)}%`;
        const tokenToAmountReceived = calcTokenAmountAny(
          tokensReceived,
          swapTransaction.destinationToken.decimals,
        );

        const analyticsParams: Record<string, unknown> = {
          ...swapTransaction.analytics,
          account_type: getAddressAccountType(transactionMeta.txParams.from),
        };

        updateSwapsTransaction(
          transactionMeta.id,
          (
            swapsTransaction: {
              gasUsed?: string;
              receivedDestinationAmount?: string;
              analytics?: Record<string, unknown>;
              paramsForAnalytics?: SwapTransactionAnalyticsParams;
            },
          ) => {
            swapsTransaction.gasUsed = receipt.gasUsed;

            if (tokensReceived) {
              swapsTransaction.receivedDestinationAmount = new BigNumber(
                tokensReceived,
                16,
              ).toString(10);
            }

            delete swapsTransaction.analytics;
            delete swapsTransaction.paramsForAnalytics;
          },
        );

        const smartTransactionMetricsProperties = (
          getSmartTransactionMetricsProperties as unknown as (
            ...args: unknown[]
          ) => Record<string, unknown>
        )(
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

        Logger.log('Swaps', 'Sending metrics event', event as never);

        trackEvent(
          createEventBuilder(
            event as Parameters<typeof createEventBuilder>[0],
          )
            .addProperties(
              parameters as unknown as Parameters<
                ReturnType<typeof createEventBuilder>['addProperties']
              >[0],
            )
            .addSensitiveProperties(
              sensitiveParameters as unknown as Parameters<
                ReturnType<typeof createEventBuilder>['addSensitiveProperties']
              >[0],
            )
            .build(),
        );
      } catch (e) {
        Logger.error(
          e as Error,
          MetaMetricsEvents.SWAP_TRACKING_FAILED as unknown as string,
        );
        trackEvent(
          createEventBuilder(MetaMetricsEvents.SWAP_TRACKING_FAILED)
            .addProperties({
              error: (e as Error)?.message ?? String(e),
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
          (transactionMeta: TransactionMeta) =>
            transactionMeta.id === transactionId,
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
            ...(createLedgerTransactionModalNavDetails({
              transactionId: transactionMeta.id,
              deviceId,
              // eslint-disable-next-line no-empty-function
              onConfirmationComplete: () => {},
              type: 'signTransaction',
            } as Parameters<
              typeof createLedgerTransactionModalNavDetails
            >[0]) as unknown as unknown[]),
          );
        } else {
          Engine.acceptPendingApproval(transactionMeta.id);
        }
      } catch (error) {
        const err = error as Error | undefined;
        if (
          !err?.message.startsWith(KEYSTONE_TX_CANCELED) &&
          !err?.message.startsWith(STX_NO_HASH_ERROR)
        ) {
          Alert.alert(
            strings('transactions.transaction_error'),
            err && err.message,
            [{ text: strings('navigation.ok') }],
          );
          Logger.error(
            err as Error,
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
          txParams: { value, gas, gasPrice, data },
        } = transactionMeta;
        const { AssetsContractController } = Engine.context;
        transactionMeta.txParams.gas = hexToBN(
          gas as string,
        ) as unknown as string;
        transactionMeta.txParams.gasPrice = (gasPrice &&
          hexToBN(gasPrice)) as unknown as string | undefined;

        if (
          (value === '0x0' || !value) &&
          data &&
          data !== '0x' &&
          to &&
          (await getMethodData(data, networkClientId as string)).name ===
            TOKEN_METHOD_TRANSFER
        ) {
          let asset: {
            address?: string;
            decimals?: number | BN;
            symbol?: string;
          } | undefined = props.tokens.find(({ address }) =>
            toLowerCaseEquals(address, to),
          );
          if (!asset) {
            // try to lookup contract by lowercased address `to`
            asset = tokenList[to];

            if (!asset) {
              try {
                asset = {};
                asset.decimals = (await AssetsContractController.getERC20TokenDecimals(
                  to,
                )) as unknown as number;
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
              asset?.decimals as number,
            ).toFixed();

          transactionMeta.txParams.value = hexToBN(
            getTokenValueParamAsHex(tokenData),
          ) as unknown as string;
          transactionMeta.txParams.readableValue = tokenAmount;
          transactionMeta.txParams.to = toAddress;

          setTransactionObject({
            selectedAsset: asset,
            id: transactionMeta.id,
            origin: transactionMeta.origin,
            securityAlertResponse: transactionMeta.securityAlertResponse,
            networkClientId,
            chainId,
            ...transactionMeta.txParams,
          } as unknown as Record<string, unknown>);
        } else {
          transactionMeta.txParams.value = hexToBN(
            value as string,
          ) as unknown as string;
          transactionMeta.txParams.readableValue = fromWei(
            transactionMeta.txParams.value,
          ) as unknown as string;

          setEtherTransaction({
            id: transactionMeta.id,
            origin: transactionMeta.origin,
            securityAlertResponse: transactionMeta.securityAlertResponse,
            chainId,
            networkClientId,
            ...transactionMeta.txParams,
          } as unknown as Record<string, unknown>);
        }

        if (
          isApprovalTransaction(data as string) &&
          (!value || isZeroValue(value as string))
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
          hub?: { removeAllListeners?: () => void };
        }
      )?.hub?.removeAllListeners?.();
      (
        WalletConnect as unknown as {
          hub?: { removeAllListeners?: () => void };
        }
      )?.hub?.removeAllListeners?.();
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

const mapStateToProps = (state: unknown) => ({
  selectedAddress: selectSelectedInternalAccountFormattedAddress(
    state as Parameters<typeof selectSelectedInternalAccountFormattedAddress>[0],
  ),
  chainId: selectEvmChainId(state as Parameters<typeof selectEvmChainId>[0]),
  tokens: selectTokens(state as Parameters<typeof selectTokens>[0]),
  providerType: selectProviderType(
    state as Parameters<typeof selectProviderType>[0],
  ),
  shouldUseSmartTransaction: selectShouldUseSmartTransaction(
    state as Parameters<typeof selectShouldUseSmartTransaction>[0],
    selectEvmChainId(state as Parameters<typeof selectEvmChainId>[0]),
  ),
});

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => ({
  setEtherTransaction: (transaction: Record<string, unknown>) =>
    dispatch(setEtherTransaction(transaction)),
  setTransactionObject: (transaction: Record<string, unknown>) =>
    dispatch(setTransactionObject(transaction)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RootRPCMethodsUI);
