import { swapsUtils } from '@metamask/swaps-controller/';
import React, { PureComponent, type ComponentType } from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  StyleSheet,
  View,
} from 'react-native';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';
import type { Hex } from '@metamask/utils';
import type {
  TransactionMeta,
} from '@metamask/transaction-controller';
import type { FeatureFlags } from '@metamask/swaps-controller/dist/types';
import type { ParamListBase } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
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
import type { IUseMetricsHook } from '../../../components/hooks/useMetrics/useMetrics.types';
import type { IWithMetricsAwarenessProps } from '../../../components/hooks/useMetrics/withMetricsAwareness.types';
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
import type { Theme } from '@metamask/design-tokens';
import type { TokenI } from '../../UI/Tokens/types';

interface AssetRouteParams
  extends Omit<TokenI, 'isETH' | 'hasBalanceError'> {
  isETH: boolean;
  hasBalanceError: boolean;
  isNative: boolean;
  chainId: Hex;
}

interface AssetTransaction extends TransactionMeta {
  isTransfer?: boolean;
  networkID?: string;
  insertImportTime?: boolean;
  [key: string]: unknown;
}

interface OwnProps {
  navigation: StackNavigationProp<ParamListBase>;
  route: { params: AssetRouteParams };
}

interface StateProps {
  conversionRate: ReturnType<typeof selectConversionRate>;
  currentCurrency: ReturnType<typeof selectCurrentCurrency>;
  selectedInternalAccount: ReturnType<typeof selectSelectedInternalAccount>;
  chainId: ReturnType<typeof selectChainId>;
  transactions: AssetTransaction[];
  tokens: ReturnType<typeof selectTokens>;
  swapsIsLive: boolean;
  swapsTokens:
    | ReturnType<typeof swapsTokensObjectSelector>
    | ReturnType<typeof swapsTokensMultiChainObjectSelector>;
  searchDiscoverySwapsTokens: ReturnType<
    typeof selectSupportedSwapTokenAddressesForChainId
  >;
  swapsTransactions: ReturnType<typeof selectSwapsTransactions>;
  rpcUrl: ReturnType<typeof selectRpcUrl>;
  networkConfigurations: ReturnType<typeof selectNetworkConfigurations>;
  isNetworkRampSupported: boolean;
  isNetworkBuyNativeTokenSupported: boolean;
  networkClientId: ReturnType<typeof selectNetworkClientId>;
}

interface DispatchProps {
  setLiveness: (chainId: Hex, featureFlags: FeatureFlags | null) => void;
}

interface State {
  refreshing: boolean;
  loading: boolean;
  transactionsUpdated: boolean;
  submittedTxs: AssetTransaction[];
  confirmedTxs: AssetTransaction[];
  transactions: AssetTransaction[];
}

interface MetricsProps {
  metrics: IUseMetricsHook;
}

type Props = OwnProps & StateProps & DispatchProps & MetricsProps;

const createStyles = (colors: Theme['colors']) =>
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

/**
 * View that displays a specific asset (Token or ETH)
 * including the overview (Amount, Balance, Symbol, Logo)
 * and also the transaction list
 */
class Asset extends PureComponent<Props, State> {
  static contextType = ThemeContext;

