import { swapsUtils } from '@metamask/swaps-controller/';
import React, { PureComponent, type ComponentType } from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  StyleSheet,
  View,
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
import type { Dispatch } from 'redux';
import type { RootState } from '../../../reducers';
import type { Hex } from '@metamask/utils';

interface ThemeColors {
  background: { default: string };
  border: { muted: string };
  overlay: { default: string };
}

const createStyles = (colors: ThemeColors) =>
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

interface AssetNavigation {
  navigate: (route: string, params?: object) => void;
  setOptions: (options: object) => void;
}

interface AssetParams {
  isNative?: boolean;
  isETH?: boolean;
  symbol?: string;
  address?: string;
  chainId?: Hex;
  [key: string]: unknown;
}

interface AssetRoute {
  params: AssetParams;
}

interface InternalAccount {
  address: string;
  metadata: { importTime?: number };
}

interface OwnProps {
  navigation: AssetNavigation;
  route: AssetRoute;
}

interface StateProps {
  conversionRate: unknown;
  currentCurrency: string;
  selectedInternalAccount: InternalAccount | undefined;
  chainId: Hex;
  transactions: TransactionItem[];
  tokens: TokenItem[];
  swapsIsLive: boolean;
  swapsTokens: Record<string, unknown> | null;
  searchDiscoverySwapsTokens: string[];
  swapsTransactions: Record<string, SwapTransactionItem>;
  rpcUrl: string;
  networkConfigurations: Record<string, { name?: string }>;
  isNetworkRampSupported: boolean;
  isNetworkBuyNativeTokenSupported: boolean;
  networkClientId: string;
}

interface DispatchProps {
  setLiveness: (chainId: Hex, featureFlags: unknown) => void;
}

type Props = OwnProps & StateProps & DispatchProps;

interface TokenItem {
  address: string;
  [key: string]: unknown;
}

interface SwapTransactionItem {
  destinationToken: { address: string };
  sourceToken: { address: string };
}

interface TransactionItem {
  id: string;
  status: string;
  chainId?: Hex;
  networkID?: string;
  isTransfer?: boolean;
  transferInformation?: { contractAddress: string };
  type?: string;
  txParams: { from?: string; to?: string; nonce?: number };
  insertImportTime?: boolean;
}

