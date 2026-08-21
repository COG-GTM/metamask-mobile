import React, { PureComponent } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { query } from '@metamask/controller-utils';
import { connect } from 'react-redux';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

import { fontStyles } from '../../../../styles/common';
import { strings } from '../../../../../locales/i18n';
import {
  getBlockExplorerName,
  isMainNet,
  isMultiLayerFeeNetwork,
  getBlockExplorerTxUrl,
  findBlockExplorerForNonEvmChainId,
  isLineaMainnetChainId,
} from '../../../../util/networks';
import Logger from '../../../../util/Logger';
import EthereumAddress from '../../EthereumAddress';
import TransactionSummary from '../../../Views/TransactionSummary';
import { toDateFormat } from '../../../../util/date';
import StyledButton from '../../StyledButton';
import StatusTextBase from '../../../Base/StatusText';
import TextBase from '../../../../component-library/components/Texts/Text';
import DetailsModalBase from '../../../Base/DetailsModal';
import { RPC, NO_RPC_BLOCK_EXPLORER } from '../../../../constants/network';
import {
  withNavigation,
  type CompatNavigationProp,
} from '@react-navigation/compat';
import { ThemeContext, mockTheme } from '../../../../util/theme';
import { Theme } from '@metamask/design-tokens';
import decodeTransaction, {
  DecodableTransaction,
  TransactionDetailsType,
} from '../../TransactionElement/utils';
import {
  selectChainId,
  selectNetworkConfigurations,
  selectEvmTicker,
} from '../../../../selectors/networkController';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../../selectors/currencyRateController';
import { selectTokensByAddress } from '../../../../selectors/tokensController';
import { selectContractExchangeRates } from '../../../../selectors/tokenRatesController';
import { selectSelectedInternalAccountFormattedAddress } from '../../../../selectors/accountsController';
import { regex } from '../../../../../app/util/regex';
import { selectShouldUseSmartTransaction } from '../../../../selectors/smartTransactionsController';
import { selectPrimaryCurrency } from '../../../../selectors/settings';
import {
  selectSwapsTransactions,
  selectTransactions,
} from '../../../../selectors/transactionController';
import { swapsControllerTokens } from '../../../../reducers/swaps';
import { getGlobalEthQuery } from '../../../../util/networks/global-network';
import { isNonEvmChainId } from '../../../../core/Multichain/utils';
import Avatar, {
  AvatarSize,
  AvatarVariant,
} from '../../../../component-library/components/Avatars/Avatar';
import { AvatarAccountType } from '../../../../component-library/components/Avatars/Avatar/variants/AvatarAccount';
import { WalletViewSelectorsIDs } from '../../../../../e2e/selectors/wallet/WalletView.selectors';
import {
  LINEA_MAINNET_BLOCK_EXPLORER,
  LINEA_SEPOLIA_BLOCK_EXPLORER,
  MAINNET_BLOCK_EXPLORER,
  SEPOLIA_BLOCK_EXPLORER,
} from '../../../../constants/urls';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { isCaipChainId, isStrictHexString } from '@metamask/utils';
import { RootState } from '../../../../reducers';

interface StyledSectionProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * `DetailsModal`, `StatusText` and the legacy `small`/`primary` text props come
 * from untyped modules, so they are described here for consumption from
 * TypeScript.
 */
const DetailsModal = DetailsModalBase as unknown as {
  Body: React.ComponentType<StyledSectionProps>;
  Section: React.ComponentType<
    StyledSectionProps & { borderBottom?: boolean }
  >;
  SectionTitle: React.ComponentType<StyledSectionProps & { upper?: boolean }>;
  Column: React.ComponentType<StyledSectionProps & { end?: boolean }>;
};

const StatusText = StatusTextBase as unknown as React.ComponentType<{
  status?: string;
  context?: string;
  testID?: string;
}>;

const Text = TextBase as React.ComponentType<
  React.ComponentProps<typeof TextBase> & {
    small?: boolean;
    primary?: boolean;
  }
>;

