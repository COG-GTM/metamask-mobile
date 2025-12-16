import React, { PureComponent } from 'react';
import {
  TouchableOpacity,
  TouchableHighlight,
  StyleSheet,
  Image,
  Text,
  View,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ImageSourcePropType,
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
import decodeTransaction from './utils';
import { TRANSACTION_TYPES } from '../../../util/transactions';
import ListItem from '../../Base/ListItem';
import StatusText from '../../Base/StatusText';
import DetailsModal from '../../Base/DetailsModal';
import { isTestNet } from '../../../util/networks';
import { weiHexToGweiDec } from '@metamask/controller-utils';
import {
  WalletDevice,
  isEIP1559Transaction,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { ThemeContext, mockTheme } from '../../../util/theme';
import {
  selectChainId,
  selectEvmNetworkConfigurationsByChainId,
  selectEvmTicker,
} from '../../../selectors/networkController';
import { selectSelectedInternalAccount } from '../../../selectors/accountsController';
import { selectPrimaryCurrency } from '../../../selectors/settings';
import { selectSwapsTransactions } from '../../../selectors/transactionController';
import { swapsControllerTokens } from '../../../reducers/swaps';
import {
  FINAL_NON_CONFIRMED_STATUSES,
  useBridgeTxHistoryData,
} from '../../../util/bridge/hooks/useBridgeTxHistoryData';
import BridgeActivityItemTxSegments from '../Bridge/components/TransactionDetails/BridgeActivityItemTxSegments';
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
import { RootState } from '../../../reducers';
import { InternalAccount } from '@metamask/keyring-api';
import { Theme } from '../../../util/theme/models';

interface Styles {
  row: ViewStyle;
  actionContainerStyle: ViewStyle;
  speedupActionContainerStyle: ViewStyle;
  actionStyle: TextStyle;
  icon: ImageStyle;
  summaryWrapper: ViewStyle;
  fromDeviceText: TextStyle;
  importText: TextStyle;
  importRowBody: ViewStyle;
  listItemDate: ViewStyle;
  listItemContent: ViewStyle;
  listItemTitle: TextStyle;
  listItemStatus: TextStyle;
  listItemFiatAmount: TextStyle;
  listItemAmount: TextStyle;
  infoIcon?: TextStyle;
}

interface TransactionElementProps {
  assetSymbol?: string;
  tx: TransactionMeta & {
    insertImportTime?: boolean;
    type?: string;
    isSmartTransaction?: boolean;
    deviceConfirmedOn?: string;
  };
  selectedInternalAccount: InternalAccount;
  i: number;
  onPressItem: (id: string, index: number) => void;
  onSpeedUpAction?: (
    isOpen: boolean,
    existingGas?: ExistingGas,
    tx?: TransactionMeta,
  ) => void;
  onCancelAction?: (
    isOpen: boolean,
    existingGas?: ExistingGas,
    tx?: TransactionMeta,
  ) => void;
  swapsTransactions: Record<string, unknown>;
  swapsTokens: Array<{ address?: string; symbol?: string; decimals?: number }>;
  signQRTransaction?: (tx: TransactionMeta) => void;
  cancelUnsignedQRTransaction?: (tx: TransactionMeta) => void;
  isQRHardwareAccount?: boolean;
  isLedgerAccount?: boolean;
  signLedgerTransaction?: (tx: TransactionMeta) => void;
  bridgeTxHistoryData: {
    bridgeTxHistoryItem?: unknown;
    isBridgeComplete?: boolean;
  };
  txChainId: string;
  networkConfigurationsByChainId: Record<string, { nativeCurrency?: string }>;
  navigation: {
    navigate: (route: string, params?: object) => void;
  };
}

interface TransactionElementState {
  actionKey: string | undefined;
  cancelIsOpen: boolean;
  speedUpIsOpen: boolean;
  detailsModalVisible: boolean;
  importModalVisible: boolean;
  transactionGas: {
    gasBN: unknown;
    gasPriceBN: unknown;
    gasTotal: unknown;
  };
  transactionElement: TransactionElementData | undefined;
  transactionDetails: TransactionDetailsData | undefined;
}

interface TransactionElementData {
  actionKey?: string;
  value?: string;
  fiatValue?: string | boolean;
  transactionType?: string;
  renderTo?: string;
  renderFrom?: string;
}

interface TransactionDetailsData {
  renderFrom?: string;
  renderTo?: string;
  hash?: string;
  renderValue?: string;
  renderGas?: string | number;
  renderGasPrice?: string;
  renderTotalGas?: string;
  summaryAmount?: string;
  summaryFee?: string;
  summaryTotalAmount?: string;
  summarySecondaryTotalAmount?: string;
  txChainId?: string;
  transactionType?: string;
}

interface ExistingGas {
  isEIP1559Transaction?: boolean;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPrice?: number;
}

const createStyles = (
  colors: Theme['colors'],
  typography: Theme['typography'],
): Styles =>
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
      ...typography.sBodyLGMedium,
      fontFamily: getFontFamily(TextVariant.BodyLGMedium),
      marginTop: 0,
    },
    listItemStatus: {
      ...typography.sBodyMDBold,
      fontFamily: getFontFamily(TextVariant.BodyMDBold),
    },
    listItemFiatAmount: {
      ...typography.sBodyLGMedium,
      fontFamily: getFontFamily(TextVariant.BodyLGMedium),
      marginTop: 0,
    },
    listItemAmount: {
      ...typography.sBodyMD,
      fontFamily: getFontFamily(TextVariant.BodyMD),
      color: colors.text.alternative,
    },
  });