interface State {
  refreshing: boolean;
  loading: boolean;
  transactionsUpdated: boolean;
  submittedTxs: TransactionItem[];
  confirmedTxs: TransactionItem[];
  transactions: TransactionItem[];
}

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

  txs: TransactionItem[] = [];
  txsPending: TransactionItem[] = [];
  isNormalizing = false;
  chainId: Hex | '' = '';
  filter: ((tx: TransactionItem) => boolean) | undefined = undefined;
  navSymbol: string | undefined = undefined;
  navAddress: string | undefined = undefined;
  mounted = false;
  selectedAddress: string =
    toChecksumHexAddress(
      this.props.selectedInternalAccount?.address ?? '',
    ) ?? '';

  updateNavBar = (contentOffset = 0) => {
    const {
      route: { params },
      navigation,
      route,
      chainId,
      rpcUrl,
      networkConfigurations,
    } = this.props;
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const isNativeToken = route.params.isNative ?? route.params.isETH;
    const isMainnet = isMainnetByChainId(chainId);
    const blockExplorer = isNonEvmChainId(chainId)
      ? findBlockExplorerForNonEvmChainId(chainId)
      : findBlockExplorerForRpc(rpcUrl, networkConfigurations);

    const shouldShowMoreOptionsInNavBar =
      isMainnet || !isNativeToken || (isNativeToken && blockExplorer);
    const asset = navigation && params;
    const assetChainId = (asset as AssetParams)?.chainId;
    const currentNetworkName = assetChainId
      ? networkConfigurations[assetChainId]?.name
      : undefined;
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

  onScrollThroughContent = (contentOffset = 0) => {
    this.updateNavBar(contentOffset);
  };

  checkLiveness = async (chainId: Hex) => {
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

  didTxStatusesChange = (newTxsPending: TransactionItem[]) =>
    this.txsPending.length !== newTxsPending.length;

  ethFilter = (tx: TransactionItem) => {
    const { networkId } = (
      store.getState() as { inpageProvider: { networkId: string } }
    ).inpageProvider;
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
      if (type && TOKEN_CATEGORY_HASH[type as keyof typeof TOKEN_CATEGORY_HASH]) {
        return false;
      }
      if (isTransfer && transferInformation) {
        return Boolean(
          this.props.tokens.find(({ address }: TokenItem) =>
            toLowerCaseEquals(address, transferInformation.contractAddress),
          ),
        );
      }

      return true;
    }
    return false;
  };

  noEthFilter = (tx: TransactionItem) => {
    const { networkId } = (
      store.getState() as { inpageProvider: { networkId: string } }
    ).inpageProvider;

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
        (to?.toLowerCase() === swapsUtils.getSwapsContractAddress(chainId) ||
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

    let submittedTxs: TransactionItem[] = [];
    const newPendingTxs: TransactionItem[] = [];
    const confirmedTxs: TransactionItem[] = [];
    const submittedNonces: number[] = [];

    const { chainId, transactions } = this.props;
    if (transactions.length) {
      const sortedTransactions = sortTransactions(transactions).filter(
        (tx: TransactionItem, index: number, self: TransactionItem[]) =>
          self.findIndex((_tx) => _tx.id === tx.id) === index,
      );
      const filteredTransactions = sortedTransactions.filter(
        (tx: TransactionItem) => {
          const filterResult = this.filter ? this.filter(tx) : false;
          if (filterResult) {
            tx.insertImportTime = addAccountTimeFlagFilter(
              tx as unknown as object,
              addedAccountTime as unknown as object,
              accountAddedTimeInsertPointFound as unknown as object,
            );
            if (tx.insertImportTime)
              accountAddedTimeInsertPointFound = true;
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
        ({ txParams: { from, nonce } }: TransactionItem) => {
          if (!toLowerCaseEquals(from, this.selectedAddress)) {
            return false;
          }
          const alreadySubmitted =
            nonce !== undefined && submittedNonces.includes(nonce);
          const alreadyConfirmed = confirmedTxs.find(
            (confirmedTransaction) =>
              toLowerCaseEquals(
                safeToChecksumAddress(
                  confirmedTransaction.txParams.from ?? '',
                ),
                this.selectedAddress,
              ) && confirmedTransaction.txParams.nonce === nonce,
          );
          if (alreadyConfirmed) {
            return false;
          }
          if (nonce !== undefined) submittedNonces.push(nonce);
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

  renderLoader = () => {
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors as ThemeColors);

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
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors as ThemeColors);
    const asset = (navigation && params) as AssetParams;
    const isSwapsFeatureLive = this.props.swapsIsLive;
    const isSwapsNetworkAllowed = isPortfolioViewEnabled()
      ? isSwapsAllowed(asset.chainId as Hex)
      : isSwapsAllowed(chainId);

    const isSwapsAssetAllowed = getIsSwapsAssetAllowed({
      asset,
      searchDiscoverySwapsTokens: this.props.searchDiscoverySwapsTokens,
      swapsTokens: this.props.swapsTokens ?? {},
    } as unknown as Parameters<typeof getIsSwapsAssetAllowed>[0]);

    const displaySwapsButton =
      isSwapsNetworkAllowed && isSwapsAssetAllowed && AppConstants.SWAPS.ACTIVE;

    const displayBridgeButton = isPortfolioViewEnabled()
      ? isBridgeAllowed(asset.chainId as Hex)
      : isBridgeAllowed(chainId);

    const displayBuyButton = asset.isETH
      ? this.props.isNetworkBuyNativeTokenSupported
      : this.props.isNetworkRampSupported;

    const TransactionsAny = Transactions as unknown as ComponentType<
      Record<string, unknown>
    >;
    const AssetOverviewAny = AssetOverview as unknown as ComponentType<
      Record<string, unknown>
    >;
    const ActivityHeaderAny = ActivityHeader as unknown as ComponentType<
      Record<string, unknown>
    >;
    return (
      <View style={styles.wrapper}>
        {loading ? (
          this.renderLoader()
        ) : (
          <TransactionsAny
            header={
              <>
                <AssetOverviewAny
                  asset={asset}
                  displayBuyButton={displayBuyButton}
                  displaySwapsButton={displaySwapsButton}
                  displayBridgeButton={displayBridgeButton}
                  swapsIsLive={isSwapsFeatureLive}
                  networkName={
                    asset.chainId
                      ? this.props.networkConfigurations[asset.chainId]?.name
                      : undefined
                  }
                />
                <ActivityHeaderAny asset={asset} />
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

const mapStateToProps = (
  state: RootState,
  { route }: { route: AssetRoute },
): StateProps => ({
  swapsIsLive: getSwapsIsLive(state, route.params.chainId as Hex),
  swapsTokens: isPortfolioViewEnabled()
    ? swapsTokensMultiChainObjectSelector(state)
    : swapsTokensObjectSelector(state),
  searchDiscoverySwapsTokens: selectSupportedSwapTokenAddressesForChainId(
    state,
    route.params.chainId as Hex,
  ),
  swapsTransactions: selectSwapsTransactions(
    state,
  ) as unknown as Record<string, SwapTransactionItem>,
  conversionRate: selectConversionRate(state),
  currentCurrency: selectCurrentCurrency(state),
  selectedInternalAccount: selectSelectedInternalAccount(
    state,
  ) as unknown as InternalAccount | undefined,
  chainId: selectChainId(state) as Hex,
  tokens: selectTokens(state) as unknown as TokenItem[],
  transactions: selectTransactions(state) as unknown as TransactionItem[],
  rpcUrl: selectRpcUrl(state) as string,
  networkConfigurations: selectNetworkConfigurations(
    state,
  ) as unknown as Record<string, { name?: string }>,
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
  setLiveness: (chainId: Hex, featureFlags: unknown) =>
    dispatch(setSwapsLiveness(chainId, featureFlags)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withMetricsAwareness(
    Asset as unknown as ComponentType<
      import('../../hooks/useMetrics/withMetricsAwareness.types').IWithMetricsAwarenessProps
    >,
  ),
);
