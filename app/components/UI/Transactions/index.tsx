import { CANCEL_RATE, SPEED_UP_RATE } from '@metamask/transaction-controller';
import React, { ReactElement, PureComponent } from 'react';
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { Theme } from '@metamask/design-tokens';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Dispatch } from 'redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Modal from 'react-native-modal';
import { connect } from 'react-redux';
import { strings } from '../../../../locales/i18n';
import { showAlert } from '../../../actions/alert';
import Button, {
  ButtonSize,
  ButtonVariants,
} from '../../../component-library/components/Buttons/Button';
import { NO_RPC_BLOCK_EXPLORER, RPC } from '../../../constants/network';
import Engine from '../../../core/Engine';
import NotificationManager from '../../../core/NotificationManager';
import { collectibleContractsSelector } from '../../../reducers/collectibles';
import {
  selectChainId,
  selectNetworkClientId,
  selectNetworkConfigurations,
  selectProviderConfig,
  selectProviderType,
} from '../../../selectors/networkController';
import { selectPrimaryCurrency } from '../../../selectors/settings';
import { selectTokensByAddress } from '../../../selectors/tokensController';
import { selectGasFeeControllerEstimateType } from '../../../selectors/gasFeeController';
import { baseStyles, fontStyles } from '../../../styles/common';
import { isHardwareAccount } from '../../../util/address';
import {
  createLedgerTransactionModalNavDetails,
  LedgerTransactionModalParams,
  ReplacementTxParams,
} from '../../UI/LedgerModals/LedgerTransactionModal';
import Device from '../../../util/device';
import Logger from '../../../util/Logger';
import {
  findBlockExplorerForNonEvmChainId,
  findBlockExplorerForRpc,
  getBlockExplorerAddressUrl,
  getBlockExplorerName,
  isMainnetByChainId,
} from '../../../util/networks';
import { addHexPrefix, hexToBN, renderFromWei } from '../../../util/number';
import { mockTheme, ThemeContext } from '../../../util/theme';
import { validateTransactionActionBalance as validateTransactionActionBalanceBase } from '../../../util/transactions';
import withQRHardwareAwareness from '../QRHardware/withQRHardwareAwareness';
import TransactionActionModal from '../TransactionActionModal';
import TransactionElement, {
  TransactionElementTx,
} from '../TransactionElement';
import UpdateEIP1559Tx from '../../Views/confirmations/legacy/components/UpdateEIP1559Tx';
import RetryModal from './RetryModal';
import PriceChartContext, {
  PriceChartProvider,
} from '../AssetOverview/PriceChart/PriceChart.context';
import { providerErrors } from '@metamask/rpc-errors';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../selectors/currencyRateController';
import { selectContractExchangeRates } from '../../../selectors/tokenRatesController';
import { selectAccounts } from '../../../selectors/accountTrackerController';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import {
  TransactionError,
  CancelTransactionError,
  SpeedupTransactionError,
} from '../../../core/Transaction/TransactionError';
import { getDeviceId } from '../../../core/Ledger/Ledger';
import ExtendedKeyringTypes from '../../../constants/keyringTypes';
import {
  speedUpTransaction,
  updateIncomingTransactions,
} from '../../../util/transaction-controller';
import { selectGasFeeEstimates } from '../../../selectors/confirmTransaction';
import { decGWEIToHexWEI } from '../../../util/conversions';
import { ActivitiesViewSelectorsIDs } from '../../../../e2e/selectors/Transactions/ActivitiesView.selectors';
import { isNonEvmChainId } from '../../../core/Multichain/utils';
import {
  getFontFamily,
  TextVariant,
} from '../../../component-library/components/Texts/Text';
import { RootState } from '../../../reducers';
import { DecodeTransactionArgs } from '../TransactionElement/utils';
const validateTransactionActionBalance =
  validateTransactionActionBalanceBase as unknown as (
    transaction: TransactionElementTx | undefined,
    rate: number,
    accounts: Record<string, { balance?: string }> | undefined,
  ) => boolean;

