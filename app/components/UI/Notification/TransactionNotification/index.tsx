import { Theme } from '../../../../util/theme/models';
import { RootState } from '../../../../reducers';
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { connect } from 'react-redux';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { strings } from '../../../../../locales/i18n';
import Engine from '../../../../core/Engine';
import { renderFromWei, fastSplit } from '../../../../util/number';
import { validateTransactionActionBalance } from '../../../../util/transactions';
import {
  fontStyles,
  colors as importedColors,
} from '../../../../styles/common';
import decodeTransaction from '../../TransactionElement/utils';
import TransactionActionContent from '../../TransactionActionModal/TransactionActionContent';
import ActionContent from '../../ActionModal/ActionContent';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TransactionDetails from '../../TransactionElement/TransactionDetails';
import BaseNotification from './../BaseNotification';
import Device from '../../../../util/device';
import ElevatedView from 'react-native-elevated-view';
import { CANCEL_RATE, SPEED_UP_RATE } from '@metamask/transaction-controller';
import BigNumber from 'bignumber.js';
import { collectibleContractsSelector } from '../../../../reducers/collectibles';
import { useTheme } from '../../../../util/theme';
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
import { speedUpTransaction } from '../../../../util/transaction-controller';
import { selectSelectedInternalAccountFormattedAddress } from '../../../../selectors/accountsController';

const WINDOW_WIDTH = Dimensions.get('window').width;
const ACTION_CANCEL = 'cancel';
const ACTION_SPEEDUP = 'speedup';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransactionSummary = Record<string, any>;

interface TransactionNotificationProps {
  isInBrowserView?: boolean;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notificationAnimated?: any;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: (...args: any[]) => any;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animatedTimingStart: (...args: any[]) => any;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentNotification?: any;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  swapsTransactions?: any;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  swapsTokens?: any;
  /**
   * Map of accounts to information objects including balances
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts?: any;
  /**
   * An array that represents the user transactions on chain
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactions?: any;
  /**
   * An array that represents the user smart transactions on chain
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  smartTransactions?: any;
  /**
   * String of selected address
   */
  selectedAddress?: string;
  /**
   * Current provider ticker
   */
  ticker?: string;
  /**
   * Current provider chainId
   */
  chainId?: string;
  /**
   * ETH to current currency conversion rate
   */
  conversionRate?: number | null;
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency?: string;
  /**
   * Current exchange rate
   */
  exchangeRate?: number;
  /**
   * Object containing token exchange rates in the format address => exchangeRate
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contractExchangeRates?: any;
  /**
   * An array that represents the user collectible contracts
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collectibleContracts?: any;
  /**
   * An array that represents the user tokens
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokens?: any;
  /**
   * Primary currency, either ETH or Fiat
   */
  primaryCurrency?: string;
}

const createStyles = (colors: Theme['colors']) =>
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

  const [transactionDetails, setTransactionDetails] =
    useState<TransactionSummary>();
  const [transactionElement, setTransactionElement] =
    useState<TransactionSummary>();
  const [tx, setTx] = useState<TransactionSummary>({});
  const [transactionDetailsIsVisible, setTransactionDetailsIsVisible] =
    useState(false);
  const [transactionAction, setTransactionAction] = useState<string>();
  const [transactionActionDisabled, setTransactionActionDisabled] = useState<
    boolean | string
  >(false);
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
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (position: any) => {
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
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const transactionActionDisabled = validateTransactionActionBalance(
      tx,
      SPEED_UP_RATE,
      accounts,
    );
    setTransactionAction(ACTION_SPEEDUP);
    setTransactionActionDisabled(transactionActionDisabled);
    animateActionTo(-WINDOW_WIDTH);
  }, [
    setTransactionAction,
    setTransactionActionDisabled,
    animateActionTo,
    tx,
    accounts,
  ]);

  const onCancelPress = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const transactionActionDisabled = validateTransactionActionBalance(
      tx,
      CANCEL_RATE,
      accounts,
    );
    setTransactionAction(ACTION_CANCEL);
    setTransactionActionDisabled(transactionActionDisabled);
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
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (callback: any) => {
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
    safelyExecute(() => speedUpTransaction(tx?.id));
  }, [safelyExecute, tx]);

  const stopTransaction = useCallback(() => {
    safelyExecute(() =>
      Engine.context.TransactionController.stopTransaction(tx?.id),
    );
  }, [safelyExecute, tx]);

  useEffect(() => {
    async function getTransactionInfo() {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const tx = transactions.find(
        ({ id }: { id: string }) => id === currentNotification.transaction.id,
      );
      if (!tx) return;
      const {
        selectedAddress,
        ticker,
        chainId,
        conversionRate,
        currentCurrency,
        exchangeRate,
        contractExchangeRates,
        collectibleContracts,
        tokens,
        primaryCurrency,
        swapsTransactions,
        swapsTokens,
      } = props;
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const [transactionElement, transactionDetails] = await decodeTransaction({
        ...props,
        tx,
        selectedAddress,
        ticker,
        chainId,
        conversionRate,
        currentCurrency,
        exchangeRate,
        contractExchangeRates,
        collectibleContracts,
        tokens,
        primaryCurrency,
        swapsTransactions,
        swapsTokens,
      });
      const existingGasPrice = new BigNumber(tx?.txParams?.gasPrice || '0x0');
      const gasFeeValue = fastSplit(
        existingGasPrice
          .times(
            transactionAction === ACTION_CANCEL ? CANCEL_RATE : SPEED_UP_RATE,
          )
          .toString(),
      ); // strips decimals if any, coming from the 'times' operation
      setGasFee(gasFeeValue);
      setTx(tx);
      setTransactionElement(transactionElement);
      setTransactionDetails(transactionDetails);
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
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const smartTx = smartTransactions.find(
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (stx: any) => stx.txHash === tx.hash,
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
                confirmDisabled={transactionActionDisabled as boolean}
              >
                <TransactionActionContent
                  confirmDisabled={transactionActionDisabled as boolean}
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

  const smartTransactions =
    // @ts-expect-error - chainId key type preserved from JS
    SmartTransactionsController?.smartTransactionsState?.smartTransactions?.[
      chainId
    ] || [];

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
    // @ts-expect-error - swapsTransactions is not part of TransactionControllerState typings
    swapsTransactions: TransactionController.swapsTransactions || {},
    swapsTokens: SwapsController.tokens,
    smartTransactions,
  };
};

export default connect(mapStateToProps)(TransactionNotification);