interface TransactionObject extends Omit<DecodableTransaction, 'txParams'> {
  txParams?: DecodableTransaction['txParams'];
  time?: number;
  networkID?: string;
}

interface TransactionDetailsNavigation {
  push: (name: string, params?: object) => void;
}

interface TransactionReceipt {
  l1Fee?: string;
}

/**
 * Block explorer fields of the EVM network configurations, which the
 * multichain network configuration type does not describe.
 */
interface BlockExplorerConfiguration {
  blockExplorerUrls?: string[];
  defaultBlockExplorerUrlIndex?: number;
}

interface OwnProps {
  /**
  /* navigation object required to push new views
  */
  navigation: TransactionDetailsNavigation;
  /**
   * Object corresponding to a transaction, containing transaction object, networkId and transaction hash string
   */
  transactionObject: TransactionObject;
  /**
   * Object with information to render
   */
  transactionDetails: TransactionDetailsType;
  /**
   * Callback to close the view
   */
  close?: () => void;
  /**
   * A string representing the network name
   */
  showSpeedUpModal?: () => void;
  showCancelModal?: () => void;
}

interface StateProps {
  chainId: ReturnType<typeof selectChainId>;
  networkConfigurations: Record<
    string,
    | (ReturnType<
        typeof selectNetworkConfigurations
      >[string] &
        BlockExplorerConfiguration)
    | undefined
  >;
  selectedAddress: ReturnType<
    typeof selectSelectedInternalAccountFormattedAddress
  >;
  transactions: ReturnType<typeof selectTransactions>;
  ticker: ReturnType<typeof selectEvmTicker>;
  tokens: ReturnType<typeof selectTokensByAddress>;
  contractExchangeRates: ReturnType<typeof selectContractExchangeRates>;
  conversionRate: ReturnType<typeof selectConversionRate>;
  currentCurrency: ReturnType<typeof selectCurrentCurrency>;
  primaryCurrency: ReturnType<typeof selectPrimaryCurrency>;
  swapsTransactions: ReturnType<typeof selectSwapsTransactions>;
  swapsTokens: ReturnType<typeof swapsControllerTokens>;
  /**
   * Boolean that indicates if smart transaction should be used
   */
  shouldUseSmartTransaction: boolean;
}

interface TransactionDetailsProps extends OwnProps, StateProps {}

/**
 * Legacy call sites render this component with loosely typed transaction data,
 * which carries fields this component does not read.
 */
/**
 * Detail fields legacy call sites still pass but this component does not read.
 */
interface LegacyTransactionDetails extends TransactionDetailsType {
  transactionHash?: string;
  renderTotalValue?: string;
  renderTotalValueFiat?: string;
}

interface TransactionDetailsPublicProps
  extends Omit<
    OwnProps,
    'navigation' | 'transactionObject' | 'transactionDetails'
  > {
  /**
   * Injected by the `withNavigation` HOC when the caller does not provide it.
   */
  navigation?: TransactionDetailsNavigation;
  transactionObject: Partial<TransactionObject> & Record<string, unknown>;
  /**
   * Call sites render this view before the transaction has been decoded.
   */
  transactionDetails?: LegacyTransactionDetails;
  chainId?: string;
}

interface TransactionDetailsState {
  rpcBlockExplorer?: string;
  renderTxActions: boolean;
  updatedTransactionDetails?: TransactionDetailsType;
}

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    viewOnEtherscan: {
      fontSize: 16,
      color: colors.primary.default,
      ...fontStyles.normal,
      textAlign: 'center',
    },
    touchableViewOnEtherscan: {
      marginBottom: 24,
      marginTop: 12,
    },
    summaryWrapper: {
      marginVertical: 8,
    },
    actionContainerStyle: {
      height: 25,
      width: 70,
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
    transactionActionsContainer: {
      flexDirection: 'row',
      paddingTop: 10,
    },
    cellAccount: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
    accountNameLabel: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountNameAvatar: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    accountAvatar: {
      marginRight: 8,
    },
  });

