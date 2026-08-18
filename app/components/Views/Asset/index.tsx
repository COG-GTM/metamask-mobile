import { swapsUtils } from '@metamask/swaps-controller/';
import type { Token } from '@metamask/assets-controllers';
import type { Theme } from '@metamask/design-tokens';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';
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
import type { RootState } from '../../../reducers';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { IWithMetricsAwarenessProps } from '../../../components/hooks/useMetrics/withMetricsAwareness.types';

type AssetOverviewAsset = React.ComponentProps<typeof AssetOverview>['asset'];
type ActivityHeaderAsset = React.ComponentProps<typeof ActivityHeader>['asset'];

interface AssetRouteParams {
  symbol?: string;
  address?: string;
  isETH?: boolean;
  isNative?: boolean;
  chainId: string;
}

interface AssetRoute {
  params: AssetRouteParams;
}

type AssetTransaction = TransactionMeta & {
  networkID?: string;
  insertImportTime?: boolean;
};

interface AssetStyles {
  wrapper: StyleProp<ViewStyle | TextStyle>;
  assetOverviewWrapper: StyleProp<ViewStyle | TextStyle>;
  loader: StyleProp<ViewStyle | TextStyle>;
  footer: StyleProp<ViewStyle | TextStyle>;
  footerBorder: StyleProp<ViewStyle | TextStyle>;
  footerButton: StyleProp<ViewStyle | TextStyle>;
  buyButton: StyleProp<ViewStyle | TextStyle>;
  swapButton: StyleProp<ViewStyle | TextStyle>;
  singleButton: StyleProp<ViewStyle | TextStyle>;
}

interface AssetOwnProps {
  navigation: NavigationProp<ParamListBase>;
  route: AssetRoute;
}

interface AssetState {
  refreshing: boolean;
  loading: boolean;
  transactionsUpdated: boolean;
  submittedTxs: AssetTransaction[];
  confirmedTxs: AssetTransaction[];
  transactions: AssetTransaction[];
}

const createStyles = (colors: Theme['colors']): AssetStyles =>
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