/* eslint-disable import/no-commonjs */
const transactionIconApprove = require('../../../images/transaction-icons/approve.png');
const transactionIconInteraction = require('../../../images/transaction-icons/interaction.png');
const transactionIconSent = require('../../../images/transaction-icons/send.png');
const transactionIconReceived = require('../../../images/transaction-icons/receive.png');
const transactionIconSwap = require('../../../images/transaction-icons/swap.png');

const transactionIconApproveFailed = require('../../../images/transaction-icons/approve-failed.png');
const transactionIconInteractionFailed = require('../../../images/transaction-icons/interaction-failed.png');
const transactionIconSentFailed = require('../../../images/transaction-icons/send-failed.png');
const transactionIconReceivedFailed = require('../../../images/transaction-icons/receive-failed.png');
const transactionIconSwapFailed = require('../../../images/transaction-icons/swap-failed.png');
/* eslint-enable import/no-commonjs */

/**
 * View that renders a transaction item part of transactions list
 */
class TransactionElement extends PureComponent<
  TransactionElementProps,
  TransactionElementState
> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  state: TransactionElementState = {
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

  componentDidMount = async (): Promise<void> => {
    const [transactionElement, transactionDetails] = await decodeTransaction({
      ...this.props,
      swapsTransactions: this.props.swapsTransactions as Record<string, unknown>,
      swapsTokens: this.props.swapsTokens,
      assetSymbol: this.props.assetSymbol,
      txChainId: this.props.txChainId,
      networkConfigurationsByChainId: this.props.networkConfigurationsByChainId,
      tx: this.props.tx,
      selectedAddress: safeToChecksumAddress(
        this.props.selectedInternalAccount?.address,
      ) || '',
      conversionRate: 0,
      currentCurrency: '',
      primaryCurrency: '',
    });
    this.mounted = true;

    this.mounted &&
      this.setState({
        transactionElement: transactionElement as TransactionElementData,
        transactionDetails: transactionDetails as TransactionDetailsData,
      });
  };

  componentDidUpdate(prevProps: TransactionElementProps): void {
    if (
      prevProps.txChainId !== this.props.txChainId ||
      prevProps.swapsTransactions !== this.props.swapsTransactions ||
      prevProps.swapsTokens !== this.props.swapsTokens
    ) {
      this.componentDidMount();
    }
  }

  componentWillUnmount(): void {
    this.mounted = false;
  }

  onPressItem = (): void => {
    const { tx, i, onPressItem } = this.props;
    onPressItem(tx.id, i);
    if (tx.type === 'bridge') {
      this.props.navigation.navigate(Routes.BRIDGE.BRIDGE_TRANSACTION_DETAILS, {
        evmTxMeta: tx,
      });
    } else {
      this.setState({ detailsModalVisible: true });
    }
  };

  onPressImportWalletTip = (): void => {
    this.setState({ importModalVisible: true });
  };

  onCloseImportWalletModal = (): void => {
    this.setState({ importModalVisible: false });
  };

  onCloseDetailsModal = (): void => {
    this.setState({ detailsModalVisible: false });
  };

  renderTxTime = (): string => {
    const { tx, selectedInternalAccount } = this.props;
    const selectedAddress = safeToChecksumAddress(
      selectedInternalAccount?.address,
    );
    const incoming =
      safeToChecksumAddress(tx.txParams.to as string) === selectedAddress;
    const selfSent =
      incoming &&
      safeToChecksumAddress(tx.txParams.from as string) === selectedAddress;
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
  renderImportTime = (): React.ReactElement | null => {
    const { tx, selectedInternalAccount } = this.props;
    const { colors, typography } = this.context || mockTheme;
    const styles = createStyles(colors, typography);
    const accountImportTime = selectedInternalAccount?.metadata.importTime;
    if (tx.insertImportTime && accountImportTime) {
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
  ): React.ReactElement => {
    const { transactionType } = transactionElement;
    const { colors, typography } = this.context || mockTheme;
    const styles = createStyles(colors, typography);

    const isFailedTransaction = status === 'cancelled' || status === 'failed';
    let icon: ImageSourcePropType;
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
      default:
        icon = transactionIconInteraction;
    }
    return (
      <BadgeWrapper
        badgeElement={
          <Badge
            variant={BadgeVariant.Network}
            imageSource={NetworkBadgeSource(chainId)}
          />
        }
      >
        <Image source={icon} style={styles.icon} resizeMode="stretch" />
      </BadgeWrapper>
    );
  };

  /**
   * Renders an horizontal bar with basic tx information
   *
   * @param transactionElement - Transaction information to render, containing addressTo, actionKey, value, fiatValue, contractDeployment
   */
  renderTxElement = (
    transactionElement: TransactionElementData,
  ): React.ReactElement => {
    const {
      selectedInternalAccount,
      isQRHardwareAccount,
      isLedgerAccount,
      i,
      tx: { time, status, isSmartTransaction, chainId, type },
      bridgeTxHistoryData: { bridgeTxHistoryItem, isBridgeComplete },
    } = this.props;
    const isBridgeTransaction = type === 'bridge';
    const { colors, typography } = this.context || mockTheme;
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
      title = getBridgeTxActivityTitle(bridgeTxHistoryItem) ?? title;
    }
    return (
      <>
        {accountImportTime && accountImportTime > (time || 0) && this.renderImportTime()}
        <ListItem>
          <ListItem.Date style={styles.listItemDate}>
            {this.renderTxTime()}
          </ListItem.Date>
          <ListItem.Content style={styles.listItemContent}>
            <ListItem.Icon>
              {this.renderTxElementIcon(
                transactionElement,
                status as string,
                chainId as string,
              )}
            </ListItem.Icon>
            <ListItem.Body>
              <ListItem.Title numberOfLines={1} style={styles.listItemTitle}>
                {title}
              </ListItem.Title>
              {!FINAL_NON_CONFIRMED_STATUSES.includes(status as string) &&
              isBridgeTransaction &&
              !isBridgeComplete ? (
                <BridgeActivityItemTxSegments
                  bridgeTxHistoryItem={bridgeTxHistoryItem}
                  transactionStatus={this.props.tx.status}
                />
              ) : (
                <StatusText
                  testID={`transaction-status-${i}`}
                  status={status as string}
                  style={styles.listItemStatus}
                />
              )}
            </ListItem.Body>
            {Boolean(value) && (
              <ListItem.Amounts>
                {!isTestNet(chainId as string) && (
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
        {accountImportTime && accountImportTime <= (time || 0) && this.renderImportTime()}
      </>
    );
  };

  renderCancelButton = (): React.ReactElement => {
    const { colors, typography } = this.context || mockTheme;
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

  parseGas = (): ExistingGas => {
    const { tx } = this.props;

    let existingGas: ExistingGas = {};
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
        const existingGasPrice = tx.txParams
          ? (tx.txParams.gasPrice as string)
          : '0x0';
        const existingGasPriceDecimal = parseInt(
          existingGasPrice === undefined ? '0x0' : existingGasPrice,
          16,
        );
        existingGas = { gasPrice: existingGasPriceDecimal };
      }
    }
    return existingGas;
  };

  showCancelModal = (): void => {
    const existingGas = this.parseGas();

    this.mounted &&
      this.props.onCancelAction?.(true, existingGas, this.props.tx);
  };

  showSpeedUpModal = (): void => {
    const existingGas = this.parseGas();

    this.mounted &&
      this.props.onSpeedUpAction?.(true, existingGas, this.props.tx);
  };

  hideSpeedUpModal = (): void => {
    this.mounted && this.props.onSpeedUpAction?.(false);
  };

  showQRSigningModal = (): void => {
    this.mounted && this.props.signQRTransaction?.(this.props.tx);
  };

  showLedgerSigninModal = (): void => {
    this.mounted && this.props.signLedgerTransaction?.(this.props.tx);
  };

  cancelUnsignedQRTransaction = (): void => {
    this.mounted && this.props.cancelUnsignedQRTransaction?.(this.props.tx);
  };

  renderSpeedUpButton = (): React.ReactElement => {
    const { colors, typography } = this.context || mockTheme;
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

  renderQRSignButton = (): React.ReactElement => {
    const { colors, typography } = this.context || mockTheme;
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

  renderLedgerSignButton = (): React.ReactElement => {
    const { colors, typography } = this.context || mockTheme;
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

  renderCancelUnsignedButton = (): React.ReactElement => {
    const { colors, typography } = this.context || mockTheme;
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

  render(): React.ReactElement | null {
    const { tx } = this.props;
    const {
      detailsModalVisible,
      importModalVisible,
      transactionElement,
      transactionDetails,
    } = this.state;

    const { colors, typography } = this.context || mockTheme;
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

const mapStateToProps = (
  state: RootState,
): {
  networkConfigurationsByChainId: Record<string, { nativeCurrency?: string }>;
  selectedInternalAccount: InternalAccount;
  primaryCurrency: string;
  swapsTransactions: Record<string, unknown>;
  swapsTokens: Array<{ address?: string; symbol?: string; decimals?: number }>;
} => ({
  networkConfigurationsByChainId:
    selectEvmNetworkConfigurationsByChainId(state),
  selectedInternalAccount: selectSelectedInternalAccount(state),
  primaryCurrency: selectPrimaryCurrency(state),
  swapsTransactions: selectSwapsTransactions(state) as Record<string, unknown>,
  swapsTokens: swapsControllerTokens(state) as Array<{
    address?: string;
    symbol?: string;
    decimals?: number;
  }>,
});

// Create a wrapper functional component
interface TransactionElementWithBridgeProps
  extends Omit<TransactionElementProps, 'bridgeTxHistoryData'> {
  tx: TransactionMeta & {
    insertImportTime?: boolean;
    type?: string;
    isSmartTransaction?: boolean;
    deviceConfirmedOn?: string;
  };
}

const TransactionElementWithBridge: React.FC<
  TransactionElementWithBridgeProps
> = (props) => {
  const bridgeTxHistoryData = useBridgeTxHistoryData({ evmTxMeta: props.tx });

  return (
    <TransactionElement {...props} bridgeTxHistoryData={bridgeTxHistoryData} />
  );
};

export default connect(mapStateToProps)(TransactionElementWithBridge);
