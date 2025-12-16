import { swapsUtils } from '@metamask/swaps-controller/';
import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { connect } from 'react-redux';
import Routes from '../../../constants/navigation/Routes';
import {
  TX_CONFIRMED,
  TX_PENDING,
  TX_SIGNED,
  TX_SUBMITTED,
  TX_UNAPPROVED,
} from '../../../constants/transaction';
import AppConstants from '../../../core/AppConstants';
import {
  getFeatureFlagChainId,
  setSwapsLiveness,
  swapsTokensMultiChainObjectSelector,
  swapsTokensObjectSelector,
} from '../../../reducers/swaps';
import {
  selectChainId,
  selectNetworkClientId,
  selectNetworkConfigurations,
  selectRpcUrl,
} from '../../../selectors/networkController';
import { selectTokens } from '../../../selectors/tokensController';
import { sortTransactions } from '../../../util/activity';
import { safeToChecksumAddress } from '../../../util/address';
import { toLowerCaseEquals } from '../../../util/general';
import {
  findBlockExplorerForNonEvmChainId,
  findBlockExplorerForRpc,
  isMainnetByChainId,
  isPortfolioViewEnabled,
} from '../../../util/networks';
import { mockTheme, ThemeContext } from '../../../util/theme';
import { addAccountTimeFlagFilter } from '../../../util/transactions';
import AssetOverview from '../../UI/AssetOverview';
import { getNetworkNavbarOptions } from '../../UI/Navbar';
import { isSwapsAllowed } from '../../UI/Swaps/utils';
import Transactions from '../../UI/Transactions';
import ActivityHeader from './ActivityHeader';
import {
  isNetworkRampNativeTokenSupported,
  isNetworkRampSupported,
} from '../../UI/Ramp/utils';
import { getRampNetworks } from '../../../reducers/fiatOrders';
import Device from '../../../util/device';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../selectors/currencyRateController';
import { selectSelectedInternalAccount } from '../../../selectors/accountsController';
import { updateIncomingTransactions } from '../../../util/transaction-controller';
import { withMetricsAwareness } from '../../../components/hooks/useMetrics';
import { store } from '../../../store';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import {
  selectSwapsTransactions,
  selectTransactions,
} from '../../../selectors/transactionController';
import Logger from '../../../util/Logger';
import { TOKEN_CATEGORY_HASH } from '../../UI/TransactionElement/utils';
import { selectSupportedSwapTokenAddressesForChainId } from '../../../selectors/tokenSearchDiscoveryDataController';
import { isNonEvmChainId } from '../../../core/Multichain/utils';
import { isBridgeAllowed } from '../../UI/Bridge/utils';
import { getIsSwapsAssetAllowed, getSwapsIsLive } from './utils';
import { RootState } from '../../../reducers';
import { TransactionMeta } from '@metamask/transaction-controller';

interface Styles {
  wrapper: ViewStyle;
  assetOverviewWrapper: ViewStyle;
  loader: ViewStyle;
  footer: ViewStyle;
  footerBorder: ViewStyle;
  footerButton: ViewStyle;
  buyButton: ViewStyle;
  swapButton: ViewStyle;
  singleButton: ViewStyle;
}

interface Colors {
  background: {
    default: string;
  };
  border: {
    muted: string;
  };
  overlay: {
    default: string;
  };
}

const createStyles = (colors: Colors): Styles =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    assetOverviewWrapper: {
      height: 280,
    },
    loader: {
      backgroundColor: colors.background.default,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      backgroundColor: colors.background.default,
      paddingBottom: 32,
      elevation: 2,
      paddingTop: 16,
      paddingHorizontal: 16,
    },
    footerBorder: Device.isAndroid()
      ? {
          borderTopWidth: 1,
          borderColor: colors.border.muted,
        }
      : {
          shadowColor: colors.overlay.default,
          shadowOpacity: 0.3,
          shadowOffset: { height: 4, width: 0 },
          shadowRadius: 8,
        },
    footerButton: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: '50%',
    },
    buyButton: {
      marginRight: 8,
    },
    swapButton: {
      marginLeft: 8,
    },
    singleButton: {
      flexBasis: '100%',
      marginRight: 0,
      marginLeft: 0,
    },
  });