const mapStateToProps = (state: RootState, { route }: AssetOwnProps) => ({
  swapsIsLive: getSwapsIsLive(
    state,
    route.params.chainId as Parameters<typeof getSwapsIsLive>[1],
  ),
  swapsTokens: isPortfolioViewEnabled()
    ? swapsTokensMultiChainObjectSelector(state)
    : swapsTokensObjectSelector(state),
  searchDiscoverySwapsTokens: selectSupportedSwapTokenAddressesForChainId(
    state,
    route.params.chainId as Parameters<
      typeof selectSupportedSwapTokenAddressesForChainId
    >[1],
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
  networkClientId: selectNetworkClientId(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setLiveness: (chainId: string, featureFlags: unknown) =>
    dispatch(setSwapsLiveness(chainId, featureFlags)),
});

type AssetComponentProps = AssetOwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

/**
 * View that displays a specific asset (Token or ETH)
 * including the overview (Amount, Balance, Symbol, Logo)
 * and also the transaction list
 */
class Asset extends PureComponent<AssetComponentProps, AssetState> {
  static contextType = ThemeContext;

  static propTypes = {
    /**
    /* navigation object required to access the props
    /* passed by the parent component
    */
    navigation: PropTypes.object,
    /**
    /* conversion rate of ETH - FIAT
    */
    conversionRate: PropTypes.any,
    /**
    /* Selected currency
    */
    currentCurrency: PropTypes.string,
    /**
    /* InternalAccount object required to get account name
    */
    selectedInternalAccount: PropTypes.object,
    /**
     * The chain ID for the current selected network
     */
    chainId: PropTypes.string,
    /**
     * An array that represents the user transactions
     */
    transactions: PropTypes.array,
    /**
     * Array of ERC20 assets
     */
    tokens: PropTypes.array,
    swapsIsLive: PropTypes.bool,
    swapsTokens: PropTypes.object,
    searchDiscoverySwapsTokens: PropTypes.array,
    swapsTransactions: PropTypes.object,
    /**
     * Object that represents the current route info like params passed to it
     */
    route: PropTypes.object,
    rpcUrl: PropTypes.string,
    networkConfigurations: PropTypes.object,
    /**
     * Boolean that indicates if network is supported to buy
     */
    isNetworkRampSupported: PropTypes.bool,
    /**
     * Boolean that indicates if native token is supported to buy
     */
    isNetworkBuyNativeTokenSupported: PropTypes.bool,
    /**
     * Function to set the swaps liveness
     */
    setLiveness: PropTypes.func,
  };

  state: AssetState = {
    refreshing: false,
    loading: false,
    transactionsUpdated: false,
    submittedTxs: [],
    confirmedTxs: [],
    transactions: [],
  };

  txs: AssetTransaction[] = [];
  txsPending: AssetTransaction[] = [];
  isNormalizing = false;
  chainId = '';
  filter: ((tx: AssetTransaction) => boolean | Token | undefined) | undefined;
  navSymbol: string | undefined;
  navAddress: string | undefined;
  selectedAddress = toChecksumHexAddress(
    this.props.selectedInternalAccount?.address as string,
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
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const isNativeToken = route.params.isNative ?? route.params.isETH;
    const isMainnet = isMainnetByChainId(chainId);
    const blockExplorer = isNonEvmChainId(chainId)
      ? findBlockExplorerForNonEvmChainId(chainId)
      : findBlockExplorerForRpc(rpcUrl, networkConfigurations);

    const shouldShowMoreOptionsInNavBar =
      isMainnet || !isNativeToken || (isNativeToken && blockExplorer);
    const asset = navigation && params;
    const currentNetworkName =
      this.props.networkConfigurations[asset.chainId]?.name;
    navigation.setOptions(
      getNetworkNavbarOptions(
        route.params?.symbol ?? '',
        false,
        navigation,
        colors,
        // TODO: remove !isNonEvmChainId check once bottom sheet options are fixed for non-EVM chains
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
        getFeatureFlagChainId(
          chainId as Parameters<typeof getFeatureFlagChainId>[0],
        ),
        AppConstants.SWAPS.CLIENT_ID,
      );
      this.props.setLiveness(chainId, featureFlags);
    } catch (error) {
      Logger.error(
        error as Error,
        'Swaps: error while fetching swaps liveness',
      );
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
      (this as unknown as { mounted: boolean }).mounted = true;
    });
    this.navSymbol = (this.props.route.params?.symbol ?? '').toLowerCase();
    this.navAddress = (this.props.route.params?.address ?? '').toLowerCase();

    if (this.navSymbol.toUpperCase() !== 'ETH' && this.navAddress !== '') {
      this.filter = this.noEthFilter;
    } else {
      this.filter = this.ethFilter;
    }
  }

  componentDidUpdate(prevProps: AssetComponentProps): void {
    if (
      prevProps.chainId !== this.props.chainId ||
      (prevProps.selectedInternalAccount as InternalAccount).address !==
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
    (this as unknown as { mounted: boolean }).mounted = false;
  }

  didTxStatusesChange = (newTxsPending: AssetTransaction[]): boolean =>
    this.txsPending.length !== newTxsPending.length;

  ethFilter = (tx: AssetTransaction): boolean | Token | undefined => {
    const { networkId } = store.getState().inpageProvider;
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
      (chainId === tx.chainId || (!tx.chainId && networkId === tx.networkID)) &&
      tx.status !== 'unapproved'
    ) {
      if (TOKEN_CATEGORY_HASH[type as keyof typeof TOKEN_CATEGORY_HASH]) {
        return false;
      }
      if (isTransfer) {
        return this.props.tokens.find(({ address }) =>
          toLowerCaseEquals(
            address,
            (transferInformation as { contractAddress: string })
              .contractAddress,
          ),
        );
      }

      return true;
    }
    return false;
  };

  noEthFilter = (tx: AssetTransaction): boolean | undefined => {
    const { networkId } = store.getState().inpageProvider;

    const { chainId, swapsTransactions } = this.props;
    const {
      txParams: { to, from },
      isTransfer,
      transferInformation,
    } = tx;
    if (
      (safeToChecksumAddress(from) === this.selectedAddress ||
        safeToChecksumAddress(to as string) === this.selectedAddress) &&
      (chainId === tx.chainId || (!tx.chainId && networkId === tx.networkID)) &&
      tx.status !== 'unapproved'
    ) {
      if (to?.toLowerCase() === this.navAddress) return true;
      if (isTransfer)
        return (
          this.navAddress ===
          (
            transferInformation as { contractAddress: string }
          ).contractAddress.toLowerCase()
        );
      if (
        swapsTransactions[tx.id] &&
        (to?.toLowerCase() ===
          swapsUtils.getSwapsContractAddress(
            chainId as Parameters<typeof swapsUtils.getSwapsContractAddress>[0],
          ) ||
          to?.toLowerCase() === this.navAddress)
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

    let submittedTxs: AssetTransaction[] = [];
    const newPendingTxs: AssetTransaction[] = [];
    const confirmedTxs: AssetTransaction[] = [];
    const submittedNonces: (string | number | undefined)[] = [];

    const { chainId, transactions } = this.props;
    if (transactions.length) {
      const sortedTransactions = sortTransactions(transactions).filter(
        (tx, index, self) =>
          self.findIndex((_tx) => _tx.id === tx.id) === index,
      );
      const filteredTransactions = sortedTransactions.filter((tx) => {
        const filterResult = (
          this.filter as (
            transaction: AssetTransaction,
          ) => boolean | Token | undefined
        )(tx);
        if (filterResult) {
          tx.insertImportTime = addAccountTimeFlagFilter(
            tx,
            addedAccountTime as unknown as object,
            accountAddedTimeInsertPointFound as unknown as object,
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
      });

      submittedTxs = submittedTxs.filter(({ txParams: { from, nonce } }) => {
        if (!toLowerCaseEquals(from, this.selectedAddress)) {
          return false;
        }
        const alreadySubmitted = submittedNonces.includes(nonce);
        const alreadyConfirmed = confirmedTxs.find(
          (confirmedTransaction) =>
            toLowerCaseEquals(
              safeToChecksumAddress(confirmedTransaction.txParams.from),
              this.selectedAddress,
            ) && confirmedTransaction.txParams.nonce === nonce,
        );
        if (alreadyConfirmed) {
          return false;
        }
        submittedNonces.push(nonce);
        return !alreadySubmitted;
      });

      // If the account added "Insert Point" is not found add it to the last transaction
      if (
        !accountAddedTimeInsertPointFound &&
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        filteredTransactions &&
        filteredTransactions.length
      ) {
        filteredTransactions[filteredTransactions.length - 1].insertImportTime =
          true;
      }
      // To avoid extra re-renders we want to set the new txs only when
      // there's a new tx in the history or the status of one of the existing txs changed
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

  renderLoader = () => {
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.loader}>
        <ActivityIndicator style={styles.loader} size="small" />
      </View>
    );
  };

  onRefresh = async () => {
    this.setState({ refreshing: true });

    await updateIncomingTransactions();

    this.setState({ refreshing: false });
  };

  render = () => {
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
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);
    const asset = navigation && params;
    const isSwapsFeatureLive = this.props.swapsIsLive;
    const isSwapsNetworkAllowed = isPortfolioViewEnabled()
      ? isSwapsAllowed(asset.chainId)
      : isSwapsAllowed(chainId);

    const isSwapsAssetAllowed = getIsSwapsAssetAllowed({
      asset: asset as unknown as Parameters<
        typeof getIsSwapsAssetAllowed
      >[0]['asset'],
      searchDiscoverySwapsTokens: this.props.searchDiscoverySwapsTokens,
      swapsTokens: this.props.swapsTokens,
    });

    const displaySwapsButton =
      isSwapsNetworkAllowed && isSwapsAssetAllowed && AppConstants.SWAPS.ACTIVE;

    const displayBridgeButton = isPortfolioViewEnabled()
      ? isBridgeAllowed(asset.chainId as Parameters<typeof isBridgeAllowed>[0])
      : isBridgeAllowed(chainId);

    const displayBuyButton = asset.isETH
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
                  asset={asset as unknown as AssetOverviewAsset}
                  displayBuyButton={displayBuyButton}
                  displaySwapsButton={displaySwapsButton}
                  displayBridgeButton={displayBridgeButton}
                  swapsIsLive={isSwapsFeatureLive}
                  networkName={
                    this.props.networkConfigurations[asset.chainId]?.name
                  }
                />
                <ActivityHeader
                  asset={asset as unknown as ActivityHeaderAsset}
                />
              </>
            }
            assetSymbol={asset.symbol as string}
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
            tokenChainId={asset.chainId}
          />
        )}
      </View>
    );
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withMetricsAwareness(
    Asset as unknown as React.ComponentType<IWithMetricsAwarenessProps>,
  ),
);