const createStyles = (
  colors: Theme['colors'],
  typography: Theme['typography'],
) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    bottomModal: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 24,
    },
    keyboardAwareWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    loader: {
      alignSelf: 'center',
    },
    text: {
      fontSize: 20,
      color: colors.text.muted,
      ...fontStyles.normal,
    },
    textTransactions: {
      fontSize: 20,
      color: colors.text.muted,
      textAlign: 'center',
      marginLeft: 6,
      marginRight: 6,
      ...fontStyles.normal,
    },
    viewMoreWrapper: {
      padding: 16,
    },
    viewMoreButton: {
      width: '100%',
    },
    disclaimerWrapper: {
      padding: 16,
    },
    disclaimerText: {
      color: colors.text.default,
      ...typography.sBodySM,
      fontFamily: getFontFamily(TextVariant.BodySM),
    } as TextStyle,
  });

const ROW_HEIGHT = (Device.isIos() ? 95 : 100) + StyleSheet.hairlineWidth;

interface ExistingGas {
  isEIP1559Transaction?: boolean;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPrice?: number;
}

interface GasFeeEstimates {
  medium?: { suggestedMaxFeePerGas?: string } | string;
  gasPrice?: string;
}

interface UpdatedTransactionObject {
  error?: string;
  suggestedMaxFeePerGasHex?: string;
  suggestedMaxPriorityFeePerGasHex?: string;
}

interface ReplacementParams {
  type: string;
  eip1559GasFee: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
}

interface LedgerTransaction {
  id: string | null;
  replacementParams?: ReplacementParams;
  speedUpParams?: { type?: string };
}

interface TransactionsProps
  extends Omit<DecodeTransactionArgs, 'tx' | 'transactions'> {
  assetSymbol?: string;
  selectedAddress: string;
  chainId: string;
  /**
   * Network configurations, used to resolve the RPC block explorer
   */
  networkConfigurations?: ReturnType<typeof selectNetworkConfigurations>;
  /**
   * Map of accounts to information objects including balances
   */
  accounts?: Record<string, { balance?: string }>;
  /**
   * Callback to close the view
   */
  close?: () => void;
  /**
  /* navigation object required to push new views
  */
  navigation: NavigationProp<ParamListBase> & {
    push: (name: string, params?: object) => void;
  };
  /**
   * Object representing the configuration of the current selected network
   */
  providerConfig: { type?: string; rpcUrl?: string };
  /**
   * An array of transactions objects
   */
  transactions: TransactionElementTx[];
  /**
   * An array of transactions objects that have been submitted
   */
  submittedTransactions?: TransactionElementTx[];
  /**
   * An array of transactions objects that have been confirmed
   */
  confirmedTransactions: TransactionElementTx[];
  /**
   * Loading flag from an external call
   */
  loading?: boolean;
  /**
   * Pass the flatlist ref to the parent
   */
  onRefSet?: (ref: React.RefObject<FlatList<TransactionElementTx>>) => void;
  /**
   * Optional header component
   */
  header?: ReactElement;
  /**
   * Optional header height
   */
  headerHeight?: number;
  isSigningQRObject?: boolean;
  /**
   * On scroll past navbar callback
   */
  onScrollThroughContent?: (offsetY: number) => void;
  gasFeeEstimates: GasFeeEstimates;
  /**
   * Chain ID of the token
   */
  tokenChainId?: string;
}

interface TransactionsState {
  selectedTx: Map<string, boolean>;
  ready: boolean;
  refreshing: boolean;
  cancelIsOpen: boolean;
  cancel1559IsOpen: boolean;
  cancelConfirmDisabled: boolean;
  speedUpIsOpen: boolean;
  speedUp1559IsOpen: boolean;
  retryIsOpen: boolean;
  speedUpConfirmDisabled: boolean;
  rpcBlockExplorer: string | undefined;
  errorMsg: string | undefined;
  isQRHardwareAccount: boolean;
  isLedgerAccount: boolean;
}

