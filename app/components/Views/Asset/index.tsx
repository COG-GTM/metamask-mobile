import { swapsUtils } from '@metamask/swaps-controller/';
import React, { PureComponent } from 'react';
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
import { IWithMetricsAwarenessProps } from '../../../components/hooks/useMetrics/withMetricsAwareness.types';
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

import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Hex } from '@metamask/utils';
import { Dispatch } from 'redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { RootState } from '../../../reducers';
import { Theme } from '../../../util/theme/models';

interface AssetTransaction {
  id?: string;
  status?: string;
  chainId?: string;
  networkID?: string;
  type?: string;
  isTransfer?: boolean;
  insertImportTime?: boolean;
  transferInformation?: { contractAddress: string };
  txParams: { from?: string; to?: string; nonce?: string };
  [key: string]: unknown;
}

interface AssetRouteParams {
  chainId?: Hex;
  address?: string;
  symbol?: string;
  isNative?: boolean;
  isETH?: boolean;
  [key: string]: unknown;
}

interface AssetProps {
  /**
   * navigation object required to access the props passed by the parent component
   */
  navigation: NavigationProp<ParamListBase>;
  /**
   * conversion rate of ETH - FIAT
   */
  conversionRate?: number | null;
  /**
   * Selected currency
   */
  currentCurrency?: string;
  /**
   * InternalAccount object required to get account name
   */
  selectedInternalAccount?: InternalAccount;
  /**
   * The chain ID for the current selected network
   */
  chainId: Hex;
  /**
   * An array that represents the user transactions
   */
  transactions: AssetTransaction[];
  /**
   * Array of ERC20 assets
   */
  tokens: { address?: string }[];
  swapsIsLive?: boolean;
  swapsTokens?: Record<string, unknown>;
  searchDiscoverySwapsTokens?: string[];
  swapsTransactions: Record<string, Record<string, { address?: string }>>;
  /**
   * Object that represents the current route info like params passed to it
   */
  route: { params: AssetRouteParams };
  rpcUrl?: string;
  networkConfigurations: Record<string, { name?: string }>;
  /**
   * Boolean that indicates if network is supported to buy
   */
  isNetworkRampSupported?: boolean;
  /**
   * Boolean that indicates if native token is supported to buy
   */
  isNetworkBuyNativeTokenSupported?: boolean;
  /**
   * Function to set the swaps liveness
   */
  setLiveness: (chainId: Hex, featureFlags: unknown) => void;
}

interface AssetState {
  refreshing: boolean;
  loading: boolean;
  transactionsUpdated: boolean;
  submittedTxs: AssetTransaction[];
  confirmedTxs: AssetTransaction[];
  transactions: AssetTransaction[];
}

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
class Asset extends PureComponent<AssetProps, AssetState> {
  static contextType = ThemeContext;

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
  chainId: string = '';
  mounted = false;
  filter: ((tx: AssetTransaction) => unknown) | undefined = undefined;
  navSymbol: string = '';
  navAddress: string = '';
  selectedAddress = toChecksumHexAddress(
    this.props.selectedInternalAccount?.address as string,
  );

  getColors = () =>
    (this.context as unknown as Theme)?.colors || mockTheme.colors;

