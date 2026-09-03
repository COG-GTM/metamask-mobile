import React, { PureComponent } from 'react';
import {
  TouchableOpacity,
  TouchableHighlight,
  StyleSheet,
  Image,
  Text,
  View,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { fontStyles } from '../../../styles/common';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import { strings } from '../../../../locales/i18n';
import { toDateFormat } from '../../../util/date';
import TransactionDetails from './TransactionDetails';
import { safeToChecksumAddress } from '../../../util/address';
import { connect } from 'react-redux';
import StyledButton from '../StyledButton';
import Modal from 'react-native-modal';
import decodeTransaction, {
  type DecodeTransactionArgs,
  type TransactionDetailsData,
  type TransactionElementData,
} from './utils';
import { TRANSACTION_TYPES } from '../../../util/transactions';
import ListItem from '../../Base/ListItem';
import BaseStatusText from '../../Base/StatusText';
import BaseDetailsModal from '../../Base/DetailsModal';
import { isTestNet } from '../../../util/networks';
import { weiHexToGweiDec } from '@metamask/controller-utils';
import {
  WalletDevice,
  isEIP1559Transaction,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { ThemeContext } from '../../../util/theme';
import { selectEvmNetworkConfigurationsByChainId } from '../../../selectors/networkController';
import { selectSelectedInternalAccount } from '../../../selectors/accountsController';
import { selectPrimaryCurrency } from '../../../selectors/settings';
import { selectSwapsTransactions } from '../../../selectors/transactionController';
import { swapsControllerTokens } from '../../../reducers/swaps';
import type { SwapsToken } from '@metamask/swaps-controller/dist/types';
import {
  FINAL_NON_CONFIRMED_STATUSES,
  useBridgeTxHistoryData,
} from '../../../util/bridge/hooks/useBridgeTxHistoryData';
import BaseBridgeActivityItemTxSegments from '../Bridge/components/TransactionDetails/BridgeActivityItemTxSegments';
import BadgeWrapper from '../../../component-library/components/Badges/BadgeWrapper';
import Badge, {
  BadgeVariant,
} from '../../../component-library/components/Badges/Badge';
import { NetworkBadgeSource } from '../AssetOverview/Balance/Balance';
import Routes from '../../../constants/navigation/Routes';
import {
  getFontFamily,
  TextVariant,
} from '../../../component-library/components/Texts/Text';
import { getBridgeTxActivityTitle } from '../Bridge/utils/transaction-history';
import type { Colors, Theme } from '../../../util/theme/models';

interface LegacyComponentProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

type LegacyDetailsModal = React.ComponentType<LegacyComponentProps> & {
  Header: React.ComponentType<LegacyComponentProps>;
  Title: React.ComponentType<LegacyComponentProps>;
  CloseIcon: React.ComponentType<LegacyComponentProps>;
};

const StatusText =
  BaseStatusText as unknown as React.ComponentType<LegacyComponentProps>;
const DetailsModal = BaseDetailsModal as unknown as LegacyDetailsModal;
const BridgeActivityItemTxSegments =
  BaseBridgeActivityItemTxSegments as unknown as React.ComponentType<LegacyComponentProps>;

interface InternalAccount {
  address: string;
  metadata: {
    importTime?: number;
  };
}

interface OwnProps {
  tx: TransactionMeta & { isSmartTransaction?: boolean };
  txChainId?: string;
  selectedAddress?: string;
  tokens?: Record<string, unknown>;
  collectibleContracts?: Record<string, unknown>[];
  contractExchangeRates?: Record<string, { price: number }>;
  conversionRate?: number;
  currentCurrency?: string;
  assetSymbol?: string;
  i?: number;
  selectedInternalAccount?: InternalAccount;
  swapsTransactions?: Record<string, unknown>;
  swapsTokens?: SwapsToken[] | null;
  signQRTransaction?: (tx: TransactionMeta) => void;
  cancelUnsignedQRTransaction?: (tx: TransactionMeta) => void;
  isQRHardwareAccount?: boolean;
  isLedgerAccount?: boolean;
  signLedgerTransaction?: (tx: TransactionMeta) => void;
  onPressItem?: (id: string, index?: number) => void;
  onSpeedUpAction?: (
    visible: boolean,
    existingGas?: Record<string, unknown>,
    tx?: TransactionMeta,
  ) => void;
  onCancelAction?: (
    visible: boolean,
    existingGas?: Record<string, unknown>,
    tx?: TransactionMeta,
  ) => void;
  navigation: {
    navigate: (route: string, params?: Record<string, unknown>) => void;
  };
}

interface StateProps {
  networkConfigurationsByChainId: Record<string, { nativeCurrency?: string }>;
  primaryCurrency: string;
  selectedInternalAccount?: InternalAccount;
  swapsTransactions?: Record<string, unknown>;
  swapsTokens?: SwapsToken[] | null;
}

interface Props extends OwnProps, StateProps {
  bridgeTxHistoryData: {
    bridgeTxHistoryItem?: Record<string, unknown>;
    isBridgeComplete?: boolean | null;
  };
}

interface State {
  actionKey?: string;
  cancelIsOpen: boolean;
  speedUpIsOpen: boolean;
  detailsModalVisible: boolean;
  importModalVisible: boolean;
  transactionGas: {
    gasBN?: unknown;
    gasPriceBN?: unknown;
    gasTotal?: unknown;
  };
  transactionElement?: TransactionElementData;
  transactionDetails?: TransactionDetailsData;
}

const createStyles = (colors: Colors, typography: Theme['typography']) =>
  StyleSheet.create({
    row: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    actionContainerStyle: {
      height: 25,
      padding: 0,
    },
    speedupActionContainerStyle: {
      marginRight: 10,
    },
    actionStyle: {
      fontSize: 10,
      padding: 0,
      paddingHorizontal: 10,
    },
    icon: {
      width: 32,
      height: 32,
    },
    summaryWrapper: {
      padding: 15,
    },
    fromDeviceText: {
      color: colors.text.alternative,
      fontSize: 14,
      marginBottom: 10,
      ...fontStyles.normal,
    },
    importText: {
      color: colors.text.alternative,
      fontSize: 14,
      ...fontStyles.bold,
      alignContent: 'center',
    },
    importRowBody: {
      alignItems: 'center',
      backgroundColor: colors.background.alternative,
      paddingTop: 10,
    },
    listItemDate: {
      marginBottom: 0,
      paddingBottom: 0,
    },
    listItemContent: {
      alignItems: 'flex-start',
      marginTop: 0,
      paddingTop: 0,
    },
    listItemTitle: {
      ...(typography.sBodyLGMedium as TextStyle),
      fontFamily: getFontFamily(TextVariant.BodyLGMedium),
      marginTop: 0,
    },
    listItemStatus: {
      ...(typography.sBodyMDBold as TextStyle),
      fontFamily: getFontFamily(TextVariant.BodyMDBold),
    },
    listItemFiatAmount: {
      ...(typography.sBodyLGMedium as TextStyle),
      fontFamily: getFontFamily(TextVariant.BodyLGMedium),
      marginTop: 0,
    },
    listItemAmount: {
      ...(typography.sBodyMD as TextStyle),
      fontFamily: getFontFamily(TextVariant.BodyMD),
      color: colors.text.alternative,
    },
    infoIcon: {
      color: colors.text.muted,
    },
  });

import transactionIconApprove from '../../../images/transaction-icons/approve.png';
import transactionIconInteraction from '../../../images/transaction-icons/interaction.png';
import transactionIconSent from '../../../images/transaction-icons/send.png';
import transactionIconReceived from '../../../images/transaction-icons/receive.png';
import transactionIconSwap from '../../../images/transaction-icons/swap.png';
import transactionIconApproveFailed from '../../../images/transaction-icons/approve-failed.png';
import transactionIconInteractionFailed from '../../../images/transaction-icons/interaction-failed.png';
import transactionIconSentFailed from '../../../images/transaction-icons/send-failed.png';
import transactionIconReceivedFailed from '../../../images/transaction-icons/receive-failed.png';
import transactionIconSwapFailed from '../../../images/transaction-icons/swap-failed.png';

/**
 * View that renders a transaction item part of transactions list
 */
class TransactionElement extends PureComponent<Props, State> {
  state: State = {
    actionKey: undefined,
    cancelIsOpen: false,
    speedUpIsOpen: false,
    detailsModalVisible: false,
    importModalVisible: false,
    transactionGas: {
      gasBN: undefined,
      gasPriceBN: undefined,
      gasTotal: undefined,
    },
    transactionElement: undefined,
    transactionDetails: undefined,
  };

  mounted = false;

  componentDidMount = async () => {
    const [transactionElement, transactionDetails] = await decodeTransaction({
      ...this.props,
      swapsTransactions: this.props.swapsTransactions,
      swapsTokens: this.props.swapsTokens,
      assetSymbol: this.props.assetSymbol,
      txChainId: this.props.txChainId as string,
      networkConfigurationsByChainId: this.props.networkConfigurationsByChainId,
    } as unknown as DecodeTransactionArgs);
    this.mounted = true;

    this.mounted && this.setState({ transactionElement, transactionDetails });
  };

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.txChainId !== this.props.txChainId ||
      prevProps.swapsTransactions !== this.props.swapsTransactions ||
      prevProps.swapsTokens !== this.props.swapsTokens
    ) {
      this.componentDidMount();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  onPressItem = () => {
    const { tx, i, onPressItem } = this.props;
    onPressItem?.(tx.id, i);
    if (tx.type === 'bridge') {
      this.props.navigation.navigate(Routes.BRIDGE.BRIDGE_TRANSACTION_DETAILS, {
        evmTxMeta: tx,
      });
    } else {
      this.setState({ detailsModalVisible: true });
    }
  };

  onPressImportWalletTip = () => {
    this.setState({ importModalVisible: true });
  };

  onCloseImportWalletModal = () => {
    this.setState({ importModalVisible: false });
  };

  onCloseDetailsModal = () => {
    this.setState({ detailsModalVisible: false });
  };

  renderTxTime = () => {
    const { tx, selectedInternalAccount } = this.props;
    const selectedAddress = safeToChecksumAddress(
      selectedInternalAccount?.address ?? '',
    );
    const incoming =
      safeToChecksumAddress(tx.txParams.to ?? '') === selectedAddress;
    const selfSent =
      incoming &&
      safeToChecksumAddress(tx.txParams.from ?? '') === selectedAddress;
    return `${
      (!incoming || selfSent) && tx.deviceConfirmedOn === WalletDevice.MM_MOBILE
        ? `#${parseInt(tx.txParams.nonce as string, 16)} - ${toDateFormat(
            tx.time,
          )} ${strings(
            'transactions.from_device_label',
            // eslint-disable-next-line no-mixed-spaces-and-tabs
          )}`
        : `${toDateFormat(tx.time)}
      `
    }`;
  };

  /**
   * Function that evaluates tx to see if the Added Wallet label should be rendered.
   * @returns Account added to wallet view
   */
  renderImportTime = () => {
    const { tx, selectedInternalAccount } = this.props;
    const { colors, typography } = this.context as Theme;
    const styles = createStyles(colors, typography);
    const accountImportTime = selectedInternalAccount?.metadata.importTime;
    if (
      (tx as TransactionMeta & { insertImportTime?: boolean })
        .insertImportTime &&
      accountImportTime
    ) {
      return (
        <>
          <TouchableOpacity
            onPress={this.onPressImportWalletTip}
            style={styles.importRowBody}
          >
            <Text style={styles.importText}>
              {`${strings('transactions.import_wallet_row')} `}
              <FAIcon name="info-circle" style={styles.infoIcon} />
            </Text>
            <ListItem.Date>{toDateFormat(accountImportTime)}</ListItem.Date>
          </TouchableOpacity>
        </>
      );
    }
    return null;
  };

  renderTxElementIcon = (
    transactionElement: TransactionElementData,
    status: string,
    chainId: string,
  ) => {
    const { transactionType } = transactionElement;
    const { colors, typography } = this.context as Theme;
    const styles = createStyles(colors, typography);

    const isFailedTransaction = status === 'cancelled' || status === 'failed';
    let icon;
    switch (transactionType) {
      case TRANSACTION_TYPES.SENT_TOKEN:
      case TRANSACTION_TYPES.SENT_COLLECTIBLE:
      case TRANSACTION_TYPES.SENT:
        icon = isFailedTransaction
          ? transactionIconSentFailed
          : transactionIconSent;
        break;
      case TRANSACTION_TYPES.RECEIVED_TOKEN:
      case TRANSACTION_TYPES.RECEIVED_COLLECTIBLE:
      case TRANSACTION_TYPES.RECEIVED:
        icon = isFailedTransaction
          ? transactionIconReceivedFailed
          : transactionIconReceived;
        break;
      case TRANSACTION_TYPES.SITE_INTERACTION:
        icon = isFailedTransaction
          ? transactionIconInteractionFailed
          : transactionIconInteraction;
        break;
      case TRANSACTION_TYPES.SWAPS_TRANSACTION:
        icon = isFailedTransaction
          ? transactionIconSwapFailed
          : transactionIconSwap;
        break;
      case TRANSACTION_TYPES.BRIDGE_TRANSACTION:
        icon = isFailedTransaction
          ? transactionIconSwapFailed
          : transactionIconSwap;
        break;
      case TRANSACTION_TYPES.APPROVE:
      case TRANSACTION_TYPES.INCREASE_ALLOWANCE:
      case TRANSACTION_TYPES.SET_APPROVAL_FOR_ALL:
        icon = isFailedTransaction
          ? transactionIconApproveFailed
          : transactionIconApprove;
        break;
    }
    return (
      <BadgeWrapper
        badgeElement={
          <Badge
            variant={BadgeVariant.Network}
            imageSource={NetworkBadgeSource(chainId as `0x${string}`)}
          />
        }
      >
        <Image
          source={icon}
          style={styles.icon as ImageStyle}
          resizeMode="stretch"
        />
      </BadgeWrapper>
    );
  };

  /**
   * Renders an horizontal bar with basic tx information
   *
   * @param {object} transactionElement - Transaction information to render, containing addressTo, actionKey, value, fiatValue, contractDeployment
   */
  renderTxElement = (transactionElement: TransactionElementData) => {
    const {
      selectedInternalAccount,
      isQRHardwareAccount,
      isLedgerAccount,
      i,
      tx: { time, status, isSmartTransaction, chainId, type },
      bridgeTxHistoryData: { bridgeTxHistoryItem, isBridgeComplete },
    } = this.props;
    const isBridgeTransaction = type === 'bridge';
    const { colors, typography } = this.context as Theme;
    const styles = createStyles(colors, typography);
    const { value, fiatValue = false, actionKey } = transactionElement;
    const renderNormalActions =
      (status === 'submitted' ||
        (status === 'approved' && !isQRHardwareAccount && !isLedgerAccount)) &&
      !isSmartTransaction &&
      !isBridgeTransaction;
    const renderUnsignedQRActions =
      status === 'approved' && isQRHardwareAccount;
    const renderLedgerActions = status === 'approved' && isLedgerAccount;
    const accountImportTime = selectedInternalAccount?.metadata.importTime;
    let title = actionKey;
    if (isBridgeTransaction && bridgeTxHistoryItem) {
      title =
        getBridgeTxActivityTitle(
          bridgeTxHistoryItem as unknown as Parameters<
            typeof getBridgeTxActivityTitle
          >[0],
        ) ?? title;
    }
    return (
      <>
        {accountImportTime !== undefined &&
          accountImportTime > time &&
          this.renderImportTime()}
        <ListItem>
          <ListItem.Date style={styles.listItemDate}>
            {this.renderTxTime()}
          </ListItem.Date>
          <ListItem.Content style={styles.listItemContent}>
            <ListItem.Icon>
              {this.renderTxElementIcon(transactionElement, status, chainId)}
            </ListItem.Icon>
            <ListItem.Body>
              <ListItem.Title numberOfLines={1} style={styles.listItemTitle}>
                {title}
              </ListItem.Title>
              {!FINAL_NON_CONFIRMED_STATUSES.includes(status as never) &&
              isBridgeTransaction &&
              !isBridgeComplete ? (
                <BridgeActivityItemTxSegments
                  bridgeTxHistoryItem={bridgeTxHistoryItem}
                  transactionStatus={this.props.tx.status}
                />
              ) : (
                <StatusText
                  testID={`transaction-status-${i}`}
                  status={status}
                  style={styles.listItemStatus}
                />
              )}
            </ListItem.Body>
            {Boolean(value) && (
              <ListItem.Amounts>
                {!isTestNet(chainId) && (
                  <ListItem.FiatAmount style={styles.listItemFiatAmount}>
                    {fiatValue}
                  </ListItem.FiatAmount>
                )}
                <ListItem.Amount style={styles.listItemAmount}>
                  {value}
                </ListItem.Amount>
              </ListItem.Amounts>
            )}
          </ListItem.Content>
          {renderNormalActions && (
            <ListItem.Actions>
              {this.renderSpeedUpButton()}
              {this.renderCancelButton()}
            </ListItem.Actions>
          )}
          {renderUnsignedQRActions && (
            <ListItem.Actions>
              {this.renderQRSignButton()}
              {this.renderCancelUnsignedButton()}
            </ListItem.Actions>
          )}
          {renderLedgerActions && (
            <ListItem.Actions>{this.renderLedgerSignButton()}</ListItem.Actions>
          )}
        </ListItem>
        {accountImportTime !== undefined &&
          accountImportTime <= time &&
          this.renderImportTime()}
      </>
    );
  };

  renderCancelButton = () => {
    const { colors, typography } = this.context as Theme;
    const styles = createStyles(colors, typography);

    return (
      <StyledButton
        type={'cancel'}
        containerStyle={styles.actionContainerStyle}
        style={styles.actionStyle}
        onPress={this.showCancelModal}
      >
        {strings('transaction.cancel')}
      </StyledButton>
    );
  };

  parseGas = () => {
    const { tx } = this.props;

    let existingGas = {};
    const transaction = tx?.txParams;
    if (transaction) {
      if (isEIP1559Transaction(transaction)) {
        existingGas = {
          isEIP1559Transaction: true,
          maxFeePerGas: weiHexToGweiDec(transaction.maxFeePerGas as string),
          maxPriorityFeePerGas: weiHexToGweiDec(
            transaction.maxPriorityFeePerGas as string,
          ),
        };
      } else {
        const existingGasPrice = tx.txParams ? tx.txParams.gasPrice : '0x0';
        const existingGasPriceDecimal = parseInt(
          existingGasPrice === undefined ? '0x0' : existingGasPrice,
          16,
        );
        existingGas = { gasPrice: existingGasPriceDecimal };
      }
    }
    return existingGas;
  };

  showCancelModal = () => {
    const existingGas = this.parseGas();

    this.mounted &&
      this.props.onCancelAction?.(true, existingGas, this.props.tx);
  };

  showSpeedUpModal = () => {
    const existingGas = this.parseGas();

    this.mounted &&
      this.props.onSpeedUpAction?.(true, existingGas, this.props.tx);
  };

  hideSpeedUpModal = () => {
    this.mounted && this.props.onSpeedUpAction?.(false);
  };

  showQRSigningModal = () => {
    this.mounted && this.props.signQRTransaction?.(this.props.tx);
  };

  showLedgerSigninModal = () => {
    this.mounted && this.props.signLedgerTransaction?.(this.props.tx);
  };

  cancelUnsignedQRTransaction = () => {
    this.mounted && this.props.cancelUnsignedQRTransaction?.(this.props.tx);
  };

  renderSpeedUpButton = () => {
    const { colors, typography } = this.context as Theme;
    const styles = createStyles(colors, typography);

    return (
      <StyledButton
        type={'normal'}
        containerStyle={[
          styles.actionContainerStyle,
          styles.speedupActionContainerStyle,
        ]}
        style={styles.actionStyle}
        onPress={this.showSpeedUpModal}
      >
        {strings('transaction.speedup')}
      </StyledButton>
    );
  };

  renderQRSignButton = () => {
    const { colors, typography } = this.context as Theme;
    const styles = createStyles(colors, typography);
    return (
      <StyledButton
        type={'normal'}
        containerStyle={[
          styles.actionContainerStyle,
          styles.speedupActionContainerStyle,
        ]}
        style={styles.actionStyle}
        onPress={this.showQRSigningModal}
      >
        {strings('transaction.sign_with_keystone')}
      </StyledButton>
    );
  };

  renderLedgerSignButton = () => {
    const { colors, typography } = this.context as Theme;
    const styles = createStyles(colors, typography);
    return (
      <StyledButton
        type={'normal'}
        containerStyle={[
          styles.actionContainerStyle,
          styles.speedupActionContainerStyle,
        ]}
        style={styles.actionStyle}
        onPress={this.showLedgerSigninModal}
      >
        {strings('transaction.sign_with_ledger')}
      </StyledButton>
    );
  };

  renderCancelUnsignedButton = () => {
    const { colors, typography } = this.context as Theme;
    const styles = createStyles(colors, typography);
    return (
      <StyledButton
        type={'cancel'}
        containerStyle={[
          styles.actionContainerStyle,
          styles.speedupActionContainerStyle,
        ]}
        style={styles.actionStyle}
        onPress={this.cancelUnsignedQRTransaction}
      >
        {strings('transaction.cancel')}
      </StyledButton>
    );
  };

  render() {
    const { tx } = this.props;
    const {
      detailsModalVisible,
      importModalVisible,
      transactionElement,
      transactionDetails,
    } = this.state;

    const { colors, typography } = this.context as Theme;
    const styles = createStyles(colors, typography);

    if (!transactionElement || !transactionDetails) return null;
    return (
      <>
        <TouchableHighlight
          style={styles.row}
          onPress={this.onPressItem}
          underlayColor={colors.background.alternative}
          activeOpacity={1}
        >
          {this.renderTxElement(transactionElement)}
        </TouchableHighlight>
        {detailsModalVisible && (
          <Modal
            isVisible={detailsModalVisible}
            onBackdropPress={this.onCloseDetailsModal}
            onBackButtonPress={this.onCloseDetailsModal}
            onSwipeComplete={this.onCloseDetailsModal}
            swipeDirection={'down'}
            backdropColor={colors.overlay.default}
            backdropOpacity={1}
          >
            <DetailsModal>
              <DetailsModal.Header>
                <DetailsModal.Title onPress={this.onCloseDetailsModal}>
                  {transactionElement?.actionKey}
                </DetailsModal.Title>
                <DetailsModal.CloseIcon onPress={this.onCloseDetailsModal} />
              </DetailsModal.Header>
              <TransactionDetails
                transactionObject={tx}
                transactionDetails={transactionDetails}
                showSpeedUpModal={this.showSpeedUpModal}
                showCancelModal={this.showCancelModal}
                close={this.onCloseDetailsModal}
              />
            </DetailsModal>
          </Modal>
        )}
        <Modal
          isVisible={importModalVisible}
          onBackdropPress={this.onCloseImportWalletModal}
          onBackButtonPress={this.onCloseImportWalletModal}
          onSwipeComplete={this.onCloseImportWalletModal}
          swipeDirection={'down'}
          backdropColor={colors.overlay.default}
          backdropOpacity={1}
        >
          <DetailsModal>
            <DetailsModal.Header>
              <DetailsModal.Title onPress={this.onCloseImportWalletModal}>
                {strings('transactions.import_wallet_label')}
              </DetailsModal.Title>
              <DetailsModal.CloseIcon onPress={this.onCloseImportWalletModal} />
            </DetailsModal.Header>
            <View style={styles.summaryWrapper}>
              <Text style={styles.fromDeviceText}>
                {strings('transactions.import_wallet_tip')}
              </Text>
            </View>
          </DetailsModal>
        </Modal>
      </>
    );
  }
}

const mapStateToProps = (state: import('../../../reducers').RootState) => ({
  networkConfigurationsByChainId:
    selectEvmNetworkConfigurationsByChainId(state),
  selectedInternalAccount: selectSelectedInternalAccount(state),
  primaryCurrency: selectPrimaryCurrency(state) as string,
  swapsTransactions: selectSwapsTransactions(state),
  swapsTokens: swapsControllerTokens(state),
});

TransactionElement.contextType = ThemeContext;

// Create a wrapper functional component
interface TransactionElementOwnProps
  extends Omit<Props, 'bridgeTxHistoryData'> {}

const TransactionElementWithBridge = (props: TransactionElementOwnProps) => {
  const bridgeTxHistoryData = useBridgeTxHistoryData({
    evmTxMeta: props.tx,
  });

  return (
    <TransactionElement {...props} bridgeTxHistoryData={bridgeTxHistoryData} />
  );
};

export default connect(mapStateToProps)(TransactionElementWithBridge);
