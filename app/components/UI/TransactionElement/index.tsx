import React, { PureComponent } from 'react';
import {
  TouchableOpacity,
  TouchableHighlight,
  StyleSheet,
  Image,
  Text,
  type TextStyle,
  View,
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
/* eslint-disable @typescript-eslint/no-unused-vars */
import { isMainNet, isTestNet } from '../../../util/networks';
import { weiHexToGweiDec } from '@metamask/controller-utils';
import {
  WalletDevice,
  isEIP1559Transaction,
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
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../constants/bridge';
import { decimalToHex } from '../../../util/conversions';
import { addHexPrefix } from '../../../util/number';
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
import {
  formatChainIdToCaip,
  formatChainIdToHex,
  isSolanaChainId,
} from '@metamask/bridge-controller';
import { getBridgeTxActivityTitle } from '../Bridge/utils/transaction-history';
/* eslint-enable @typescript-eslint/no-unused-vars */
import type { RootState } from '../../../reducers';
import type { Theme } from '../../../util/theme/models';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';

const createStyles = (
  colors: Theme['colors'],
  typography: Theme['typography'],
) =>
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
      ...(fontStyles.normal as TextStyle),
    },
    importText: {
      color: colors.text.alternative,
      fontSize: 14,
      ...(fontStyles.bold as TextStyle),
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
  });

/* eslint-disable import/no-commonjs, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
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
/* eslint-enable import/no-commonjs, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */

interface TransactionParams {
  to?: string;
  from?: string;
  data?: string;
  nonce?: string | number;
  gas?: string;
  gasPrice?: string;
  gasUsed?: string;
  estimatedBaseFee?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  [key: string]: unknown;
}

interface Transaction {
  id?: string;
  type?: string;
  txParams: TransactionParams;
  time?: number;
  status?: string;
  chainId: string;
  deviceConfirmedOn?: string;
  isSmartTransaction?: boolean;
  insertImportTime?: boolean;
  [key: string]: unknown;
}

interface SelectedInternalAccount {
  address?: string;
  metadata?: {
    importTime?: number;
  };
}

interface TransactionElementData {
  [key: string]: unknown;
  transactionType?: string;
  actionKey?: string;
  value?: string;
  fiatValue?: string | false;
  contractDeployment?: boolean;
}

interface TransactionDetailsData {
  [key: string]: unknown;
}

interface BridgeTxHistoryData {
  bridgeTxHistoryItem?: BridgeHistoryItem;
  isBridgeComplete: boolean | null;
}

interface Navigation {
  navigate: (route: string, params: { evmTxMeta: Transaction }) => void;
}

interface TransactionElementProps {
  assetSymbol?: string;
  tx: Transaction;
  selectedInternalAccount?: SelectedInternalAccount;
  i?: number;
  onPressItem?: (id?: string, index?: number) => void;
  onSpeedUpAction?: (
    isVisible: boolean,
    existingGas?: Record<string, unknown>,
    tx?: Transaction,
  ) => void;
  onCancelAction?: (
    isVisible: boolean,
    existingGas?: Record<string, unknown>,
    tx?: Transaction,
  ) => void;
  swapsTransactions?: Record<string, unknown>;
  swapsTokens?: unknown[];
  signQRTransaction?: (tx: Transaction) => void;
  cancelUnsignedQRTransaction?: (tx: Transaction) => void;
  isQRHardwareAccount?: boolean;
  isLedgerAccount?: boolean;
  signLedgerTransaction?: (tx: Transaction) => void;
  bridgeTxHistoryData: BridgeTxHistoryData;
  txChainId?: string;
  networkConfigurationsByChainId?: Record<string, Record<string, unknown>>;
  navigation?: Navigation;
  primaryCurrency?: unknown;
}