/**
 * View that renders a list of transactions for a specific asset
 */
class Transactions extends PureComponent<TransactionsProps, TransactionsState> {
  static defaultProps = {
    headerHeight: 0,
  };

  state: TransactionsState = {
    selectedTx: new Map(),
    ready: false,
    refreshing: false,
    cancelIsOpen: false,
    cancel1559IsOpen: false,
    cancelConfirmDisabled: false,
    speedUpIsOpen: false,
    speedUp1559IsOpen: false,
    retryIsOpen: false,
    speedUpConfirmDisabled: false,
    rpcBlockExplorer: undefined,
    errorMsg: undefined,
    isQRHardwareAccount: false,
    isLedgerAccount: false,
  };

  existingGas: ExistingGas | null = null;
  existingTx: TransactionElementTx | null = null;
  cancelTxId: string | null = null;
  speedUpTxId: string | null = null;
  selectedTx: { id: string; index?: number } | null = null;
  mounted = false;
  scrolling = false;

  flatList = React.createRef<FlatList<TransactionElementTx>>();

  componentDidMount = () => {
    this.mounted = true;
    setTimeout(() => {
      this.mounted && this.setState({ ready: true });
      this.init();
      this.props.onRefSet && this.props.onRefSet(this.flatList);
    }, 100);
    this.setState({
      isQRHardwareAccount: Boolean(
        isHardwareAccount(this.props.selectedAddress),
      ),
    });
  };

  componentWillUnmount() {
    this.mounted = false;
  }

  updateBlockExplorer = () => {
    const {
      providerConfig: { type, rpcUrl },
      networkConfigurations,
      chainId,
    } = this.props;
    let blockExplorer: string | undefined;
    if (type === RPC) {
      blockExplorer =
        findBlockExplorerForRpc(rpcUrl, networkConfigurations ?? {}) ||
        NO_RPC_BLOCK_EXPLORER;
    } else if (isNonEvmChainId(chainId)) {
      // TODO: [SOLANA] - block explorer needs to be implemented
      blockExplorer = findBlockExplorerForNonEvmChainId(chainId);
    }

    this.setState({ rpcBlockExplorer: blockExplorer });
    this.setState({
      isQRHardwareAccount: Boolean(
        isHardwareAccount(this.props.selectedAddress, [
          ExtendedKeyringTypes.qr,
        ]),
      ),
      isLedgerAccount: Boolean(
        isHardwareAccount(this.props.selectedAddress, [
          ExtendedKeyringTypes.ledger,
        ]),
      ),
    });
  };

  componentDidUpdate() {
    this.updateBlockExplorer();
    if (
      this.props.confirmedTransactions.some(
        ({ id }) => id === this.existingTx?.id,
      )
    ) {
      this.onSpeedUpCompleted();
      this.onCancelCompleted();
    }
  }

  init() {
    this.mounted && this.setState({ ready: true });
    const txToView = NotificationManager.getTransactionToView();
    if (txToView) {
      setTimeout(() => {
        const index = this.props.transactions.findIndex(
          (tx) => txToView === tx.id,
        );
        if (index >= 0) {
          this.toggleDetailsView(txToView as string, index);
        }
      }, 1000);
    }
  }

  scrollToIndex = (index?: number) => {
    if (!this.scrolling && (this.props.headerHeight || index)) {
      this.scrolling = true;
      // eslint-disable-next-line no-unused-expressions
      this.flatList?.current?.scrollToIndex({
        index: index as number,
        animated: true,
      });
      setTimeout(() => {
        this.scrolling = false;
      }, 300);
    }
  };

  toggleDetailsView = (id: string, index?: number) => {
    const oldId = this.selectedTx?.id;
    const oldIndex = this.selectedTx?.index;

    if (this.selectedTx && oldId !== id && oldIndex !== index) {
      this.selectedTx = null;
      this.toggleDetailsView(oldId as string, oldIndex ?? undefined);
      InteractionManager.runAfterInteractions(() => {
        this.toggleDetailsView(id, index);
      });
    } else {
      this.setState((state) => {
        const selectedTx = new Map(state.selectedTx);
        const show = !selectedTx.get(id);
        selectedTx.set(id, show);
        if (show && (this.props.headerHeight || index)) {
          InteractionManager.runAfterInteractions(() => {
            this.scrollToIndex(index);
          });
        }
        this.selectedTx = show ? { id, index } : null;
        return { selectedTx };
      });
    }
  };