/**
 * View that renders a transaction details as part of transactions list
 */
class TransactionDetails extends PureComponent<
  TransactionDetailsProps,
  TransactionDetailsState
> {
  state: TransactionDetailsState = {
    rpcBlockExplorer: undefined,
    renderTxActions: true,
    updatedTransactionDetails: undefined,
  };

  fetchTxReceipt = async (
    transactionHash: string,
  ): Promise<TransactionReceipt> => {
    const ethQuery = getGlobalEthQuery();
    return await query(ethQuery, 'getTransactionReceipt', [transactionHash]);
  };

  /**
   * Returns the appropriate block explorer URL for a given chain
   */
  getBlockExplorerForChain = (
    chainId: StateProps['chainId'],
    txChainId: TransactionObject['chainId'],
    networkConfigurations: StateProps['networkConfigurations'],
  ): string => {
    const networkConfiguration = txChainId
      ? networkConfigurations?.[txChainId]
      : undefined;
    const { blockExplorerUrls, defaultBlockExplorerUrlIndex } =
      networkConfiguration ?? {};

    // First check for network configuration block explorer
    let blockExplorer =
      (defaultBlockExplorerUrlIndex === undefined
        ? undefined
        : blockExplorerUrls?.[defaultBlockExplorerUrlIndex]) ||
      NO_RPC_BLOCK_EXPLORER;

    // Check for default block explorers based on chain ID
    if (isMainNet(txChainId ?? '')) {
      blockExplorer = MAINNET_BLOCK_EXPLORER;
    } else if (isLineaMainnetChainId(txChainId ?? '')) {
      blockExplorer = LINEA_MAINNET_BLOCK_EXPLORER;
    } else if (txChainId === CHAIN_IDS.LINEA_SEPOLIA) {
      blockExplorer = LINEA_SEPOLIA_BLOCK_EXPLORER;
    } else if (txChainId === CHAIN_IDS.SEPOLIA) {
      blockExplorer = SEPOLIA_BLOCK_EXPLORER;
    }

    // Check for non-EVM chain block explorer
    if (isCaipChainId(chainId) && isNonEvmChainId(chainId)) {
      blockExplorer =
        findBlockExplorerForNonEvmChainId(chainId) ?? NO_RPC_BLOCK_EXPLORER;
    }

    return blockExplorer;
  };

  /**
   * Updates transactionDetails for multilayer fee networks (e.g. for Optimism).
   */
  updateTransactionDetails = async () => {
    const {
      transactionObject,
      transactionDetails,
      selectedAddress,
      ticker,
      chainId,
      conversionRate,
      currentCurrency,
      contractExchangeRates,
      tokens,
      primaryCurrency,
      swapsTransactions,
      swapsTokens,
      transactions,
    } = this.props;
    const { txParams } = transactionObject;
    const multiLayerFeeNetwork = isMultiLayerFeeNetwork(chainId);
    const transactionHash = transactionDetails?.hash;
    if (!multiLayerFeeNetwork || !transactionHash || !txParams) {
      this.setState({ updatedTransactionDetails: transactionDetails });
      return;
    }
    try {
      let { l1Fee: multiLayerL1FeeTotal } = await this.fetchTxReceipt(
        transactionHash,
      );
      if (!multiLayerL1FeeTotal) {
        multiLayerL1FeeTotal = '0x0'; // Sets it to 0 if it's not available in a txReceipt yet.
      }
      txParams.multiLayerL1FeeTotal = multiLayerL1FeeTotal;
      const decodedTx = await decodeTransaction({
        tx: { ...transactionObject, txParams },
        selectedAddress,
        ticker,
        chainId,
        conversionRate,
        currentCurrency,
        transactions,
        contractExchangeRates,
        tokens,
        primaryCurrency:
          typeof primaryCurrency === 'string' ? primaryCurrency : undefined,
        swapsTransactions,
        swapsTokens,
      });
      this.setState({ updatedTransactionDetails: decodedTx[1] });
    } catch (e) {
      Logger.error(e as Error);
      this.setState({ updatedTransactionDetails: transactionDetails });
    }
  };

  componentDidMount = () => {
    const {
      transactionObject: { chainId: txChainId },
      chainId,
      networkConfigurations,
    } = this.props;

    const blockExplorer = this.getBlockExplorerForChain(
      chainId,
      txChainId,
      networkConfigurations,
    );
    this.setState({ rpcBlockExplorer: blockExplorer });
    this.updateTransactionDetails();
  };

  viewOnEtherscan = () => {
    const {
      navigation,
      transactionObject: { networkID },
      transactionDetails: { hash },
      close,
    } = this.props;
    const { rpcBlockExplorer } = this.state;
    try {
      const { url, title } = getBlockExplorerTxUrl(
        RPC,
        hash as string,
        rpcBlockExplorer,
      );
      navigation.push('Webview', {
        screen: 'SimpleWebview',
        params: { url, title },
      });
      close && close();
    } catch (e) {
      // eslint-disable-next-line no-console
      Logger.error(e as Error, {
        message: `can't get a block explorer link for network `,
        networkID,
      });
    }
  };

  getStyles = () => {
    const colors = (this.context as Theme)?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  showSpeedUpModal = () => {
    const { showSpeedUpModal, close } = this.props;
    if (close) {
      close();
      showSpeedUpModal?.();
    }
  };

  showCancelModal = () => {
    const { showCancelModal, close } = this.props;
    if (close) {
      close();
      showCancelModal?.();
    }
  };

  renderSpeedUpButton = () => {
    const styles = this.getStyles();

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

  renderCancelButton = () => {
    const styles = this.getStyles();

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

  render = () => {
    const {
      chainId,
      transactionObject: { status, time, txParams },
      shouldUseSmartTransaction,
    } = this.props;
    const { updatedTransactionDetails } = this.state;
    const styles = this.getStyles();

    const renderTxActions =
      (status === 'submitted' || status === 'approved') &&
      !shouldUseSmartTransaction;
    const { rpcBlockExplorer } = this.state;

    return updatedTransactionDetails ? (
      <DetailsModal.Body>
        <DetailsModal.Section borderBottom>
          <DetailsModal.Column>
            <DetailsModal.SectionTitle>
              {strings('transactions.status')}
            </DetailsModal.SectionTitle>
            <StatusText status={status} />
            {!!renderTxActions &&
              updatedTransactionDetails?.txChainId === chainId && (
                <View style={styles.transactionActionsContainer}>
                  {this.renderSpeedUpButton()}
                  {this.renderCancelButton()}
                </View>
              )}
          </DetailsModal.Column>
          <DetailsModal.Column end>
            <DetailsModal.SectionTitle>
              {strings('transactions.date')}
            </DetailsModal.SectionTitle>
            <Text small primary>
              {toDateFormat(time)}
            </Text>
          </DetailsModal.Column>
        </DetailsModal.Section>
        <DetailsModal.Section borderBottom={!!txParams?.nonce}>
          <DetailsModal.Column>
            <DetailsModal.SectionTitle>
              {strings('transactions.from')}
            </DetailsModal.SectionTitle>
            <View style={styles.cellAccount}>
              <View style={styles.accountNameLabel}>
                <View style={styles.accountNameAvatar}>
                  <Avatar
                    variant={AvatarVariant.Account}
                    type={AvatarAccountType.JazzIcon}
                    accountAddress={updatedTransactionDetails.renderFrom as string}
                    size={AvatarSize.Md}
                    style={styles.accountAvatar}
                  />
                  <Text
                    small
                    primary
                    testID={WalletViewSelectorsIDs.ACCOUNT_NAME_LABEL_TEXT}
                  >
                    <EthereumAddress
                      type="short"
                      address={updatedTransactionDetails.renderFrom}
                    />
                  </Text>
                </View>
              </View>
            </View>
          </DetailsModal.Column>
          <DetailsModal.Column end>
            <DetailsModal.SectionTitle>
              {strings('transactions.to')}
            </DetailsModal.SectionTitle>
            <View style={styles.cellAccount}>
              <View style={styles.accountNameLabel}>
                <View style={styles.accountNameAvatar}>
                  <Avatar
                    variant={AvatarVariant.Account}
                    type={AvatarAccountType.JazzIcon}
                    accountAddress={updatedTransactionDetails.renderFrom as string}
                    size={AvatarSize.Md}
                    style={styles.accountAvatar}
                  />
                  <Text
                    small
                    primary
                    testID={WalletViewSelectorsIDs.ACCOUNT_NAME_LABEL_TEXT}
                  >
                    <EthereumAddress
                      type="short"
                      address={updatedTransactionDetails.renderTo}
                    />
                  </Text>
                </View>
              </View>
            </View>
          </DetailsModal.Column>
        </DetailsModal.Section>
        <DetailsModal.Section>
          <DetailsModal.Column>
            <DetailsModal.SectionTitle upper>
              {strings('transactions.nonce')}
            </DetailsModal.SectionTitle>
            {!!txParams?.nonce && (
              <Text small primary>{`#${parseInt(
                txParams.nonce.replace(regex.transactionNonce, ''),
                16,
              )}`}</Text>
            )}
          </DetailsModal.Column>
        </DetailsModal.Section>
        <View
          style={[
            styles.summaryWrapper,
            !txParams?.nonce && styles.touchableViewOnEtherscan,
          ]}
        >
          <TransactionSummary
            amount={updatedTransactionDetails.summaryAmount}
            fee={updatedTransactionDetails.summaryFee}
            totalAmount={updatedTransactionDetails.summaryTotalAmount}
            secondaryTotalAmount={
              isMainNet(chainId)
                ? updatedTransactionDetails.summarySecondaryTotalAmount
                : undefined
            }
            gasEstimationReady
            transactionType={updatedTransactionDetails.transactionType}
            chainId={chainId}
          />
        </View>
        {updatedTransactionDetails.hash &&
          status !== 'cancelled' &&
          rpcBlockExplorer &&
          rpcBlockExplorer !== NO_RPC_BLOCK_EXPLORER && (
            <TouchableOpacity
              onPress={this.viewOnEtherscan}
              style={styles.touchableViewOnEtherscan}
            >
              <Text style={styles.viewOnEtherscan}>
                {`${strings('transactions.view_on')} ${getBlockExplorerName(
                  rpcBlockExplorer,
                )}`}
              </Text>
            </TouchableOpacity>
          )}
      </DetailsModal.Body>
    ) : null;
  };
}

const mapStateToProps = (
  state: RootState,
  ownProps: OwnProps,
): StateProps => ({
  chainId: selectChainId(state),
  networkConfigurations: selectNetworkConfigurations(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  transactions: selectTransactions(state),
  ticker: selectEvmTicker(state),
  tokens: selectTokensByAddress(state),
  contractExchangeRates: selectContractExchangeRates(state),
  conversionRate: selectConversionRate(state),
  currentCurrency: selectCurrentCurrency(state),
  primaryCurrency: selectPrimaryCurrency(state),
  swapsTransactions: selectSwapsTransactions(state),
  swapsTokens: swapsControllerTokens(state),
  shouldUseSmartTransaction: selectShouldUseSmartTransaction(
    state,
    isStrictHexString(ownProps.transactionObject.chainId)
      ? ownProps.transactionObject.chainId
      : undefined,
  ),
});

TransactionDetails.contextType = ThemeContext;

/**
 * `withNavigation` resolves the props of the component it wraps to `never`, so
 * the injected navigation prop and the resulting props are described here.
 */
const TransactionDetailsWithNavigation = withNavigation(
  TransactionDetails as unknown as React.ComponentType<{
    navigation: CompatNavigationProp<NavigationProp<ParamListBase>>;
  }>,
) as unknown as React.ComponentType<TransactionDetailsProps>;

export default connect(mapStateToProps)(
  TransactionDetailsWithNavigation,
) as unknown as React.ComponentType<TransactionDetailsPublicProps>;