  state: State = {
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
  chainId: string = '';
  filter:
    | ((tx: AssetTransaction) => boolean | TokenI | undefined)
    | undefined;
  navSymbol: string | undefined;
  navAddress: string | undefined;
  mounted = false;
  selectedAddress: string = toChecksumHexAddress(
    this.props.selectedInternalAccount?.address ?? '',
  );

  updateNavBar = (contentOffset = 0) => {
    const {
      route: { params },
      navigation,
      route,
      chainId,
      rpcUrl,
      networkConfigurations,
    } = this.props;
    const colors = (this.context as unknown as Theme).colors || mockTheme.colors;
    const isNativeToken = route.params.isNative ?? route.params.isETH;
    const isMainnet = isMainnetByChainId(chainId);
    const blockExplorer = isNonEvmChainId(chainId)
      ? findBlockExplorerForNonEvmChainId(chainId)
      : findBlockExplorerForRpc(rpcUrl ?? '', networkConfigurations);

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

  onScrollThroughContent = (contentOffset: unknown = 0) => {
    this.updateNavBar(typeof contentOffset === 'number' ? contentOffset : 0);
  };

  checkLiveness = async (chainId: Hex) => {
    try {
      const featureFlags = await swapsUtils.fetchSwapsFeatureFlags(
        getFeatureFlagChainId(chainId),
        AppConstants.SWAPS.CLIENT_ID,
      );
      this.props.setLiveness(chainId, featureFlags ?? null);
    } catch (error) {
      Logger.error(
        error instanceof Error ? error : new Error(String(error)),
        'Swaps: error while fetching swaps liveness',
      );
      this.props.setLiveness(chainId, null);
    }
  };

  componentDidMount() {
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

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.chainId !== this.props.chainId ||
      prevProps.selectedInternalAccount?.address !==
        this.props.selectedInternalAccount?.address
    ) {
      this.showLoaderAndNormalize();
    } else {
      this.normalizeTransactions();
    }
  }

  showLoaderAndNormalize() {
    this.setState({ loading: true }, () => {
      this.normalizeTransactions();
    });
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  didTxStatusesChange = (newTxsPending: AssetTransaction[]) =>
    this.txsPending.length !== newTxsPending.length;

  ethFilter = (tx: AssetTransaction) => {
    const { networkId } = store.getState().inpageProvider;
    const { chainId } = this.props;
    const {
      txParams: { from, to },
      isTransfer,
      transferInformation,
      type,
    } = tx;

    if (
      (safeToChecksumAddress(from ?? '') === this.selectedAddress ||
        safeToChecksumAddress(to ?? '') === this.selectedAddress) &&
      (chainId === tx.chainId || (!tx.chainId && networkId === tx.networkID)) &&
      tx.status !== 'unapproved'
    ) {
      if (
        type &&
        Object.prototype.hasOwnProperty.call(TOKEN_CATEGORY_HASH, type)
      ) {
        return false;
      }
      if (isTransfer && transferInformation) {
        return Boolean(
          this.props.tokens.find(({ address }) =>
            toLowerCaseEquals(address, transferInformation.contractAddress),
          ),
        );
      }

      return true;
    }
    return false;
  };

  noEthFilter = (tx: AssetTransaction) => {
    const { networkId } = store.getState().inpageProvider;

    const { chainId, swapsTransactions } = this.props;
    const {
      txParams: { to, from },
      isTransfer,
      transferInformation,
    } = tx;
    if (
      (safeToChecksumAddress(from ?? '') === this.selectedAddress ||
        safeToChecksumAddress(to ?? '') === this.selectedAddress) &&
      (chainId === tx.chainId || (!tx.chainId && networkId === tx.networkID)) &&
      tx.status !== 'unapproved'
    ) {
      if (to?.toLowerCase() === this.navAddress) return true;
      if (isTransfer && transferInformation)
        return (
          this.navAddress === transferInformation.contractAddress.toLowerCase()
        );
      if (
        swapsTransactions[tx.id] &&
        (to?.toLowerCase() ===
          swapsUtils.getSwapsContractAddress(chainId as Hex) ||
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

  normalizeTransactions() {
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
        const filterResult = this.filter ? this.filter(tx) : false;
        if (filterResult) {
          tx.insertImportTime =
            addedAccountTime !== undefined &&
            tx.time <= addedAccountTime &&
            !accountAddedTimeInsertPointFound;
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
              safeToChecksumAddress(confirmedTransaction.txParams.from ?? ''),
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
        filteredTransactions?.length
      ) {
        filteredTransactions[
          filteredTransactions.length - 1
        ].insertImportTime = true;
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
    const colors = (this.context as unknown as Theme).colors || mockTheme.colors;
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
    const colors = (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);
    const asset = navigation && params;
    const isSwapsFeatureLive = this.props.swapsIsLive;
    const isSwapsNetworkAllowed = isPortfolioViewEnabled()
      ? isSwapsAllowed(asset.chainId)
      : isSwapsAllowed(chainId);

    const isSwapsAssetAllowed = getIsSwapsAssetAllowed({
      asset,
      searchDiscoverySwapsTokens: this.props.searchDiscoverySwapsTokens ?? [],
      swapsTokens: this.props.swapsTokens,
    });

    const displaySwapsButton =
      isSwapsNetworkAllowed && isSwapsAssetAllowed && AppConstants.SWAPS.ACTIVE;

    const displayBridgeButton = isPortfolioViewEnabled()
      ? isBridgeAllowed(asset.chainId)
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
                  asset={asset}
                  displayBuyButton={displayBuyButton}
                  displaySwapsButton={displaySwapsButton}
                  displayBridgeButton={displayBridgeButton}
                  swapsIsLive={isSwapsFeatureLive}
                  networkName={
                    this.props.networkConfigurations[asset.chainId]?.name
                  }
                />
                <ActivityHeader asset={asset} />
              </>
            }
            assetSymbol={asset.symbol}
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

const mapStateToProps = (state: RootState, { route }: OwnProps): StateProps => ({
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
  networkClientId: selectNetworkClientId(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setLiveness: (chainId, featureFlags) =>
    dispatch(setSwapsLiveness(chainId, featureFlags)),
});

export default connect(mapStateToProps, mapDispatchToProps)(
  withMetricsAwareness(
    Asset as unknown as ComponentType<IWithMetricsAwarenessProps>,
  ),
);
