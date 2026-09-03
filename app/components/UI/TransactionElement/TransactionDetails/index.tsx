import React, { PureComponent } from 'react';
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
import BaseStatusText from '../../../Base/StatusText';
import BaseText from '../../../../component-library/components/Texts/Text';
import BaseDetailsModal from '../../../Base/DetailsModal';
import { RPC, NO_RPC_BLOCK_EXPLORER } from '../../../../constants/network';
import {
  withNavigation,
  type CompatNavigationProp,
} from '@react-navigation/compat';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { ThemeContext } from '../../../../util/theme';
import decodeTransaction, {
  type DecodeTransactionArgs,
  type TransactionDetailsData,
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
import {
  CHAIN_IDS,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { Colors, Theme } from '../../../../util/theme/models';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';

interface LegacyComponentProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

type LegacyDetailsModal = React.ComponentType<LegacyComponentProps> & {
  Body: React.ComponentType<LegacyComponentProps>;
  Section: React.ComponentType<LegacyComponentProps>;
  Column: React.ComponentType<LegacyComponentProps>;
  SectionTitle: React.ComponentType<LegacyComponentProps>;
};

const StatusText =
  BaseStatusText as unknown as React.ComponentType<LegacyComponentProps>;
const Text = BaseText as unknown as React.ComponentType<LegacyComponentProps>;
const DetailsModal = BaseDetailsModal as unknown as LegacyDetailsModal;

interface OwnProps {
  navigation: CompatNavigationProp<NavigationProp<ParamListBase>> & {
    push: (route: string, params?: Record<string, unknown>) => void;
  };
  transactionObject: TransactionMeta;
  transactionDetails: TransactionDetailsData;
  close?: () => void;
  showSpeedUpModal?: () => void;
  showCancelModal?: () => void;
}

interface StateProps {
  chainId: string;
  networkConfigurations: Record<string, MultichainNetworkConfiguration>;
  selectedAddress?: string;
  transactions: TransactionMeta[];
  ticker: string;
  tokens: Record<string, unknown>;
  contractExchangeRates: Record<string, { price: number }>;
  conversionRate: number | null;
  currentCurrency: string;
  swapsTransactions: Record<string, unknown>;
  swapsTokens: Record<string, unknown>[];
  primaryCurrency: unknown;
  shouldUseSmartTransaction?: boolean;
}

interface Props extends OwnProps, StateProps {}

interface State {
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

/**
 * View that renders a transaction details as part of transactions list
 */
class TransactionDetails extends PureComponent<Props, State> {
  state: State = {
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
    networkConfigurations: Props['networkConfigurations'],
  ) => {
    // First check for network configuration block explorer
    const networkConfiguration = networkConfigurations?.[txChainId] as {
      blockExplorerUrls?: string[];
      defaultBlockExplorerUrlIndex?: number;
    };
    let blockExplorer =
      networkConfiguration?.blockExplorerUrls?.[
        networkConfiguration.defaultBlockExplorerUrlIndex as number
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
      (
        transactionObject.txParams as typeof transactionObject.txParams & {
          multiLayerL1FeeTotal?: string;
        }
      ).multiLayerL1FeeTotal = multiLayerL1FeeTotal;
      const decodedTx = await decodeTransaction({
        tx: transactionObject,
        selectedAddress: selectedAddress as string,
        ticker,
        chainId,
        conversionRate,
        currentCurrency,
        transactions,
        contractExchangeRates,
        tokens,
        primaryCurrency: primaryCurrency as string,
        swapsTransactions,
        swapsTokens,
      } as unknown as DecodeTransactionArgs);
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
    const colors = (this.context as Theme).colors;
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
              {toDateFormat(time as number)}
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
                    accountAddress={
                      updatedTransactionDetails.renderFrom as string
                    }
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
                      address={updatedTransactionDetails.renderFrom as string}
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
                    accountAddress={
                      updatedTransactionDetails.renderFrom as string
                    }
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
                      address={updatedTransactionDetails.renderTo as string}
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
  state: import('../../../../reducers').RootState,
  ownProps: Pick<Props, 'transactionObject'>,
) => ({
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
    ownProps.transactionObject.chainId as `0x${string}`,
  ),
});

TransactionDetails.contextType = ThemeContext;

const TransactionDetailsWithNavigation = withNavigation<
  NavigationProp<ParamListBase>,
  Props,
  typeof TransactionDetails
>(TransactionDetails) as unknown as React.ComponentType<
  Omit<Props, keyof StateProps> & Partial<StateProps>
>;

const ConnectedTransactionDetails = connect(
  mapStateToProps,
  undefined,
)(TransactionDetailsWithNavigation);

export default ConnectedTransactionDetails as unknown as React.ComponentType<
  Omit<OwnProps, 'navigation'> & {
    navigation?: OwnProps['navigation'];
  }
>;