interface AssetParams {
  symbol?: string;
  address?: string;
  chainId?: string;
  isNative?: boolean;
  isETH?: boolean;
}

interface InternalAccount {
  address: string;
  metadata: {
    importTime?: number;
  };
}

interface Token {
  address: string;
}

interface SwapsTransaction {
  destinationToken: {
    address: string;
  };
  sourceToken: {
    address: string;
  };
}

interface NetworkConfiguration {
  name?: string;
}

interface AssetProps {
  navigation: {
    navigate: (route: string, params?: object) => void;
    setOptions: (options: object) => void;
  };
  conversionRate: number;
  currentCurrency: string;
  selectedInternalAccount: InternalAccount;
  chainId: string;
  transactions: TransactionMeta[];
  tokens: Token[];
  swapsIsLive: boolean;
  swapsTokens: Record<string, unknown>;
  searchDiscoverySwapsTokens: string[];
  swapsTransactions: Record<string, SwapsTransaction>;
  route: {
    params: AssetParams;
  };
  rpcUrl: string;
  networkConfigurations: Record<string, NetworkConfiguration>;
  isNetworkRampSupported: boolean;
  isNetworkBuyNativeTokenSupported: boolean;
  setLiveness: (chainId: string, featureFlags: unknown) => void;
  metrics: {
    trackEvent: (event: unknown) => void;
  };
}

interface AssetState {
  refreshing: boolean;
  loading: boolean;
  transactionsUpdated: boolean;
  submittedTxs: TransactionMeta[];
  confirmedTxs: TransactionMeta[];
  transactions: TransactionMeta[];
}

interface ExtendedTransactionMeta extends TransactionMeta {
  insertImportTime?: boolean;
  isTransfer?: boolean;
  transferInformation?: {
    contractAddress: string;
  };
  networkID?: string;
}