interface TransactionElementState {
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

type LegacyCompoundComponent = React.ComponentType<
  React.PropsWithChildren<Record<string, unknown>>
>;

const LegacyListItem = ListItem as unknown as LegacyCompoundComponent & {
  Date: LegacyCompoundComponent;
  Content: LegacyCompoundComponent;
  Icon: LegacyCompoundComponent;
  Body: LegacyCompoundComponent;
  Title: LegacyCompoundComponent;
  Amounts: LegacyCompoundComponent;
  FiatAmount: LegacyCompoundComponent;
  Amount: LegacyCompoundComponent;
  Actions: LegacyCompoundComponent;
};

const LegacyDetailsModal =
  DetailsModal as unknown as LegacyCompoundComponent & {
    Header: LegacyCompoundComponent;
    Title: LegacyCompoundComponent;
    CloseIcon: LegacyCompoundComponent;
  };

const LegacyStatusText = StatusText as unknown as LegacyCompoundComponent;

/**
 * View that renders a transaction item part of transactions list
 */
class TransactionElement extends PureComponent<
  TransactionElementProps,
  TransactionElementState
> {
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

  componentDidMount = async () => {
    const [transactionElement, transactionDetails] = await decodeTransaction({
      ...this.props,
      swapsTransactions: this.props.swapsTransactions,
      swapsTokens: this.props.swapsTokens,
      assetSymbol: this.props.assetSymbol,
      txChainId: this.props.txChainId,
      networkConfigurationsByChainId: this.props.networkConfigurationsByChainId,
    });
    this.mounted = true;

    this.mounted && this.setState({ transactionElement, transactionDetails });
  };

  componentDidUpdate(prevProps: TransactionElementProps) {
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
    (onPressItem as NonNullable<TransactionElementProps['onPressItem']>)(
      tx.id,
      i,
    );
    if (tx.type === 'bridge') {
      (this.props.navigation as Navigation).navigate(
        Routes.BRIDGE.BRIDGE_TRANSACTION_DETAILS,
        {
          evmTxMeta: tx,
        },
      );
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
      selectedInternalAccount?.address as string,
    );
    const incoming =
      safeToChecksumAddress(tx.txParams.to as string) === selectedAddress;
    const selfSent =
      incoming &&
      safeToChecksumAddress(tx.txParams.from as string) === selectedAddress;
    return `${
      (!incoming || selfSent) && tx.deviceConfirmedOn === WalletDevice.MM_MOBILE
        ? `#${parseInt(String(tx.txParams.nonce), 16)} - ${toDateFormat(
            tx.time as number,
          )} ${strings(
            'transactions.from_device_label',
            // eslint-disable-next-line no-mixed-spaces-and-tabs
          )}`
        : `${toDateFormat(tx.time as number)}
      `
    }`;
  };

  /**
   * Function that evaluates tx to see if the Added Wallet label should be rendered.
   * @returns Account added to wallet view
   */
  renderImportTime = () => {
    const { tx, selectedInternalAccount } = this.props;
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
    const styles = createStyles(colors, typography);
    const accountImportTime = selectedInternalAccount?.metadata?.importTime as
      | number
      | undefined;
    if (tx.insertImportTime && accountImportTime) {
      return (
        <>
          <TouchableOpacity
            onPress={this.onPressImportWalletTip}
            style={styles.importRowBody}
          >
            <Text style={styles.importText}>
              {`${strings('transactions.import_wallet_row')} `}
              <FAIcon
                name="info-circle"
                style={(styles as Record<string, unknown>).infoIcon as never}
              />
            </Text>
            <LegacyListItem.Date>
              {toDateFormat(accountImportTime)}
            </LegacyListItem.Date>
          </TouchableOpacity>
        </>
      );
    }
    return null;
  };

  renderTxElementIcon = (
    transactionElement: TransactionElementData,
    status: string | undefined,
    chainId: string,
  ) => {
    const { transactionType } = transactionElement;
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
    const styles = createStyles(colors, typography);

    const isFailedTransaction = status === 'cancelled' || status === 'failed';
    let icon: number | undefined;
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
          style={styles.icon as never}
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
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
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
    const accountImportTime = selectedInternalAccount?.metadata?.importTime as
      | number
      | undefined;
    let title = actionKey;
    if (isBridgeTransaction && bridgeTxHistoryItem) {
      title = getBridgeTxActivityTitle(bridgeTxHistoryItem) ?? title;
    }
    return (
      <>
        {(accountImportTime as number) > (time as number) &&
          this.renderImportTime()}
        <LegacyListItem>
          <LegacyListItem.Date style={styles.listItemDate}>
            {this.renderTxTime()}
          </LegacyListItem.Date>
          <LegacyListItem.Content style={styles.listItemContent}>
            <LegacyListItem.Icon>
              {this.renderTxElementIcon(transactionElement, status, chainId)}
            </LegacyListItem.Icon>
            <LegacyListItem.Body>
              <LegacyListItem.Title
                numberOfLines={1}
                style={styles.listItemTitle}
              >
                {title}
              </LegacyListItem.Title>
              {!FINAL_NON_CONFIRMED_STATUSES.includes(status as never) &&
              isBridgeTransaction &&
              !isBridgeComplete ? (
                <BridgeActivityItemTxSegments
                  bridgeTxHistoryItem={bridgeTxHistoryItem}
                  transactionStatus={this.props.tx.status as never}
                />
              ) : (
                <LegacyStatusText
                  testID={`transaction-status-${i}`}
                  status={status as never}
                  style={styles.listItemStatus}
                />
              )}
            </LegacyListItem.Body>
            {Boolean(value) && (
              <LegacyListItem.Amounts>
                {!isTestNet(chainId) && (
                  <LegacyListItem.FiatAmount style={styles.listItemFiatAmount}>
                    {fiatValue}
                  </LegacyListItem.FiatAmount>
                )}
                <LegacyListItem.Amount style={styles.listItemAmount}>
                  {value}
                </LegacyListItem.Amount>
              </LegacyListItem.Amounts>
            )}
          </LegacyListItem.Content>
          {renderNormalActions && (
            <LegacyListItem.Actions>
              {this.renderSpeedUpButton()}
              {this.renderCancelButton()}
            </LegacyListItem.Actions>
          )}
          {renderUnsignedQRActions && (
            <LegacyListItem.Actions>
              {this.renderQRSignButton()}
              {this.renderCancelUnsignedButton()}
            </LegacyListItem.Actions>
          )}
          {renderLedgerActions && (
            <LegacyListItem.Actions>
              {this.renderLedgerSignButton()}
            </LegacyListItem.Actions>
          )}
        </LegacyListItem>
        {(accountImportTime as number) <= (time as number) &&
          this.renderImportTime()}
      </>
    );
  };

  renderCancelButton = () => {
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
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

  parseGas = (): Record<string, unknown> => {
    const { tx } = this.props;

    let existingGas = {};
    const transaction = tx?.txParams;
    if (transaction) {
      if (isEIP1559Transaction(transaction as never)) {
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
      (
        this.props.onCancelAction as NonNullable<
          TransactionElementProps['onCancelAction']
        >
      )(true, existingGas, this.props.tx);
  };

  showSpeedUpModal = () => {
    const existingGas = this.parseGas();

    this.mounted &&
      (
        this.props.onSpeedUpAction as NonNullable<
          TransactionElementProps['onSpeedUpAction']
        >
      )(true, existingGas, this.props.tx);
  };

  hideSpeedUpModal = () => {
    this.mounted &&
      (
        this.props.onSpeedUpAction as NonNullable<
          TransactionElementProps['onSpeedUpAction']
        >
      )(false);
  };

  showQRSigningModal = () => {
    this.mounted &&
      (
        this.props.signQRTransaction as NonNullable<
          TransactionElementProps['signQRTransaction']
        >
      )(this.props.tx);
  };

  showLedgerSigninModal = () => {
    this.mounted &&
      (
        this.props.signLedgerTransaction as NonNullable<
          TransactionElementProps['signLedgerTransaction']
        >
      )(this.props.tx);
  };

  cancelUnsignedQRTransaction = () => {
    this.mounted &&
      (
        this.props.cancelUnsignedQRTransaction as NonNullable<
          TransactionElementProps['cancelUnsignedQRTransaction']
        >
      )(this.props.tx);
  };

  renderSpeedUpButton = () => {
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
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
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
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
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
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
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
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

    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
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
            <LegacyDetailsModal>
              <LegacyDetailsModal.Header>
                <LegacyDetailsModal.Title onPress={this.onCloseDetailsModal}>
                  {transactionElement?.actionKey}
                </LegacyDetailsModal.Title>
                <LegacyDetailsModal.CloseIcon
                  onPress={this.onCloseDetailsModal}
                />
              </LegacyDetailsModal.Header>
              <TransactionDetails
                transactionObject={tx}
                transactionDetails={transactionDetails}
                showSpeedUpModal={this.showSpeedUpModal}
                showCancelModal={this.showCancelModal}
                close={this.onCloseDetailsModal}
              />
            </LegacyDetailsModal>
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
          <LegacyDetailsModal>
            <LegacyDetailsModal.Header>
              <LegacyDetailsModal.Title onPress={this.onCloseImportWalletModal}>
                {strings('transactions.import_wallet_label')}
              </LegacyDetailsModal.Title>
              <LegacyDetailsModal.CloseIcon
                onPress={this.onCloseImportWalletModal}
              />
            </LegacyDetailsModal.Header>
            <View style={styles.summaryWrapper}>
              <Text style={styles.fromDeviceText}>
                {strings('transactions.import_wallet_tip')}
              </Text>
            </View>
          </LegacyDetailsModal>
        </Modal>
      </>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  networkConfigurationsByChainId:
    selectEvmNetworkConfigurationsByChainId(state),
  selectedInternalAccount: selectSelectedInternalAccount(state),
  primaryCurrency: selectPrimaryCurrency(state),
  swapsTransactions: selectSwapsTransactions(state),
  swapsTokens: swapsControllerTokens(state),
});

TransactionElement.contextType = ThemeContext;

// Create a wrapper functional component
const TransactionElementWithBridge = (
  props: Omit<TransactionElementProps, 'bridgeTxHistoryData'>,
) => {
  const bridgeTxHistoryData = useBridgeTxHistoryData({
    evmTxMeta: props.tx as never,
  });

  return (
    <TransactionElement {...props} bridgeTxHistoryData={bridgeTxHistoryData} />
  );
};

export default connect(mapStateToProps)(TransactionElementWithBridge);