  onRefresh = async () => {
    this.setState({ refreshing: true });

    await updateIncomingTransactions();

    this.setState({ refreshing: false });
  };

  renderLoader = () => {
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
    const styles = createStyles(colors, typography);

    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator style={styles.loader} size="small" />
      </View>
    );
  };

  renderEmpty = () => {
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
    const styles = createStyles(colors, typography);
    if (this.props.tokenChainId !== this.props.chainId) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.textTransactions}>
            {strings('wallet.switch_network_to_view_transactions')}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.text}>{strings('wallet.no_transactions')}</Text>
      </View>
    );
  };

  viewOnBlockExplore = () => {
    const {
      navigation,
      providerConfig: { type },
      selectedAddress,
      close,
    } = this.props;
    const { rpcBlockExplorer } = this.state;
    try {
      const { url, title } = getBlockExplorerAddressUrl(
        type as string,
        selectedAddress,
        rpcBlockExplorer,
      );
      navigation.push('Webview', {
        screen: 'SimpleWebview',
        params: {
          url,
          title,
        },
      });
      close && close();
    } catch (e) {
      Logger.error(e as Error, {
        message: `can't get a block explorer link for network `,
        type,
      });
    }
  };

  renderViewMore = () => {
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
    const styles = createStyles(colors, typography);

    const {
      chainId,
      providerConfig: { type },
    } = this.props;
    const blockExplorerText = () => {
      if (isMainnetByChainId(chainId) || type !== RPC) {
        return strings('transactions.view_full_history_on_etherscan');
      }

      if (NO_RPC_BLOCK_EXPLORER !== this.state.rpcBlockExplorer) {
        return `${strings(
          'transactions.view_full_history_on',
        )} ${getBlockExplorerName(this.state.rpcBlockExplorer as string)}`;
      }

      return null;
    };

    return (
      <View style={styles.viewMoreWrapper}>
        <Button
          variant={ButtonVariants.Link}
          size={ButtonSize.Lg}
          label={blockExplorerText()}
          style={styles.viewMoreButton}
          onPress={this.viewOnBlockExplore}
        />
      </View>
    );
  };

  getItemLayout = (
    _data: ArrayLike<TransactionElementTx> | null | undefined,
    index: number,
  ) => ({
    length: ROW_HEIGHT,
    offset: (this.props.headerHeight as number) + ROW_HEIGHT * index,
    index,
  });

  keyExtractor = (item: TransactionElementTx) => item.id.toString();

  onSpeedUpAction = (
    speedUpAction: boolean,
    existingGas?: ExistingGas,
    tx?: TransactionElementTx,
  ) => {
    this.existingGas = existingGas as ExistingGas;
    this.speedUpTxId = (tx as TransactionElementTx).id;
    this.existingTx = tx as TransactionElementTx;
    if ((existingGas as ExistingGas).isEIP1559Transaction) {
      this.setState({ speedUp1559IsOpen: speedUpAction });
    } else {
      const speedUpConfirmDisabled = validateTransactionActionBalance(
        tx,
        SPEED_UP_RATE,
        this.props.accounts,
      );
      this.setState({ speedUpIsOpen: speedUpAction, speedUpConfirmDisabled });
    }
  };

  onSpeedUpCompleted = () => {
    this.setState({ speedUp1559IsOpen: false, speedUpIsOpen: false });
    this.existingGas = null;
    this.speedUpTxId = null;
    this.existingTx = null;
  };

  onCancelAction = (
    cancelAction: boolean,
    existingGas?: ExistingGas,
    tx?: TransactionElementTx,
  ) => {
    this.existingGas = existingGas as ExistingGas;
    this.cancelTxId = (tx as TransactionElementTx).id;
    this.existingTx = tx as TransactionElementTx;

    if ((existingGas as ExistingGas).isEIP1559Transaction) {
      this.setState({ cancel1559IsOpen: cancelAction });
    } else {
      const cancelConfirmDisabled = validateTransactionActionBalance(
        tx,
        CANCEL_RATE,
        this.props.accounts,
      );
      this.setState({ cancelIsOpen: cancelAction, cancelConfirmDisabled });
    }
  };

  onCancelCompleted = () => {
    this.setState({ cancel1559IsOpen: false, cancelIsOpen: false });
    this.existingGas = null;
    this.cancelTxId = null;
    this.existingTx = null;
  };

  onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { nativeEvent } = event;
    const { contentOffset } = nativeEvent;
    // 16 is the top padding of the list
    if (this.props.onScrollThroughContent) {
      this.props.onScrollThroughContent(contentOffset.y);
    }
  };

  handleSpeedUpTransactionFailure = (e: unknown) => {
    const speedUpTxId = this.speedUpTxId;
    const message = e instanceof TransactionError ? e.message : undefined;
    Logger.error(e as Error, {
      message: `speedUpTransaction failed `,
      speedUpTxId,
    });
    InteractionManager.runAfterInteractions(
      this.toggleRetry(message) as unknown as () => void,
    );
    this.setState({
      speedUp1559IsOpen: false,
      speedUpIsOpen: false,
    });
  };

  handleCancelTransactionFailure = (e: unknown) => {
    const cancelTxId = this.cancelTxId;
    const message = e instanceof TransactionError ? e.message : undefined;
    Logger.error(e as Error, {
      message: `cancelTransaction failed `,
      cancelTxId,
    });
    InteractionManager.runAfterInteractions(
      this.toggleRetry(message) as unknown as () => void,
    );
    this.setState({
      cancel1559IsOpen: false,
      cancelIsOpen: false,
    });
  };

  speedUpTransaction = async (transactionObject?: UpdatedTransactionObject) => {
    try {
      if (transactionObject?.error) {
        throw new SpeedupTransactionError(transactionObject.error);
      }

      const isLedgerAccount = isHardwareAccount(this.props.selectedAddress, [
        ExtendedKeyringTypes.ledger,
      ]);

      if (isLedgerAccount) {
        await this.signLedgerTransaction({
          id: this.speedUpTxId,
          replacementParams: {
            type: 'speedUp',
            eip1559GasFee: {
              maxFeePerGas: `0x${transactionObject?.suggestedMaxFeePerGasHex}`,
              maxPriorityFeePerGas: `0x${transactionObject?.suggestedMaxPriorityFeePerGasHex}`,
            },
          },
        });
      } else {
        await speedUpTransaction(
          this.speedUpTxId as string,
          this.getCancelOrSpeedupValues(transactionObject),
        );
      }
      this.onSpeedUpCompleted();
    } catch (e) {
      this.handleSpeedUpTransactionFailure(e);
    }
  };

  signQRTransaction = async (tx: TransactionElementTx) => {
    const { KeyringController, ApprovalController } = Engine.context;
    await KeyringController.resetQRKeyringState();
    await ApprovalController.accept(tx.id, undefined, { waitForResult: true });
  };

  signLedgerTransaction = async (transaction: LedgerTransaction) => {
    const deviceId = await getDeviceId();

    const onConfirmation = (isComplete: boolean) => {
      if (isComplete) {
        transaction.speedUpParams &&
        transaction.speedUpParams?.type === 'SpeedUp'
          ? this.onSpeedUpCompleted()
          : this.onCancelCompleted();
      }
    };

    this.props.navigation.navigate(
      ...createLedgerTransactionModalNavDetails({
        transactionId: transaction.id as string,
        deviceId,
        onConfirmationComplete: onConfirmation,
        type: 'signTransaction',
        replacementParams: transaction?.replacementParams as
          | ReplacementTxParams
          | undefined,
      } as LedgerTransactionModalParams),
    );
  };

  cancelUnsignedQRTransaction = async (tx: TransactionElementTx) => {
    await Engine.context.ApprovalController.reject(
      tx.id,
      providerErrors.userRejectedRequest(),
    );
  };

  cancelTransaction = async (transactionObject?: UpdatedTransactionObject) => {
    try {
      if (transactionObject?.error) {
        throw new CancelTransactionError(transactionObject.error);
      }

      const isLedgerAccount = isHardwareAccount(this.props.selectedAddress, [
        ExtendedKeyringTypes.ledger,
      ]);

      if (isLedgerAccount) {
        await this.signLedgerTransaction({
          id: this.cancelTxId,
          replacementParams: {
            type: 'cancel',
            eip1559GasFee: {
              maxFeePerGas: `0x${transactionObject?.suggestedMaxFeePerGasHex}`,
              maxPriorityFeePerGas: `0x${transactionObject?.suggestedMaxPriorityFeePerGasHex}`,
            },
          },
        });
      } else {
        await Engine.context.TransactionController.stopTransaction(
          this.cancelTxId as string,
          this.getCancelOrSpeedupValues(transactionObject),
        );
      }
      this.onCancelCompleted();
    } catch (e) {
      this.handleCancelTransactionFailure(e);
    }
  };

  renderItem = ({
    item,
    index,
  }: {
    item: TransactionElementTx;
    index: number;
  }) => (
    <TransactionElement
      tx={item}
      i={index}
      assetSymbol={this.props.assetSymbol}
      onSpeedUpAction={this.onSpeedUpAction}
      isQRHardwareAccount={this.state.isQRHardwareAccount}
      isLedgerAccount={this.state.isLedgerAccount}
      signQRTransaction={this.signQRTransaction}
      signLedgerTransaction={this.signLedgerTransaction}
      cancelUnsignedQRTransaction={this.cancelUnsignedQRTransaction}
      onCancelAction={this.onCancelAction}
      onPressItem={this.toggleDetailsView}
      selectedAddress={this.props.selectedAddress}
      tokens={this.props.tokens}
      collectibleContracts={this.props.collectibleContracts}
      contractExchangeRates={this.props.contractExchangeRates}
      exchangeRate={this.props.exchangeRate}
      conversionRate={this.props.conversionRate}
      currentCurrency={this.props.currentCurrency}
      navigation={this.props.navigation}
      txChainId={item.chainId}
    />
  );

  toggleRetry = (errorMsg?: string) =>
    this.setState((state) => ({ retryIsOpen: !state.retryIsOpen, errorMsg }));

  retry = () => {
    this.setState((state) => ({
      retryIsOpen: !state.retryIsOpen,
      errorMsg: undefined,
    }));

    //If the exitsing TX id true then it is a speed up retry
    if (this.speedUpTxId) {
      InteractionManager.runAfterInteractions(() => {
        this.onSpeedUpAction(
          true,
          this.existingGas as ExistingGas,
          this.existingTx as TransactionElementTx,
        );
      });
    }
    if (this.cancelTxId) {
      InteractionManager.runAfterInteractions(() => {
        this.onCancelAction(
          true,
          this.existingGas as ExistingGas,
          this.existingTx as TransactionElementTx,
        );
      });
    }
  };

  renderUpdateTxEIP1559Gas = (isCancel: boolean) => {
    const { isSigningQRObject } = this.props;
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
    const styles = createStyles(colors, typography);

    if (!this.existingGas) return null;
    if (this.existingGas.isEIP1559Transaction && !isSigningQRObject) {
      return (
        <Modal
          isVisible
          animationIn="slideInUp"
          animationOut="slideOutDown"
          style={styles.bottomModal}
          backdropColor={colors.overlay.default}
          backdropOpacity={1}
          animationInTiming={600}
          animationOutTiming={600}
          onBackdropPress={
            isCancel ? this.onCancelCompleted : this.onSpeedUpCompleted
          }
          onBackButtonPress={
            isCancel ? this.onCancelCompleted : this.onSpeedUpCompleted
          }
          onSwipeComplete={
            isCancel ? this.onCancelCompleted : this.onSpeedUpCompleted
          }
          swipeDirection={'down'}
          propagateSwipe
        >
          <KeyboardAwareScrollView
            contentContainerStyle={styles.keyboardAwareWrapper}
          >
            <UpdateEIP1559Tx
              gas={(this.existingTx as TransactionElementTx).txParams.gas}
              onSave={
                isCancel ? this.cancelTransaction : this.speedUpTransaction
              }
              onCancel={
                isCancel ? this.onCancelCompleted : this.onSpeedUpCompleted
              }
              existingGas={this.existingGas}
              isCancel={isCancel}
            />
          </KeyboardAwareScrollView>
        </Modal>
      );
    }
  };

  renderDisclaimer = () => {
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
    const styles = createStyles(colors, typography);
    return (
      <View style={styles.disclaimerWrapper}>
        <Text style={styles.disclaimerText}>
          {strings('asset_overview.disclaimer')}
        </Text>
      </View>
    );
  };

  renderFooter = () => (
    <View>
      {this.renderViewMore()}
      {this.renderDisclaimer()}
    </View>
  );

  renderList = () => {
    const {
      submittedTransactions,
      confirmedTransactions,
      header,
      isSigningQRObject,
    } = this.props;
    const { cancelConfirmDisabled, speedUpConfirmDisabled } = this.state;
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
    const styles = createStyles(colors, typography);

    const transactions = submittedTransactions?.length
      ? submittedTransactions
          .sort((a, b) => b.time - a.time)
          .concat(confirmedTransactions)
      : this.props.transactions;

    const renderRetryGas = (rate: number) => {
      if (!this.existingGas) return null;

      if (this.existingGas.isEIP1559Transaction) return null;

      const gasPrice = this.existingGas.gasPrice as number;

      const increasedGasPrice =
        gasPrice === 0
          ? hexToBN(this.getGasPriceEstimate())
          : Math.floor(gasPrice * rate);

      return `${renderFromWei(increasedGasPrice)} ${strings('unit.eth')}`;
    };

    const renderSpeedUpGas = () => renderRetryGas(SPEED_UP_RATE);
    const renderCancelGas = () => renderRetryGas(CANCEL_RATE);

    return (
      <View style={styles.wrapper}>
        <PriceChartContext.Consumer>
          {({ isChartBeingTouched }) => (
            <FlatList
              testID={ActivitiesViewSelectorsIDs.CONTAINER}
              ref={this.flatList}
              getItemLayout={this.getItemLayout}
              data={transactions}
              extraData={this.state}
              keyExtractor={this.keyExtractor}
              refreshControl={
                <RefreshControl
                  colors={[colors.primary.default]}
                  tintColor={colors.icon.default}
                  refreshing={this.state.refreshing}
                  onRefresh={this.onRefresh}
                />
              }
              renderItem={this.renderItem}
              initialNumToRender={10}
              maxToRenderPerBatch={2}
              onEndReachedThreshold={0.5}
              ListHeaderComponent={header}
              ListFooterComponent={
                transactions.length > 0 ? this.renderFooter : this.renderEmpty()
              }
              style={baseStyles.flexGrow}
              scrollIndicatorInsets={{ right: 1 }}
              onScroll={this.onScroll}
              scrollEnabled={!isChartBeingTouched}
            />
          )}
        </PriceChartContext.Consumer>

        {!isSigningQRObject && this.state.cancelIsOpen && (
          <TransactionActionModal
            isVisible={this.state.cancelIsOpen}
            confirmDisabled={cancelConfirmDisabled}
            onCancelPress={this.onCancelCompleted}
            onConfirmPress={this.cancelTransaction}
            confirmText={strings('transaction.lets_try')}
            confirmButtonMode={'confirm'}
            cancelText={strings('transaction.nevermind')}
            feeText={renderCancelGas() as string}
            titleText={strings('transaction.cancel_tx_title')}
            gasTitleText={strings('transaction.gas_cancel_fee')}
            descriptionText={strings('transaction.cancel_tx_message')}
          />
        )}
        {!isSigningQRObject && this.state.speedUpIsOpen && (
          <TransactionActionModal
            isVisible={this.state.speedUpIsOpen && !isSigningQRObject}
            confirmDisabled={speedUpConfirmDisabled}
            onCancelPress={this.onSpeedUpCompleted}
            onConfirmPress={this.speedUpTransaction}
            confirmText={strings('transaction.lets_try')}
            confirmButtonMode={'confirm'}
            cancelText={strings('transaction.nevermind')}
            feeText={renderSpeedUpGas() as string}
            titleText={strings('transaction.speedup_tx_title')}
            gasTitleText={strings('transaction.gas_speedup_fee')}
            descriptionText={strings('transaction.speedup_tx_message')}
          />
        )}
      </View>
    );
  };

  render = () => {
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
    const styles = createStyles(colors, typography);

    return (
      <PriceChartProvider>
        <View style={styles.wrapper}>
          {!this.state.ready || this.props.loading
            ? this.renderLoader()
            : this.renderList()}
          {(this.state.speedUp1559IsOpen || this.state.cancel1559IsOpen) &&
            this.renderUpdateTxEIP1559Gas(this.state.cancel1559IsOpen)}
        </View>
        <RetryModal
          onCancelPress={() => this.toggleRetry(undefined)}
          onConfirmPress={this.retry}
          retryIsOpen={this.state.retryIsOpen}
          errorMsg={this.state.errorMsg}
        />
      </PriceChartProvider>
    );
  };

  getCancelOrSpeedupValues(transactionObject?: UpdatedTransactionObject) {
    const { suggestedMaxFeePerGasHex, suggestedMaxPriorityFeePerGasHex } =
      transactionObject ?? {};

    if (suggestedMaxFeePerGasHex) {
      return {
        maxFeePerGas: `0x${suggestedMaxFeePerGasHex}`,
        maxPriorityFeePerGas: `0x${suggestedMaxPriorityFeePerGasHex}`,
      };
    }

    if ((this.existingGas as ExistingGas).gasPrice !== 0) {
      // Transaction controller will multiply existing gas price by the rate.
      return undefined;
    }

    return { gasPrice: this.getGasPriceEstimate() };
  }

  getGasPriceEstimate() {
    const { gasFeeEstimates } = this.props;

    const estimateGweiDecimal =
      (gasFeeEstimates?.medium as { suggestedMaxFeePerGas?: string })
        ?.suggestedMaxFeePerGas ??
      (gasFeeEstimates?.medium as string) ??
      gasFeeEstimates.gasPrice ??
      '0';

    return addHexPrefix(decGWEIToHexWEI(estimateGweiDecimal) as string);
  }
}

const mapStateToProps = (state: RootState) => ({
  accounts: selectAccounts(state),
  chainId: selectChainId(state),
  networkClientId: selectNetworkClientId(state),
  collectibleContracts: collectibleContractsSelector(state),
  contractExchangeRates: selectContractExchangeRates(state),
  conversionRate: selectConversionRate(state),
  currentCurrency: selectCurrentCurrency(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  networkConfigurations: selectNetworkConfigurations(state),
  providerConfig: selectProviderConfig(state),
  gasFeeEstimates: selectGasFeeEstimates(state),
  primaryCurrency: selectPrimaryCurrency(state),
  tokens: selectTokensByAddress(state),
  gasEstimateType: selectGasFeeControllerEstimateType(state),
  networkType: selectProviderType(state),
});

Transactions.contextType = ThemeContext;

const mapDispatchToProps = (dispatch: Dispatch) => ({
  showAlert: (config: Parameters<typeof showAlert>[0]) =>
    dispatch(showAlert(config)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withQRHardwareAwareness(Transactions));