class Asset extends PureComponent<AssetProps, AssetState> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  state: AssetState = {
    refreshing: false,
    loading: false,
    transactionsUpdated: false,
    submittedTxs: [],
    confirmedTxs: [],
    transactions: [],
  };

  txs: ExtendedTransactionMeta[] = [];
  txsPending: ExtendedTransactionMeta[] = [];
  isNormalizing = false;
  chainId = '';
  filter:
    | ((tx: ExtendedTransactionMeta) => boolean)
    | undefined = undefined;
  navSymbol: string | undefined = undefined;
  navAddress: string | undefined = undefined;
  mounted = false;
  selectedAddress = toChecksumHexAddress(
    this.props.selectedInternalAccount?.address,
  );

  updateNavBar = (contentOffset = 0): void => {
    const {
      route: { params },
      navigation,
      route,
      chainId,
      rpcUrl,
      networkConfigurations,
    } = this.props;
    const colors = this.context?.colors || mockTheme.colors;
    const isNativeToken = route.params.isNative ?? route.params.isETH;
    const isMainnet = isMainnetByChainId(chainId);
    const blockExplorer = isNonEvmChainId(chainId)
      ? findBlockExplorerForNonEvmChainId(chainId)
      : findBlockExplorerForRpc(rpcUrl, networkConfigurations);

    const shouldShowMoreOptionsInNavBar =
      isMainnet || !isNativeToken || (isNativeToken && blockExplorer);
    const asset = navigation && params;
    const currentNetworkName =
      this.props.networkConfigurations[asset?.chainId || '']?.name;
    navigation.setOptions(
      getNetworkNavbarOptions(
        route.params?.symbol ?? '',
        false,
        navigation,
        colors,
        shouldShowMoreOptionsInNavBar && !isNonEvmChainId(chainId)
          ? () =>
              navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
                screen: 'AssetOptions',
                params: {
                  isNativeCurrency: isNativeToken,
                  address: route.params?.address,
                  chainId: route.params?.chainId,
                  asset,
                },
              })
          : undefined,
        true,
        contentOffset,
        currentNetworkName,
      ),
    );
  };

  onScrollThroughContent = (contentOffset = 0): void => {
    this.updateNavBar(contentOffset);
  };

  checkLiveness = async (chainId: string): Promise<void> => {
    try {
      const featureFlags = await swapsUtils.fetchSwapsFeatureFlags(
        getFeatureFlagChainId(chainId),
        AppConstants.SWAPS.CLIENT_ID,
      );
      this.props.setLiveness(chainId, featureFlags);
    } catch (error) {
      Logger.error(error as Error, 'Swaps: error while fetching swaps liveness');
      this.props.setLiveness(chainId, null);
    }
  };

  componentDidMount(): void {
    this.updateNavBar();

    const tokenChainId = this.props.route?.params?.chainId;
    if (tokenChainId) {
      this.checkLiveness(tokenChainId);
    }

    InteractionManager.runAfterInteractions(() => {
      this.normalizeTransactions();
      this.mounted = true;
    });
    this.navSymbol = (this.props.route.params?.symbol ?? '').toLowerCase();
    this.navAddress = (this.props.route.params?.address ?? '').toLowerCase();

    if (this.navSymbol.toUpperCase() !== 'ETH' && this.navAddress !== '') {
      this.filter = this.noEthFilter;
    } else {
      this.filter = this.ethFilter;
    }
  }

  componentDidUpdate(prevProps: AssetProps): void {
    if (
      prevProps.chainId !== this.props.chainId ||
      prevProps.selectedInternalAccount.address !==
        this.props.selectedInternalAccount?.address
    ) {
      this.showLoaderAndNormalize();
    } else {
      this.normalizeTransactions();
    }
  }

  showLoaderAndNormalize(): void {
    this.setState({ loading: true }, () => {
      this.normalizeTransactions();
    });
  }

  componentWillUnmount(): void {
    this.mounted = false;
  }

  didTxStatusesChange = (newTxsPending: ExtendedTransactionMeta[]): boolean =>
    this.txsPending.length !== newTxsPending.length;

  ethFilter = (tx: ExtendedTransactionMeta): boolean => {
    const { networkId } = (store.getState() as RootState).inpageProvider;
    const { chainId } = this.props;
    const {
      txParams: { from, to },
      isTransfer,
      transferInformation,
      type,
    } = tx;

    if (
      (safeToChecksumAddress(from as string) === this.selectedAddress ||
        safeToChecksumAddress(to as string) === this.selectedAddress) &&
      (chainId === tx.chainId ||
        (!tx.chainId && networkId === tx.networkID)) &&
      tx.status !== 'unapproved'
    ) {
      if (TOKEN_CATEGORY_HASH[type as string]) {
        return false;
      }
      if (isTransfer) {
        return !!this.props.tokens.find(({ address }) =>
          toLowerCaseEquals(address, transferInformation?.contractAddress || ''),
        );
      }

      return true;
    }
    return false;
  };

  noEthFilter = (tx: ExtendedTransactionMeta): boolean => {
    const { networkId } = (store.getState() as RootState).inpageProvider;

    const { chainId, swapsTransactions } = this.props;
    const {
      txParams: { to, from },
      isTransfer,
      transferInformation,
    } = tx;
    if (
      (safeToChecksumAddress(from as string) === this.selectedAddress ||
        safeToChecksumAddress(to as string) === this.selectedAddress) &&
      (chainId === tx.chainId ||
        (!tx.chainId && networkId === tx.networkID)) &&
      tx.status !== 'unapproved'
    ) {
      if ((to as string)?.toLowerCase() === this.navAddress) return true;
      if (isTransfer)
        return (
          this.navAddress ===
          transferInformation?.contractAddress.toLowerCase()
        );
      if (
        swapsTransactions[tx.id] &&
        ((to as string)?.toLowerCase() ===
          swapsUtils.getSwapsContractAddress(chainId) ||
          (to as string)?.toLowerCase() === this.navAddress)
      ) {
        const { destinationToken, sourceToken } = swapsTransactions[tx.id];
        return (
          destinationToken.address === this.navAddress ||
          sourceToken.address === this.navAddress
        );
      }
    }
    return false;
  };

  normalizeTransactions(): void {
    if (this.isNormalizing) return;
    let accountAddedTimeInsertPointFound = false;
    const { selectedInternalAccount } = this.props;
    const addedAccountTime = selectedInternalAccount?.metadata.importTime;
    this.isNormalizing = true;

    let submittedTxs: ExtendedTransactionMeta[] = [];
    const newPendingTxs: ExtendedTransactionMeta[] = [];
    const confirmedTxs: ExtendedTransactionMeta[] = [];
    const submittedNonces: string[] = [];

    const { chainId, transactions } = this.props;
    if (transactions.length) {
      const sortedTransactions = sortTransactions(
        transactions as ExtendedTransactionMeta[],
      ).filter(
        (tx: ExtendedTransactionMeta, index: number, self: ExtendedTransactionMeta[]) =>
          self.findIndex((_tx) => _tx.id === tx.id) === index,
      );
      const filteredTransactions = sortedTransactions.filter(
        (tx: ExtendedTransactionMeta) => {
          const filterResult = this.filter?.(tx);
          if (filterResult) {
            tx.insertImportTime = addAccountTimeFlagFilter(
              tx,
              addedAccountTime,
              accountAddedTimeInsertPointFound,
            );
            if (tx.insertImportTime) accountAddedTimeInsertPointFound = true;
            switch (tx.status) {
              case TX_SUBMITTED:
              case TX_SIGNED:
              case TX_UNAPPROVED:
                submittedTxs.push(tx);
                return false;
              case TX_PENDING:
                newPendingTxs.push(tx);
                break;
              case TX_CONFIRMED:
                confirmedTxs.push(tx);
                break;
            }
          }
          return filterResult;
        },
      );

      submittedTxs = submittedTxs.filter(
        ({ txParams: { from, nonce } }: ExtendedTransactionMeta) => {
          if (!toLowerCaseEquals(from as string, this.selectedAddress)) {
            return false;
          }
          const alreadySubmitted = submittedNonces.includes(nonce as string);
          const alreadyConfirmed = confirmedTxs.find(
            (confirmedTransaction) =>
              toLowerCaseEquals(
                safeToChecksumAddress(
                  confirmedTransaction.txParams.from as string,
                ),
                this.selectedAddress,
              ) && confirmedTransaction.txParams.nonce === nonce,
          );
          if (alreadyConfirmed) {
            return false;
          }
          submittedNonces.push(nonce as string);
          return !alreadySubmitted;
        },
      );

      if (
        !accountAddedTimeInsertPointFound &&
        filteredTransactions &&
        filteredTransactions.length
      ) {
        filteredTransactions[
          filteredTransactions.length - 1
        ].insertImportTime = true;
      }
      if (
        (this.txs.length === 0 && !this.state.transactionsUpdated) ||
        this.txs.length !== filteredTransactions.length ||
        this.chainId !== chainId ||
        this.didTxStatusesChange(newPendingTxs)
      ) {
        this.txs = filteredTransactions;
        this.txsPending = newPendingTxs;
        this.setState({
          transactionsUpdated: true,
          loading: false,
          transactions: filteredTransactions,
          submittedTxs,
          confirmedTxs,
        });
      }
    } else if (!this.state.transactionsUpdated) {
      this.setState({ transactionsUpdated: true, loading: false });
    }
    this.isNormalizing = false;
    this.chainId = chainId;
  }

  renderLoader = (): React.ReactElement => {
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.loader}>
        <ActivityIndicator style={styles.loader} size="small" />
      </View>
    );
  };

  onRefresh = async (): Promise<void> => {
    this.setState({ refreshing: true });

    await updateIncomingTransactions();

    this.setState({ refreshing: false });
  };

  render = (): React.ReactElement => {
    const {
      loading,
      transactions,
      submittedTxs,
      confirmedTxs,
      transactionsUpdated,
    } = this.state;
    const {
      route: { params },
      navigation,
      conversionRate,
      currentCurrency,
      chainId,
    } = this.props;
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);
    const asset = navigation && params;
    const isSwapsFeatureLive = this.props.swapsIsLive;
    const isSwapsNetworkAllowed = isPortfolioViewEnabled()
      ? isSwapsAllowed(asset?.chainId || '')
      : isSwapsAllowed(chainId);

    const isSwapsAssetAllowed = getIsSwapsAssetAllowed({
      asset,
      searchDiscoverySwapsTokens: this.props.searchDiscoverySwapsTokens,
      swapsTokens: this.props.swapsTokens,
    });

    const displaySwapsButton =
      isSwapsNetworkAllowed && isSwapsAssetAllowed && AppConstants.SWAPS.ACTIVE;

    const displayBridgeButton = isPortfolioViewEnabled()
      ? isBridgeAllowed(asset?.chainId || '')
      : isBridgeAllowed(chainId);

    const displayBuyButton = asset?.isETH
      ? this.props.isNetworkBuyNativeTokenSupported
      : this.props.isNetworkRampSupported;
    return (
      <View style={styles.wrapper}>
        {loading ? (
          this.renderLoader()
        ) : (
          <Transactions
            header={
              <>
                <AssetOverview
                  asset={asset}
                  displayBuyButton={displayBuyButton}
                  displaySwapsButton={displaySwapsButton}
                  displayBridgeButton={displayBridgeButton}
                  swapsIsLive={isSwapsFeatureLive}
                  networkName={
                    this.props.networkConfigurations[asset?.chainId || '']?.name
                  }
                />
                <ActivityHeader asset={asset} />
              </>
            }
            assetSymbol={asset?.symbol}
            navigation={navigation}
            transactions={transactions}
            submittedTransactions={submittedTxs}
            confirmedTransactions={confirmedTxs}
            selectedAddress={this.selectedAddress}
            conversionRate={conversionRate}
            currentCurrency={currentCurrency}
            networkType={chainId}
            loading={!transactionsUpdated}
            headerHeight={280}
            onScrollThroughContent={this.onScrollThroughContent}
            tokenChainId={asset?.chainId}
          />
        )}
      </View>
    );
  };
}

