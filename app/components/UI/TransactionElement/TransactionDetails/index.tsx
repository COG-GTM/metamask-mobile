import React, { PureComponent } from 'react';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import PropTypes from 'prop-types';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { query } from '@metamask/controller-utils';
import { connect } from 'react-redux';

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
import StatusText from '../../../Base/StatusText';
import Text from '../../../../component-library/components/Texts/Text';
import DetailsModal from '../../../Base/DetailsModal';
import { RPC, NO_RPC_BLOCK_EXPLORER } from '../../../../constants/network';
import { withNavigation } from '@react-navigation/compat';
import { ThemeContext, mockTheme } from '../../../../util/theme';
import { Theme } from '../../../../util/theme/models';
import { RootState } from '../../../../reducers';
import decodeTransaction, {
  type SwapTransaction,
  type TokenLike,
  type TransactionLike,
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

interface RenderedTransactionDetails {
  renderFrom?: string;
  renderTo?: string;
  hash?: string;
  summaryAmount?: string;
  summaryFee?: string;
  summaryTotalAmount?: string;
  summarySecondaryTotalAmount?: string;
  transactionType?: string;
  txChainId?: string;
  [key: string]: unknown;
}

interface NetworkConfiguration {
  blockExplorerUrls: string[];
  defaultBlockExplorerUrlIndex: number;
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
interface TransactionDetailsProps {
  navigation:
    | NavigationProp<ParamListBase>
    | {
        push: (...args: never[]) => unknown;
      };
  chainId: string;
  transactionObject: {
    chainId: string;
    networkID: string;
    status: string;
    txParams?: {
      nonce?: string;
      multiLayerL1FeeTotal?: string;
      [key: string]: string | undefined;
    };
    [key: string]: unknown;
  };
  transactionDetails: RenderedTransactionDetails;
  networkConfigurations: Record<string, NetworkConfiguration>;
  close?: () => void;
  showSpeedUpModal?: () => void;
  showCancelModal?: () => void;
  selectedAddress: string;
  transactions: unknown[];
  ticker: string;
  tokens: Record<string, unknown>;
  contractExchangeRates: Record<string, { price?: number }>;
  conversionRate: number;
  currentCurrency: string;
  swapsTransactions: Record<string, unknown>;
  swapsTokens: unknown[];
  primaryCurrency: string;
  shouldUseSmartTransaction: boolean;
}

interface TransactionDetailsState {
  rpcBlockExplorer?: string;
  renderTxActions: boolean;
  updatedTransactionDetails?: RenderedTransactionDetails;
}

class TransactionDetails extends PureComponent<
  TransactionDetailsProps,
  TransactionDetailsState
> {
  static propTypes = {
    /**
    /* navigation object required to push new views
    */
    navigation: PropTypes.object,
    /**
     * Chain Id
     */
    chainId: PropTypes.string,
    /**
     * Object corresponding to a transaction, containing transaction object, networkId and transaction hash string
     */
    transactionObject: PropTypes.object,
    /**
     * Object with information to render
     */
    transactionDetails: PropTypes.object,
    /**
     * Network configurations
     */
    networkConfigurations: PropTypes.object,
    /**
     * Callback to close the view
     */
    close: PropTypes.func,
    /**
     * A string representing the network name
     */
    showSpeedUpModal: PropTypes.func,
    showCancelModal: PropTypes.func,
    selectedAddress: PropTypes.string,
    transactions: PropTypes.array,
    ticker: PropTypes.string,
    tokens: PropTypes.object,
    contractExchangeRates: PropTypes.object,
    conversionRate: PropTypes.number,
    currentCurrency: PropTypes.string,
    swapsTransactions: PropTypes.object,
    swapsTokens: PropTypes.array,
    primaryCurrency: PropTypes.string,

    /**
     * Boolean that indicates if smart transaction should be used
     */
    shouldUseSmartTransaction: PropTypes.bool,
  };

  state: TransactionDetailsState = {
    rpcBlockExplorer: undefined,
    renderTxActions: true,
    updatedTransactionDetails: undefined,
  };

  fetchTxReceipt = async (transactionHash: string) => {
    const ethQuery = getGlobalEthQuery();
    return await query(ethQuery, 'getTransactionReceipt', [transactionHash]);
  };

  /**
   * Returns the appropriate block explorer URL for a given chain
   * @param {string} chainId - The chain ID to get the block explorer for
   * @param {string} txChainId - The transaction chain ID
   * @param {Object} networkConfigurations - The network configurations object
   * @returns {string} The block explorer URL
   */
  getBlockExplorerForChain = (
    chainId: string,
    txChainId: string,
    networkConfigurations: Record<string, NetworkConfiguration>,
  ) => {
    // First check for network configuration block explorer
    let blockExplorer =
      networkConfigurations?.[txChainId]?.blockExplorerUrls[
        networkConfigurations[txChainId]?.defaultBlockExplorerUrlIndex
      ] || NO_RPC_BLOCK_EXPLORER;

    // Check for default block explorers based on chain ID
    if (isMainNet(txChainId)) {
      blockExplorer = MAINNET_BLOCK_EXPLORER;
    } else if (isLineaMainnetChainId(txChainId)) {
      blockExplorer = LINEA_MAINNET_BLOCK_EXPLORER;
    } else if (txChainId === CHAIN_IDS.LINEA_SEPOLIA) {
      blockExplorer = LINEA_SEPOLIA_BLOCK_EXPLORER;
    } else if (txChainId === CHAIN_IDS.SEPOLIA) {
      blockExplorer = SEPOLIA_BLOCK_EXPLORER;
    }

    // Check for non-EVM chain block explorer
    if (isNonEvmChainId(chainId)) {
      blockExplorer = findBlockExplorerForNonEvmChainId(chainId);
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
    const multiLayerFeeNetwork = isMultiLayerFeeNetwork(chainId);
    const transactionHash = transactionDetails?.hash;
    if (
      !multiLayerFeeNetwork ||
      !transactionHash ||
      !transactionObject.txParams
    ) {
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
      transactionObject.txParams.multiLayerL1FeeTotal = multiLayerL1FeeTotal;
      const decodedTx = await decodeTransaction({
        // @ts-expect-error Preserve the loosely shaped transaction object passed by the legacy screen.
        tx: transactionObject as TransactionLike,
        selectedAddress,
        ticker,
        chainId,
        conversionRate,
        currentCurrency,
        transactions,
        contractExchangeRates,
        tokens: tokens as Record<string, TokenLike>,
        primaryCurrency,
        swapsTransactions: swapsTransactions as Record<string, SwapTransaction>,
        swapsTokens: swapsTokens as TokenLike[],
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
      // @ts-expect-error Legacy navigation exposes push at runtime.
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
      (showSpeedUpModal as () => void)();
    }
  };

  showCancelModal = () => {
    const { showCancelModal, close } = this.props;
    if (close) {
      close();
      (showCancelModal as () => void)();
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
      /* @ts-expect-error Legacy JS modal body requires style despite accepting omitted runtime props. */
      <DetailsModal.Body>
        {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
        <DetailsModal.Section borderBottom>
          {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
          <DetailsModal.Column>
            {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
            <DetailsModal.SectionTitle>
              {strings('transactions.status')}
            </DetailsModal.SectionTitle>
            {/* @ts-expect-error Preserve the legacy StatusText props. */}
            <StatusText status={status} />
            {!!renderTxActions &&
              updatedTransactionDetails?.txChainId === chainId && (
                <View style={styles.transactionActionsContainer}>
                  {this.renderSpeedUpButton()}
                  {this.renderCancelButton()}
                </View>
              )}
          </DetailsModal.Column>
          {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
          <DetailsModal.Column end>
            {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
            <DetailsModal.SectionTitle>
              {strings('transactions.date')}
            </DetailsModal.SectionTitle>
            {/* @ts-expect-error Preserve the legacy Text props used by this component. */}
            <Text small primary>
              {toDateFormat(time)}
            </Text>
          </DetailsModal.Column>
        </DetailsModal.Section>
        {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
        <DetailsModal.Section borderBottom={!!txParams?.nonce}>
          {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
          <DetailsModal.Column>
            {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
            <DetailsModal.SectionTitle>
              {strings('transactions.from')}
            </DetailsModal.SectionTitle>
            <View style={styles.cellAccount}>
              <View style={styles.accountNameLabel}>
                <View style={styles.accountNameAvatar}>
                  <Avatar
                    variant={AvatarVariant.Account}
                    // @ts-expect-error Preserve the legacy AvatarAccountType.Jazzicon value.
                    type={AvatarAccountType.Jazzicon}
                    accountAddress={
                      updatedTransactionDetails.renderFrom as string
                    }
                    size={AvatarSize.Md}
                    style={styles.accountAvatar}
                  />
                  <Text
                    // @ts-expect-error Preserve the legacy Text props used by this component.
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
          {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
          <DetailsModal.Column end>
            {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
            <DetailsModal.SectionTitle>
              {strings('transactions.to')}
            </DetailsModal.SectionTitle>
            <View style={styles.cellAccount}>
              <View style={styles.accountNameLabel}>
                <View style={styles.accountNameAvatar}>
                  <Avatar
                    variant={AvatarVariant.Account}
                    // @ts-expect-error Preserve the legacy AvatarAccountType.Jazzicon value.
                    type={AvatarAccountType.Jazzicon}
                    accountAddress={
                      updatedTransactionDetails.renderFrom as string
                    }
                    size={AvatarSize.Md}
                    style={styles.accountAvatar}
                  />
                  {/* Preserve the legacy Text props used by this component. */}
                  <Text
                    // @ts-expect-error Preserve the legacy Text props used by this component.
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
        {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
        <DetailsModal.Section>
          {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
          <DetailsModal.Column>
            {/* @ts-expect-error Legacy JS modal component accepts the original omitted style props. */}
            <DetailsModal.SectionTitle upper>
              {strings('transactions.nonce')}
            </DetailsModal.SectionTitle>
            {!!txParams?.nonce && (
              // @ts-expect-error Preserve the legacy Text props used by this component.
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

type TransactionDetailsStateProps = Pick<
  TransactionDetailsProps,
  | 'chainId'
  | 'networkConfigurations'
  | 'selectedAddress'
  | 'transactions'
  | 'ticker'
  | 'tokens'
  | 'contractExchangeRates'
  | 'conversionRate'
  | 'currentCurrency'
  | 'primaryCurrency'
  | 'swapsTransactions'
  | 'swapsTokens'
  | 'shouldUseSmartTransaction'
>;
type TransactionDetailsOwnProps = Pick<
  TransactionDetailsProps,
  | 'navigation'
  | 'chainId'
  | 'transactionObject'
  | 'transactionDetails'
  | 'showSpeedUpModal'
  | 'showCancelModal'
  | 'close'
>;
const mapStateToProps = (
  state: RootState,
  ownProps: TransactionDetailsOwnProps,
): TransactionDetailsStateProps => ({
  chainId: selectChainId(state),
  networkConfigurations: selectNetworkConfigurations(state) as Record<
    string,
    NetworkConfiguration
  >,
  selectedAddress: selectSelectedInternalAccountFormattedAddress(
    state,
  ) as string,
  transactions: selectTransactions(state),
  ticker: selectEvmTicker(state),
  tokens: selectTokensByAddress(state),
  contractExchangeRates: selectContractExchangeRates(state),
  conversionRate: selectConversionRate(state) as number,
  currentCurrency: selectCurrentCurrency(state) as string,
  primaryCurrency: selectPrimaryCurrency(state) as string,
  swapsTransactions: selectSwapsTransactions(state),
  swapsTokens: swapsControllerTokens(state) as TokenLike[],
  shouldUseSmartTransaction: selectShouldUseSmartTransaction(
    state,
    ownProps.transactionObject.chainId as `0x${string}`,
  ),
});

TransactionDetails.contextType = ThemeContext;

export default connect(mapStateToProps)(
  withNavigation<
    NavigationProp<ParamListBase>,
    // @ts-expect-error The compat HOC requires a private navigation subtype.
    TransactionDetailsProps,
    React.ComponentType<TransactionDetailsProps>
  >(TransactionDetails),
);
