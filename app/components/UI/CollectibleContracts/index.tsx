import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import { connect, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { Theme } from '../../../util/theme/models';
import { Hex } from '@metamask/utils';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import Engine from '../../../core/Engine';
import CollectibleContractElement from '../CollectibleContractElement';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { JsonMap } from '../../../core/Analytics/MetaMetrics.types';
import {
  favoritesCollectiblesSelector,
  isNftFetchingProgressSelector,
  multichainCollectibleContractsSelector,
  multichainCollectiblesSelector,
} from '../../../reducers/collectibles';
import { removeFavoriteCollectible as removeFavoriteCollectibleAction } from '../../../actions/collectibles';
import AppConstants from '../../../core/AppConstants';
import { toLowerCaseEquals } from '../../../util/general';
import { compareTokenIds } from '../../../util/tokens';
import CollectibleDetectionModal from '../CollectibleDetectionModal';
import { useTheme } from '../../../util/theme';
import { MAINNET } from '../../../constants/network';
import {
  selectChainId,
  selectIsAllNetworks,
  selectIsPopularNetwork,
  selectProviderType,
} from '../../../selectors/networkController';
import {
  selectDisplayNftMedia,
  selectIsIpfsGatewayEnabled,
  selectUseNftDetection,
} from '../../../selectors/preferencesController';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import { WalletViewSelectorsIDs } from '../../../../e2e/selectors/wallet/WalletView.selectors';
import { useMetrics } from '../../../components/hooks/useMetrics';
import { RefreshTestId, SpinnerTestId } from './constants';
import { debounce, cloneDeep } from 'lodash';
import ButtonBase from '../../../component-library/components/Buttons/Button/foundation/ButtonBase';
import { IconName } from '../../../component-library/components/Icons/Icon';
import { selectIsEvmNetworkSelected } from '../../../selectors/multichainNetworkController';
import { selectNetworkName } from '../../../selectors/networkInfos';
import { isTestNet, getDecimalChainId } from '../../../util/networks';
import { createTokenBottomSheetFilterNavDetails } from '../Tokens/TokensBottomSheet';
import { useNftDetectionChainIds } from '../../hooks/useNftDetectionChainIds';
import Logger from '../../../util/Logger';
import { prepareNftDetectionEvents } from '../../../util/assets';
import { RootState } from '../../../reducers';

interface Collectible {
  address: string;
  tokenId: string;
  name?: string;
  image?: string;
  chainId?: string;
  isCurrentlyOwned?: boolean;
}

interface CollectibleContract {
  address?: string;
  name?: string;
  logo?: string;
}

interface CollectibleContractsProps {
  /**
   * Network type
   */
  networkType?: string;
  /**
   * Chain id
   */
  chainId: ReturnType<typeof selectChainId>;
  /**
   * Selected address
   */
  selectedAddress?: string;
  /**
   * Array of collectibleContract objects
   */
  collectibleContracts: Record<string, CollectibleContract[]>;
  /**
   * Array of collectibles objects
   */
  collectibles: Record<string, Collectible[]>;
  /**
   * boolean indicating if fetching status is
   * still in progress
   */
  isNftFetchingProgress?: boolean;
  /**
   * Navigation object required to push
   * the Asset detail view
   */
  navigation: NavigationProp<ParamListBase>;
  tabLabel?: string;
  /**
   * Object of collectibles
   */
  favoriteCollectibles: Collectible[];
  /**
   * Dispatch remove collectible from favorites action
   */
  removeFavoriteCollectible: (
    selectedAddress: string | undefined,
    chainId: string,
    collectible: Collectible,
  ) => void;
  /**
   * Boolean to show if NFT detection is enabled
   */
  useNftDetection?: boolean;
  /**
   * Boolean to show content stored on IPFS
   */
  isIpfsGatewayEnabled?: boolean;
  /**
   * Boolean to show Nfts media stored on third parties
   */
  displayNftMedia?: boolean;
}

/**
 * `Text` is rendered with legacy presentational props that the React Native
 * `Text` component ignores at runtime; this alias keeps that markup unchanged.
 */
const LegacyText = Text as unknown as React.ComponentType<
  React.ComponentProps<typeof Text> & {
    center?: boolean;
    big?: boolean;
    link?: boolean;
    bold?: boolean;
  }
>;

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      marginTop: 16,
    },
    BarWrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    actionBarWrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingLeft: 8,
      paddingRight: 8,
      paddingBottom: 16,
      paddingTop: 8,
    },
    controlButtonOuterWrapper: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
    },
    text: {
      fontSize: 20,
      color: colors.text.default,
      ...fontStyles.normal,
    },
    controlButtonText: {
      color: colors.text.default,
    },
    controlButtonDisabled: {
      backgroundColor: colors.background.default,
      borderColor: colors.border.default,
      borderStyle: 'solid',
      borderWidth: 1,
      marginLeft: 5,
      marginRight: 5,
      maxWidth: '60%',
      opacity: 0.5,
      borderRadius: 20,
    },
    controlButton: {
      backgroundColor: colors.background.default,
      borderColor: colors.border.default,
      borderStyle: 'solid',
      borderWidth: 1,
      marginLeft: 5,
      marginRight: 5,
      maxWidth: '60%',
      borderRadius: 20,
    },
    emptyView: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    addText: {
      fontSize: 14,
      color: colors.primary.default,
      ...fontStyles.normal,
    },
    footer: {
      flex: 1,
      alignItems: 'center',
      marginTop: 8,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
    },
    emptyImageContainer: {
      width: 76,
      height: 76,
      marginTop: 30,
      marginBottom: 12,
      tintColor: colors.icon.muted,
    },
    emptyTitleText: {
      fontSize: 24,
      color: colors.text.alternative,
    },
    emptyText: {
      color: colors.text.alternative,
      marginBottom: 8,
      fontSize: 14,
    },
    spinner: {
      marginBottom: 8,
    },
  });

