import React, { PureComponent } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Theme } from '@metamask/design-tokens';
import { query } from '@metamask/controller-utils';
import { connect } from 'react-redux';
import { RootState } from '../../../../reducers';
import { Colors } from '../../../../util/theme/models';

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
import decodeTransaction, {
  DecodeTransactionArgs,
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

interface NavigationLike {
  push: (screen: string, params?: object) => void;
}

interface TransactionTxParams {
  nonce?: string;
  multiLayerL1FeeTotal?: string;
  [key: string]: unknown;
}

interface TransactionObject {
  chainId?: string;
  networkID?: string;
  status?: string;
  time?: number;
  txParams?: TransactionTxParams;
  [key: string]: unknown;
}

interface TransactionDetailsData {
  hash?: string;
  txChainId?: string;
  renderFrom?: string;
  renderTo?: string;
  summaryAmount?: string;
  summaryFee?: string;
  summaryTotalAmount?: string;
  summarySecondaryTotalAmount?: string;
  transactionType?: string;
  [key: string]: unknown;
}

interface NetworkConfigurationEntry {
  blockExplorerUrls: string[];
  defaultBlockExplorerUrlIndex: number;
  [key: string]: unknown;
}

type NetworkConfigurations = Record<string, NetworkConfigurationEntry>;

interface OwnProps {
  /**
   * navigation object required to push new views
   */
  navigation?: NavigationLike;
  /**
   * Object corresponding to a transaction, containing transaction object, networkId and transaction hash string
   */
  transactionObject: TransactionObject;
  /**
   * Object with information to render
   */
  transactionDetails?: TransactionDetailsData;
  /**
   * Callback to close the view
   */
  close?: () => void;
  showSpeedUpModal?: () => void;
  showCancelModal?: () => void;
}

interface StateProps {
  chainId: string;
  networkConfigurations: NetworkConfigurations;
  selectedAddress?: string;
  transactions: unknown[];
  ticker?: string;
  tokens: Record<string, unknown>;
  contractExchangeRates: Record<string, unknown>;
  conversionRate?: number;
  currentCurrency: string;
  swapsTransactions: Record<string, unknown>;
  swapsTokens: unknown[];
  primaryCurrency: string;
  /**
   * Boolean that indicates if smart transaction should be used
   */
  shouldUseSmartTransaction: boolean;
}

type TransactionDetailsProps = OwnProps & StateProps;

interface TransactionDetailsState {
  rpcBlockExplorer?: string;
  renderTxActions: boolean;
  updatedTransactionDetails?: TransactionDetailsData;
}

const createStyles = (colors: Colors) =>
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

const LegacyText = Text as unknown as React.ComponentType<{
  children?: React.ReactNode;
  [key: string]: unknown;
}>;

const LegacyStatusText = StatusText as unknown as React.ComponentType<{
  status?: string;
}>;

const LegacyDetailsModal = DetailsModal as unknown as {
  Body: React.ComponentType<{ children?: React.ReactNode }>;
  Section: React.ComponentType<{
    children?: React.ReactNode;
    borderBottom?: boolean;
  }>;
  Column: React.ComponentType<{ children?: React.ReactNode; end?: boolean }>;
  SectionTitle: React.ComponentType<{
    children?: React.ReactNode;
    upper?: boolean;
  }>;
};

/**
 * View that renders a transaction details as part of transactions list
 */
class TransactionDetails extends PureComponent<
  TransactionDetailsProps,
  TransactionDetailsState
> {
  static contextType = ThemeContext;

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
    networkConfigurations: NetworkConfigurations,
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
        tx: transactionObject,
        selectedAddress,
        ticker,
        chainId,
        conversionRate,
        currentCurrency,
        transactions,
        contractExchangeRates,
        tokens,
        primaryCurrency,
        swapsTransactions,
        swapsTokens,
      } as unknown as DecodeTransactionArgs);
      this.setState({
        updatedTransactionDetails: decodedTx[1] as TransactionDetailsData,
      });
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
      txChainId as string,
      networkConfigurations,
    );
    this.setState({ rpcBlockExplorer: blockExplorer });
    this.updateTransactionDetails();
  };

  viewOnEtherscan = () => {
    const {
      navigation,
      transactionObject: { networkID },
      transactionDetails,
      close,
    } = this.props;
    const { rpcBlockExplorer } = this.state;
    try {
      const { url, title } = getBlockExplorerTxUrl(
        RPC,
        transactionDetails?.hash as string,
        rpcBlockExplorer,
      );
      navigation?.push('Webview', {
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
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
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
      <LegacyDetailsModal.Body>
        <LegacyDetailsModal.Section borderBottom>
          <LegacyDetailsModal.Column>
            <LegacyDetailsModal.SectionTitle>
              {strings('transactions.status')}
            </LegacyDetailsModal.SectionTitle>
            <LegacyStatusText status={status} />
            {!!renderTxActions &&
              updatedTransactionDetails?.txChainId === chainId && (
                <View style={styles.transactionActionsContainer}>
                  {this.renderSpeedUpButton()}
                  {this.renderCancelButton()}
                </View>
              )}
          </LegacyDetailsModal.Column>
          <LegacyDetailsModal.Column end>
            <LegacyDetailsModal.SectionTitle>
              {strings('transactions.date')}
            </LegacyDetailsModal.SectionTitle>
            <LegacyText small primary>
              {toDateFormat(time)}
            </LegacyText>
          </LegacyDetailsModal.Column>
        </LegacyDetailsModal.Section>
        <LegacyDetailsModal.Section borderBottom={!!txParams?.nonce}>
          <LegacyDetailsModal.Column>
            <LegacyDetailsModal.SectionTitle>
              {strings('transactions.from')}
            </LegacyDetailsModal.SectionTitle>
            <View style={styles.cellAccount}>
              <View style={styles.accountNameLabel}>
                <View style={styles.accountNameAvatar}>
                  <Avatar
                    variant={AvatarVariant.Account}
                    type={
                      (AvatarAccountType as Record<string, AvatarAccountType>)
                        .Jazzicon
                    }
                    accountAddress={
                      updatedTransactionDetails.renderFrom as string
                    }
                    size={AvatarSize.Md}
                    style={styles.accountAvatar}
                  />
                  <LegacyText
                    small
                    primary
                    testID={WalletViewSelectorsIDs.ACCOUNT_NAME_LABEL_TEXT}
                  >
                    <EthereumAddress
                      type="short"
                      address={updatedTransactionDetails.renderFrom}
                    />
                  </LegacyText>
                </View>
              </View>
            </View>
          </LegacyDetailsModal.Column>
          <LegacyDetailsModal.Column end>
            <LegacyDetailsModal.SectionTitle>
              {strings('transactions.to')}
            </LegacyDetailsModal.SectionTitle>
            <View style={styles.cellAccount}>
              <View style={styles.accountNameLabel}>
                <View style={styles.accountNameAvatar}>
                  <Avatar
                    variant={AvatarVariant.Account}
                    type={
                      (AvatarAccountType as Record<string, AvatarAccountType>)
                        .Jazzicon
                    }
                    accountAddress={
                      updatedTransactionDetails.renderFrom as string
                    }
                    size={AvatarSize.Md}
                    style={styles.accountAvatar}
                  />
                  <LegacyText
                    small
                    primary
                    testID={WalletViewSelectorsIDs.ACCOUNT_NAME_LABEL_TEXT}
                  >
                    <EthereumAddress
                      type="short"
                      address={updatedTransactionDetails.renderTo}
                    />
                  </LegacyText>
                </View>
              </View>
            </View>
          </LegacyDetailsModal.Column>
        </LegacyDetailsModal.Section>
        <LegacyDetailsModal.Section>
          <LegacyDetailsModal.Column>
            <LegacyDetailsModal.SectionTitle upper>
              {strings('transactions.nonce')}
            </LegacyDetailsModal.SectionTitle>
            {!!txParams?.nonce && (
              <LegacyText small primary>{`#${parseInt(
                txParams.nonce.replace(regex.transactionNonce, ''),
                16,
              )}`}</LegacyText>
            )}
          </LegacyDetailsModal.Column>
        </LegacyDetailsModal.Section>
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
              <LegacyText style={styles.viewOnEtherscan}>
                {`${strings('transactions.view_on')} ${getBlockExplorerName(
                  rpcBlockExplorer,
                )}`}
              </LegacyText>
            </TouchableOpacity>
          )}
      </LegacyDetailsModal.Body>
    ) : null;
  };
}

