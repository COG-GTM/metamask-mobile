import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { connect, ConnectedProps } from 'react-redux';
import Animated, { SharedValue, useSharedValue } from 'react-native-reanimated';
import { strings } from '../../../../../locales/i18n';
import Engine from '../../../../core/Engine';
import { renderFromWei, fastSplit } from '../../../../util/number';
import { validateTransactionActionBalance as validateTransactionActionBalanceUntyped } from '../../../../util/transactions';
import {
  fontStyles,
  colors as importedColors,
} from '../../../../styles/common';
import decodeTransaction, {
  type DecodeTransactionArgs,
  type TransactionDetailsData,
  type TransactionElementData,
} from '../../TransactionElement/utils';
import TransactionActionContent from '../../TransactionActionModal/TransactionActionContent';
import ActionContent from '../../ActionModal/ActionContent';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TransactionDetails from '../../TransactionElement/TransactionDetails';
import BaseNotification from './../BaseNotification';
import Device from '../../../../util/device';
import ElevatedView from 'react-native-elevated-view';
import {
  CANCEL_RATE,
  SPEED_UP_RATE,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { SmartTransaction } from '@metamask/smart-transactions-controller/dist/types';
import BigNumber from 'bignumber.js';
import { collectibleContractsSelector } from '../../../../reducers/collectibles';
import { useTheme } from '../../../../util/theme';
import { Colors } from '../../../../util/theme/models';
import { RootState } from '../../../../reducers';
import type { AnimatedTimingStart, CurrentNotification } from '..';
import {
  selectChainId,
  selectEvmTicker,
} from '../../../../selectors/networkController';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../../selectors/currencyRateController';
import { selectTokensByAddress } from '../../../../selectors/tokensController';
import { selectContractExchangeRates } from '../../../../selectors/tokenRatesController';
import { selectAccounts } from '../../../../selectors/accountTrackerController';
import { selectSwapsTransactions } from '../../../../selectors/transactionController';
import { speedUpTransaction } from '../../../../util/transaction-controller';
import { selectSelectedInternalAccountFormattedAddress } from '../../../../selectors/accountsController';

const WINDOW_WIDTH = Dimensions.get('window').width;
const ACTION_CANCEL = 'cancel';
const ACTION_SPEEDUP = 'speedup';

// The JSDoc on the JS implementation declares `rate` as a string and a string
// return value, but it is called with the numeric controller rates and returns
// a boolean.
const validateTransactionActionBalance =
  validateTransactionActionBalanceUntyped as unknown as (
    transaction: Partial<TransactionMeta>,
    rate: number,
    accounts: ReturnType<typeof selectAccounts>,
  ) => boolean;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    absoluteFill: {
      ...StyleSheet.absoluteFillObject,
    },
    titleWrapper: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.default,
      flexDirection: 'row',
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      marginVertical: 12,
      marginHorizontal: 24,
      color: colors.text.default,
      ...fontStyles.bold,
    },
    notification: {
      position: 'absolute',
      bottom: 0,
      paddingBottom: Device.isIphoneX() ? 20 : 10,
      left: 0,
      right: 0,
      backgroundColor: importedColors.transparent,
    },
    modalTypeViewBrowser: {
      bottom: Device.isIphoneX() ? 70 : 60,
    },
    closeIcon: {
      paddingTop: 4,
      position: 'absolute',
      right: 16,
      color: colors.icon.default,
    },
    modalsContainer: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '200%',
      flexDirection: 'row',
      backgroundColor: colors.overlay.default,
    },
    modalOverlay: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },
    modalContainer: {
      width: '90%',
      borderRadius: 10,
      backgroundColor: colors.background.default,
    },
    elevatedView: {
      backgroundColor: importedColors.transparent,
    },
  });

export interface TransactionNotificationData extends CurrentNotification {
  transaction: { id: string; [key: string]: unknown };
}

interface TransactionNotificationOwnProps {
  isInBrowserView?: boolean;
  notificationAnimated: SharedValue<number>;
  onClose: () => void;
  animatedTimingStart: AnimatedTimingStart;
  currentNotification: TransactionNotificationData;
}

type TransactionNotificationProps = TransactionNotificationOwnProps &
  ConnectedProps<typeof connector>;