const debouncedNavigation = debounce(
  (
    navigation: NavigationProp<ParamListBase>,
    collectible: Collectible | undefined,
  ) => {
    navigation.navigate('NftDetails', { collectible });
  },
  200,
);

/**
 * View that renders a list of CollectibleContract
 * ERC-721 and ERC-1155
 */
const CollectibleContracts = ({
  selectedAddress,
  chainId,
  networkType,
  navigation,
  collectibleContracts,
  collectibles: allCollectibles,
  isNftFetchingProgress,
  favoriteCollectibles,
  removeFavoriteCollectible,
  useNftDetection,
  isIpfsGatewayEnabled,
  displayNftMedia,
}: CollectibleContractsProps) => {
  const isAllNetworks = useSelector(selectIsAllNetworks);

  const filteredCollectibleContracts = useMemo(
    () =>
      isAllNetworks
        ? Object.values(collectibleContracts).flat()
        : collectibleContracts[chainId] || [],
    [collectibleContracts, chainId, isAllNetworks],
  );

  const filteredCollectibles = useMemo(
    () =>
      isAllNetworks
        ? Object.values(allCollectibles).flat()
        : allCollectibles[chainId] || [],
    [allCollectibles, chainId, isAllNetworks],
  );

  const collectibles = filteredCollectibles.filter(
    (singleCollectible: Collectible) =>
      singleCollectible.isCurrentlyOwned === true,
  );

  const { colors } = useTheme();
  const { trackEvent, createEventBuilder } = useMetrics();
  const styles = createStyles(colors);
  const [isAddNFTEnabled, setIsAddNFTEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isPopularNetwork = useSelector(selectIsPopularNetwork);
  const isEvmSelected = useSelector(selectIsEvmNetworkSelected);
  const networkName = useSelector(selectNetworkName);
  const showFilterControls = () => {
    navigation.navigate(...createTokenBottomSheetFilterNavDetails({}));
  };
  const chainIdsToDetectNftsFor = useNftDetectionChainIds();

  const isCollectionDetectionBannerVisible =
    networkType === MAINNET && !useNftDetection;

  const onItemPress = useCallback(
    (collectible: Collectible | undefined) => {
      debouncedNavigation(navigation, collectible);
    },
    [navigation],
  );

  /**
   * Method that checks if the collectible is inside the collectibles array. If it is not it means the
   * collectible has been ignored, hence we should not call the updateMetadata which executes the addNft fct
   *
   * @returns Boolean indicating if the collectible is ignored or not.
   */
  const isCollectibleIgnored = useCallback(
    (collectible: Collectible) => {
      const found = collectibles.find(
        (elm: Collectible) =>
          elm.address === collectible.address &&
          elm.tokenId === collectible.tokenId,
      );
      if (found) return false;
      return true;
    },
    [collectibles],
  );

  /**
   * Method to check the token id data type of the current collectibles.
   *
   * @param collectible - Collectible object.
   * @returns Boolean indicating if the collectible should be updated.
   */
  const shouldUpdateCollectibleMetadata = (collectible: Collectible) =>
    typeof collectible.tokenId === 'number' ||
    (typeof collectible.tokenId === 'string' &&
      !isNaN(collectible.tokenId as unknown as number));

  const updateAllCollectibleMetadata = useCallback(
    async (collectiblesToUpdate: Collectible[]) => {
      const { NftController } = Engine.context;
      // Filter out ignored collectibles
      const filteredcollectibles = collectiblesToUpdate.filter(
        (collectible: Collectible) => !isCollectibleIgnored(collectible),
      );

      // filter removable collectible
      const removable = filteredcollectibles.filter((single: Collectible) =>
        String(single.tokenId).includes('e+'),
      );
      const updatable = filteredcollectibles.filter(
        (single: Collectible) => !String(single.tokenId).includes('e+'),
      );

      removable.forEach((elm: Collectible) => {
        removeFavoriteCollectible(selectedAddress, chainId, elm);
      });

      filteredcollectibles.forEach((collectible: Collectible) => {
        if (String(collectible.tokenId).includes('e+')) {
          removeFavoriteCollectible(selectedAddress, chainId, collectible);
        }
      });

      if (updatable.length !== 0) {
        await NftController.updateNftMetadata({
          nfts: updatable,
          userAddress: selectedAddress,
        } as unknown as Parameters<typeof NftController.updateNftMetadata>[0]);
      }
    },
    [isCollectibleIgnored, removeFavoriteCollectible, chainId, selectedAddress],
  );

  useEffect(() => {
    if (!isIpfsGatewayEnabled && !displayNftMedia) {
      return;
    }
    // TO DO: Move this fix to the controllers layer
    const updatableCollectibles = collectibles.filter((single: Collectible) =>
      shouldUpdateCollectibleMetadata(single),
    );
    if (updatableCollectibles.length !== 0 && !useNftDetection) {
      updateAllCollectibleMetadata(updatableCollectibles);
    }
  }, [
    collectibles,
    updateAllCollectibleMetadata,
    isIpfsGatewayEnabled,
    displayNftMedia,
    useNftDetection,
  ]);

  const goToAddCollectible = useCallback(() => {
    setIsAddNFTEnabled(false);
    (
      navigation as unknown as {
        push: (route: string, params?: Record<string, unknown>) => void;
      }
    ).push('AddAsset', { assetType: 'collectible' });
    trackEvent(
      createEventBuilder(MetaMetricsEvents.WALLET_ADD_COLLECTIBLES).build(),
    );
    setIsAddNFTEnabled(true);
  }, [navigation, trackEvent, createEventBuilder]);

  const renderFooter = useCallback(
    () => (
      <View style={styles.footer} key={'collectible-contracts-footer'}>
        {isNftFetchingProgress ? (
          <ActivityIndicator
            size="large"
            style={styles.spinner}
            testID={SpinnerTestId}
          />
        ) : null}

        <LegacyText style={styles.emptyText}>
          {strings('wallet.no_collectibles')}
        </LegacyText>
        <TouchableOpacity
          onPress={goToAddCollectible}
          disabled={!isAddNFTEnabled}
          testID={WalletViewSelectorsIDs.IMPORT_NFT_BUTTON}
        >
          <LegacyText style={styles.addText}>
            {strings('wallet.add_collectibles')}
          </LegacyText>
        </TouchableOpacity>
      </View>
    ),
    [goToAddCollectible, isAddNFTEnabled, styles, isNftFetchingProgress],
  );

  const renderCollectibleContract = useCallback(
    (item: CollectibleContract, index: number) => {
      const contractCollectibles = collectibles?.filter(
        (collectible: Collectible) =>
          toLowerCaseEquals(collectible.address, item.address),
      );
      return (
        <CollectibleContractElement
          onPress={onItemPress}
          asset={item}
          key={item.address}
          contractCollectibles={contractCollectibles}
          collectiblesVisible={index === 0}
        />
      );
    },
    [collectibles, onItemPress],
  );

  const renderFavoriteCollectibles = useCallback(() => {
    const favoriteCollectiblesList = favoriteCollectibles.map((collectible) =>
      collectibles.find(
        ({ tokenId, address }) =>
          compareTokenIds(collectible.tokenId, tokenId) &&
          collectible.address === address,
      ),
    );
    return (
      Boolean(favoriteCollectiblesList.length) && (
        <CollectibleContractElement
          onPress={onItemPress}
          asset={{ name: 'Favorites', favorites: true }}
          key={'Favorites'}
          contractCollectibles={
            favoriteCollectiblesList as unknown as Collectible[]
          }
          collectiblesVisible
        />
      )
    );
  }, [favoriteCollectibles, collectibles, onItemPress]);

  const getNftDetectionAnalyticsParams = useCallback((nft: Collectible) => {
    try {
      return {
        chain_id: getDecimalChainId(nft.chainId as Hex),
        source: 'detected',
      };
    } catch (error) {
      Logger.error(
        error as Error,
        'CollectibleContracts.getNftDetectionAnalyticsParams',
      );
      return undefined;
    }
  }, []);

  const onRefresh = useCallback(async () => {
    requestAnimationFrame(async () => {
      // Get initial state of NFTs before refresh
      const { NftDetectionController, NftController } = Engine.context;
      const previousNfts = cloneDeep(
        NftController.state.allNfts[(selectedAddress as string).toLowerCase()],
      );

      setRefreshing(true);

      const actions = [
        NftDetectionController.detectNfts(chainIdsToDetectNftsFor),
        NftController.checkAndUpdateAllNftsOwnershipStatus(),
      ];
      await Promise.allSettled(actions);
      setRefreshing(false);

      // Get updated state after refresh
      const newNfts = cloneDeep(
        NftController.state.allNfts[(selectedAddress as string).toLowerCase()],
      );

      const eventParams = prepareNftDetectionEvents(
        previousNfts,
        newNfts,
        getNftDetectionAnalyticsParams as unknown as Parameters<
          typeof prepareNftDetectionEvents
        >[2],
      );
      eventParams.forEach((params) => {
        trackEvent(
          createEventBuilder(MetaMetricsEvents.COLLECTIBLE_ADDED)
            .addProperties(params as unknown as JsonMap)
            .build(),
        );
      });
    });
  }, [
    chainIdsToDetectNftsFor,
    createEventBuilder,
    getNftDetectionAnalyticsParams,
    selectedAddress,
    trackEvent,
  ]);

  const goToLearnMore = useCallback(
    () =>
      navigation.navigate('Webview', {
        screen: 'SimpleWebview',
        params: { url: AppConstants.URLS.NFT },
      }),
    [navigation],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Image
          style={styles.emptyImageContainer}
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../../images/no-nfts-placeholder.png')}
          resizeMode={'contain'}
        />
        <LegacyText center style={styles.emptyTitleText} bold>
          {strings('wallet.no_nfts_yet')}
        </LegacyText>
        <LegacyText center big link onPress={goToLearnMore}>
          {strings('wallet.learn_more')}
        </LegacyText>
      </View>
    ),
    [goToLearnMore, styles],
  );

  const renderList = useCallback(
    () => (
      <FlatList
        ListHeaderComponent={
          <>
            {isCollectionDetectionBannerVisible && (
              <View style={styles.emptyView}>
                <CollectibleDetectionModal />
              </View>
            )}
            {renderFavoriteCollectibles()}
          </>
        }
        data={filteredCollectibleContracts}
        renderItem={({ item, index }) => renderCollectibleContract(item, index)}
        keyExtractor={(_, index) => index.toString()}
        testID={RefreshTestId}
        refreshControl={
          <RefreshControl
            colors={[colors.primary.default]}
            tintColor={colors.icon.default}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={renderFooter()}
      />
    ),
    [
      renderFavoriteCollectibles,
      filteredCollectibleContracts,
      colors.primary.default,
      colors.icon.default,
      refreshing,
      onRefresh,
      renderCollectibleContract,
      renderFooter,
      renderEmpty,
      isCollectionDetectionBannerVisible,
      styles.emptyView,
    ],
  );

  return (
    <View
      style={styles.BarWrapper}
      testID={WalletViewSelectorsIDs.NFT_TAB_CONTAINER}
    >
      <View style={styles.actionBarWrapper}>
        <View style={styles.controlButtonOuterWrapper}>
          <ButtonBase
            testID={WalletViewSelectorsIDs.TOKEN_NETWORK_FILTER}
            label={
              <LegacyText style={styles.controlButtonText} numberOfLines={1}>
                {isAllNetworks && isPopularNetwork && isEvmSelected
                  ? strings('wallet.popular_networks')
                  : networkName ?? strings('wallet.current_network')}
              </LegacyText>
            }
            isDisabled={isTestNet(chainId) || !isPopularNetwork}
            onPress={isEvmSelected ? showFilterControls : () => null}
            endIconName={isEvmSelected ? IconName.ArrowDown : undefined}
            style={
              isTestNet(chainId) || !isPopularNetwork
                ? styles.controlButtonDisabled
                : styles.controlButton
            }
            disabled={isTestNet(chainId) || !isPopularNetwork}
          />
        </View>
      </View>
      {renderList()}
    </View>
  );
};

const mapStateToProps = (state: RootState) => ({
  networkType: selectProviderType(state),
  chainId: selectChainId(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  useNftDetection: selectUseNftDetection(state),
  collectibleContracts: multichainCollectibleContractsSelector(state),
  collectibles: multichainCollectiblesSelector(state),
  isNftFetchingProgress: isNftFetchingProgressSelector(state),
  favoriteCollectibles: favoritesCollectiblesSelector(state),
  isIpfsGatewayEnabled: selectIsIpfsGatewayEnabled(state),
  displayNftMedia: selectDisplayNftMedia(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  removeFavoriteCollectible: (
    selectedAddress: string | undefined,
    chainId: string,
    collectible: Collectible,
  ) =>
    dispatch(
      removeFavoriteCollectibleAction(selectedAddress, chainId, collectible),
    ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CollectibleContracts);