const mapStateToProps = (
  state: RootState,
  ownProps: OwnProps,
): StateProps => ({
  chainId: selectChainId(state),
  networkConfigurations:
    selectNetworkConfigurations(state) as unknown as NetworkConfigurations,
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  transactions: selectTransactions(state) as unknown[],
  ticker: selectEvmTicker(state),
  tokens: selectTokensByAddress(state) as unknown as Record<string, unknown>,
  contractExchangeRates: selectContractExchangeRates(state) as unknown as Record<
    string,
    unknown
  >,
  conversionRate: selectConversionRate(state) as number | undefined,
  currentCurrency: selectCurrentCurrency(state),
  primaryCurrency: selectPrimaryCurrency(state) as string,
  swapsTransactions: selectSwapsTransactions(state) as unknown as Record<
    string,
    unknown
  >,
  swapsTokens: swapsControllerTokens(state) as unknown as unknown[],
  shouldUseSmartTransaction: selectShouldUseSmartTransaction(
    state,
    ownProps.transactionObject.chainId as `0x${string}` | undefined,
  ),
});

const TransactionDetailsWithNavigation = withNavigation(
  TransactionDetails as unknown as Parameters<typeof withNavigation>[0],
);

export default connect(mapStateToProps)(
  TransactionDetailsWithNavigation,
) as unknown as React.ComponentType<OwnProps & Partial<StateProps>>;