function TransactionNotification(props: TransactionNotificationProps) {
  const {
    accounts,
    currentNotification,
    isInBrowserView,
    notificationAnimated,
    onClose,
    transactions,
    animatedTimingStart,
    smartTransactions,
  } = props;

  const [transactionDetails, setTransactionDetails] = useState<
    TransactionDetailsData | undefined
  >(undefined);
  const [transactionElement, setTransactionElement] = useState<
    TransactionElementData | undefined
  >(undefined);
  const [tx, setTx] = useState<Partial<TransactionMeta>>({});
  const [transactionDetailsIsVisible, setTransactionDetailsIsVisible] =
    useState(false);
  const [transactionAction, setTransactionAction] = useState<
    typeof ACTION_CANCEL | typeof ACTION_SPEEDUP | undefined
  >(undefined);
  const [transactionActionDisabled, setTransactionActionDisabled] =
    useState(false);
  const [gasFee, setGasFee] = useState('0x0');

  const detailsYAnimated = useSharedValue(0);
  const actionXAnimated = useSharedValue(0);
  const detailsAnimated = useSharedValue(0);

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const detailsFadeIn = useCallback(async () => {
    setTransactionDetailsIsVisible(true);
    setTimeout(() => animatedTimingStart(detailsAnimated, 1), 500);
  }, [setTransactionDetailsIsVisible, animatedTimingStart, detailsAnimated]);

  const animateActionTo = useCallback(
    (position: number) => {
      animatedTimingStart(detailsYAnimated, position);
      animatedTimingStart(actionXAnimated, position);
    },
    [animatedTimingStart, actionXAnimated, detailsYAnimated],
  );

  const onCloseDetails = useCallback(() => {
    animatedTimingStart(detailsAnimated, 0);
    setTimeout(() => setTransactionDetailsIsVisible(false), 1000);
  }, [animatedTimingStart, setTransactionDetailsIsVisible, detailsAnimated]);

  const onCloseNotification = useCallback(() => {
    onCloseDetails();
    setTimeout(() => onClose(), 1000);
  }, [onCloseDetails, onClose]);

  const onSpeedUpPress = useCallback(() => {
    const isActionDisabled = validateTransactionActionBalance(
      tx,
      SPEED_UP_RATE,
      accounts,
    );
    setTransactionAction(ACTION_SPEEDUP);
    setTransactionActionDisabled(isActionDisabled);
    animateActionTo(-WINDOW_WIDTH);
  }, [
    setTransactionAction,
    setTransactionActionDisabled,
    animateActionTo,
    tx,
    accounts,
  ]);

  const onCancelPress = useCallback(() => {
    const isActionDisabled = validateTransactionActionBalance(
      tx,
      CANCEL_RATE,
      accounts,
    );
    setTransactionAction(ACTION_CANCEL);
    setTransactionActionDisabled(isActionDisabled);
    animateActionTo(-WINDOW_WIDTH);
  }, [
    setTransactionAction,
    setTransactionActionDisabled,
    animateActionTo,
    tx,
    accounts,
  ]);

  const onActionFinish = useCallback(
    () => animateActionTo(0),
    [animateActionTo],
  );

  const safelyExecute = useCallback(
    (callback: () => void) => {
      try {
        callback();
      } catch (e) {
        // ignore because transaction already went through
      }
      onActionFinish();
    },
    [onActionFinish],
  );

  const speedUpTx = useCallback(() => {
    safelyExecute(() => {
      if (tx?.id) speedUpTransaction(tx.id);
    });
  }, [safelyExecute, tx]);

  const stopTransaction = useCallback(() => {
    safelyExecute(() => {
      if (tx?.id) Engine.context.TransactionController.stopTransaction(tx.id);
    });
  }, [safelyExecute, tx]);

  useEffect(() => {
    async function getTransactionInfo() {
      const foundTx = transactions.find(
        ({ id }) => id === currentNotification.transaction.id,
      );
      if (!foundTx) return;
      const {
        selectedAddress,
        ticker,
        chainId,
        conversionRate,
        currentCurrency,
        contractExchangeRates,
        collectibleContracts,
        tokens,
        primaryCurrency,
        swapsTransactions,
        swapsTokens,
      } = props;
      const [decodedElement, decodedDetails] = await decodeTransaction({
        ...props,
        tx: foundTx as DecodeTransactionArgs['tx'],
        selectedAddress: selectedAddress as string,
        ticker,
        chainId,
        conversionRate,
        currentCurrency,
        contractExchangeRates,
        collectibleContracts,
        tokens,
        primaryCurrency,
        swapsTransactions,
        swapsTokens,
      });
      const existingGasPrice = new BigNumber(
        foundTx?.txParams?.gasPrice || '0x0',
      );
      const gasFeeValue = fastSplit(
        existingGasPrice
          .times(
            transactionAction === ACTION_CANCEL ? CANCEL_RATE : SPEED_UP_RATE,
          )
          .toString(),
      ); // strips decimals if any, coming from the 'times' operation
      setGasFee(gasFeeValue);
      setTx(foundTx);
      setTransactionElement(decodedElement);
      setTransactionDetails(decodedDetails);
    }
    getTransactionInfo();
  }, [
    transactions,
    smartTransactions,
    currentNotification.transaction.id,
    transactionAction,
    props,
  ]);

  useEffect(() => onCloseNotification(), [onCloseNotification]);

  // Don't show submitted notification for STX b/c we only know when it's confirmed,
  // o/w a submitted notification will show up after it's confirmed, then a confirmed notification will show up immediately after
  if (tx.status === 'submitted') {
    const smartTx = smartTransactions.find(
      (stx: SmartTransaction) => stx.txHash === tx.hash,
    );
    if (smartTx) {
      return null;
    }
  }

  return (
    <>
      <Animated.View
        style={[
          styles.notification,
          isInBrowserView && styles.modalTypeViewBrowser,
          {
            transform: [{ translateY: notificationAnimated }],
          },
        ]}
      >
        <ElevatedView style={styles.elevatedView} elevation={100}>
          <BaseNotification
            status={currentNotification.status}
            data={{
              ...tx?.txParams,
              ...currentNotification.transaction,
              title: transactionElement?.notificationKey,
            }}
            onPress={detailsFadeIn}
            onHide={onCloseNotification}
          />
        </ElevatedView>
      </Animated.View>
      {transactionDetailsIsVisible && (
        <View style={styles.modalsContainer}>
          <View style={[styles.modalOverlay]}>
            <View style={styles.modalContainer}>
              <View style={styles.titleWrapper}>
                <Text style={styles.title} onPress={onCloseDetails}>
                  {transactionElement?.actionKey}
                </Text>
                <Ionicons
                  onPress={onCloseDetails}
                  name={'close'}
                  size={38}
                  style={styles.closeIcon}
                />
              </View>
              <TransactionDetails
                transactionObject={tx}
                transactionDetails={transactionDetails}
                close={onCloseDetails}
                showSpeedUpModal={onSpeedUpPress}
                showCancelModal={onCancelPress}
              />
            </View>
          </View>
          <View style={[styles.modalOverlay]}>
            <View style={styles.modalContainer}>
              <ActionContent
                onCancelPress={onActionFinish}
                onConfirmPress={
                  transactionAction === ACTION_CANCEL
                    ? stopTransaction
                    : speedUpTx
                }
                confirmText={strings('transaction.lets_try')}
                confirmButtonMode={'confirm'}
                cancelText={strings('transaction.nevermind')}
                confirmDisabled={transactionActionDisabled}
              >
                <TransactionActionContent
                  confirmDisabled={transactionActionDisabled}
                  feeText={`${renderFromWei(gasFee)} ${strings('unit.eth')}`}
                  titleText={strings(
                    `transaction.${transactionAction}_tx_title`,
                  )}
                  gasTitleText={strings(
                    `transaction.gas_${transactionAction}_fee`,
                  )}
                  descriptionText={strings(
                    `transaction.${transactionAction}_tx_message`,
                  )}
                />
              </ActionContent>
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const mapStateToProps = (state: RootState) => {
  const chainId = selectChainId(state);

  const {
    SmartTransactionsController,
    TransactionController,
    SwapsController,
  } = state.engine.backgroundState;

  const smartTransactionsByChainId: Partial<
    Record<string, SmartTransaction[]>
  > = SmartTransactionsController?.smartTransactionsState?.smartTransactions;
  const smartTransactions: SmartTransaction[] =
    smartTransactionsByChainId?.[chainId] || [];

  return {
    accounts: selectAccounts(state),
    selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
    transactions: TransactionController.transactions,
    ticker: selectEvmTicker(state),
    chainId,
    tokens: selectTokensByAddress(state),
    collectibleContracts: collectibleContractsSelector(state),
    contractExchangeRates: selectContractExchangeRates(state),
    conversionRate: selectConversionRate(state),
    currentCurrency: selectCurrentCurrency(state),
    primaryCurrency: state.settings.primaryCurrency,
    swapsTransactions: selectSwapsTransactions(state) || {},
    swapsTokens: SwapsController.tokens,
    smartTransactions,
  };
};

const connector = connect(mapStateToProps);

export default connector(TransactionNotification);