  updateNavBar = (contentOffset = 0) => {
    const {
      route: { params },
      navigation,
      route,
      chainId,
      rpcUrl,
      networkConfigurations,
    } = this.props;
    const colors = this.getColors();
    const isNativeToken = route.params.isNative ?? route.params.isETH;
    const isMainnet = isMainnetByChainId(chainId);
    const blockExplorer = isNonEvmChainId(chainId)
      ? findBlockExplorerForNonEvmChainId(chainId)
      : findBlockExplorerForRpc(
          rpcUrl,
          networkConfigurations as Parameters<
            typeof findBlockExplorerForRpc
          >[1],
        );

    const shouldShowMoreOptionsInNavBar =
      isMainnet || !isNativeToken || (isNativeToken && blockExplorer);
    const asset = navigation && params;
    const currentNetworkName =
      this.props.networkConfigurations[asset?.chainId as string]?.name;
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

  componentDidUpdate(prevProps: AssetProps) {
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
      (safeToChecksumAddress(from as string) === this.selectedAddress ||
        safeToChecksumAddress(to as string) === this.selectedAddress) &&
      (chainId === tx.chainId || (!tx.chainId && networkId === tx.networkID)) &&
      tx.status !== 'unapproved'
    ) {
      if (
        (TOKEN_CATEGORY_HASH as Record<string, boolean>)[type as string]
      ) {
        return false;
      }
      if (isTransfer) {
        return this.props.tokens.find(({ address }) =>
          toLowerCaseEquals(
            address as string,
            transferInformation?.contractAddress as string,
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
      (safeToChecksumAddress(from as string) === this.selectedAddress ||
        safeToChecksumAddress(to as string) === this.selectedAddress) &&
      (chainId === tx.chainId || (!tx.chainId && networkId === tx.networkID)) &&
      tx.status !== 'unapproved'
    ) {
      if (to?.toLowerCase() === this.navAddress) return true;
      if (isTransfer)
        return (
          this.navAddress ===
          transferInformation?.contractAddress.toLowerCase()
        );
      if (
        swapsTransactions[tx.id as string] &&
        (to?.toLowerCase() === swapsUtils.getSwapsContractAddress(chainId) ||
          to?.toLowerCase() === this.navAddress)
      ) {
        const { destinationToken, sourceToken } = swapsTransactions[
          tx.id as string
        ];
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
    const submittedNonces: (string | undefined)[] = [];

    const { chainId, transactions } = this.props;
    if (transactions.length) {
      const sortedTransactions = (
        sortTransactions(transactions) as AssetTransaction[]
      ).filter(
        (tx, index, self) =>
          self.findIndex((_tx) => _tx.id === tx.id) === index,
      );
      const filteredTransactions = sortedTransactions.filter((tx) => {
        const filterResult = this.filter?.(tx);
        if (filterResult) {
          tx.insertImportTime = addAccountTimeFlagFilter(
            tx,
            addedAccountTime as number,
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
      });

      submittedTxs = submittedTxs.filter(({ txParams: { from, nonce } }) => {
        if (!toLowerCaseEquals(from as string, this.selectedAddress)) {
          return false;
        }
        const alreadySubmitted = submittedNonces.includes(nonce);
        const alreadyConfirmed = confirmedTxs.find(
          (confirmedTransaction) =>
            toLowerCaseEquals(
              safeToChecksumAddress(
                confirmedTransaction.txParams.from as string,
              ) as string,
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
    const colors = this.getColors();
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
    const colors = this.getColors();
    const styles = createStyles(colors);
    const asset = (navigation && params) as AssetRouteParams;
    const isSwapsFeatureLive = this.props.swapsIsLive;
    const isSwapsNetworkAllowed = isPortfolioViewEnabled()
      ? isSwapsAllowed(asset.chainId as Hex)
      : isSwapsAllowed(chainId);

    const isSwapsAssetAllowed = getIsSwapsAssetAllowed({
      asset,
      searchDiscoverySwapsTokens: this.props.searchDiscoverySwapsTokens,
      swapsTokens: this.props.swapsTokens,
    } as unknown as Parameters<typeof getIsSwapsAssetAllowed>[0]);

    const displaySwapsButton =
      isSwapsNetworkAllowed && isSwapsAssetAllowed && AppConstants.SWAPS.ACTIVE;

    const displayBridgeButton = isPortfolioViewEnabled()
      ? isBridgeAllowed(asset.chainId as Hex)
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
                  asset={
                    asset as unknown as React.ComponentProps<
                      typeof AssetOverview
                    >['asset']
                  }
                  displayBuyButton={displayBuyButton}
                  displaySwapsButton={displaySwapsButton}
                  displayBridgeButton={displayBridgeButton}
                  swapsIsLive={isSwapsFeatureLive}
                  networkName={
                    this.props.networkConfigurations[asset.chainId as string]
                      ?.name
                  }
                />
                <ActivityHeader
                  asset={
                    asset as unknown as React.ComponentProps<
                      typeof ActivityHeader
                    >['asset']
                  }
                />
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
  { route }: { route: { params: AssetRouteParams } },
) => ({
  swapsIsLive: getSwapsIsLive(state, route.params.chainId as Hex),
  swapsTokens: isPortfolioViewEnabled()
    ? swapsTokensMultiChainObjectSelector(state)
    : swapsTokensObjectSelector(state),
  searchDiscoverySwapsTokens: selectSupportedSwapTokenAddressesForChainId(
    state,
    route.params.chainId as Hex,
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
  setLiveness: (chainId: Hex, featureFlags: unknown) =>
    dispatch(
      setSwapsLiveness(
        chainId,
        featureFlags as Parameters<typeof setSwapsLiveness>[1],
      ),
    ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withMetricsAwareness(
    Asset as unknown as React.ComponentType<IWithMetricsAwarenessProps>,
  ),
);