const mapStateToProps = (
  state: RootState,
  { route }: { route: { params: AssetParams } },
): Partial<AssetProps> => ({
  swapsIsLive: getSwapsIsLive(state, route.params.chainId),
  swapsTokens: isPortfolioViewEnabled()
    ? swapsTokensMultiChainObjectSelector(state)
    : swapsTokensObjectSelector(state),
  searchDiscoverySwapsTokens: selectSupportedSwapTokenAddressesForChainId(
    state,
    route.params.chainId,
  ),
  swapsTransactions: selectSwapsTransactions(state),
  conversionRate: selectConversionRate(state),
  currentCurrency: selectCurrentCurrency(state),
  selectedInternalAccount: selectSelectedInternalAccount(state),
  chainId: selectChainId(state),
  tokens: selectTokens(state),
  transactions: selectTransactions(state),
  rpcUrl: selectRpcUrl(state),
  networkConfigurations: selectNetworkConfigurations(state),
  isNetworkRampSupported: isNetworkRampSupported(
    selectChainId(state),
    getRampNetworks(state),
  ),
  isNetworkBuyNativeTokenSupported: isNetworkRampNativeTokenSupported(
    selectChainId(state),
    getRampNetworks(state),
  ),
});

const mapDispatchToProps = (
  dispatch: (action: unknown) => void,
): { setLiveness: (chainId: string, featureFlags: unknown) => void } => ({
  setLiveness: (chainId: string, featureFlags: unknown) =>
    dispatch(setSwapsLiveness(chainId, featureFlags)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(Asset));
