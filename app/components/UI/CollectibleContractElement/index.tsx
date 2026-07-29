import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Nft } from '@metamask/assets-controllers';
import { ThemeColors, BrandColor } from '@metamask/design-tokens';
import { fontStyles } from '../../../styles/common';
import CollectibleMedia from '../CollectibleMedia';
import Device from '../../../util/device';
import Text from '../../Base/Text';
import ActionSheet from '@metamask/react-native-actionsheet';
import { strings } from '../../../../locales/i18n';
import Engine from '../../../core/Engine';
import { removeFavoriteCollectible as removeFavoriteCollectibleAction } from '../../../actions/collectibles';
import { useTheme } from '../../../util/theme';
import { selectChainId } from '../../../selectors/networkController';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import Icon, {
  IconName,
  IconColor,
  IconSize,
} from '../../../component-library/components/Icons/Icon';
import {
  MetaMetricsEvents,
  useMetrics,
} from '../../../components/hooks/useMetrics';
import { getDecimalChainId } from '../../../util/networks';
import { RootState } from '../../../reducers';
import { CollectibleMediaProps } from '../CollectibleMedia/CollectibleMedia.types';

const DEVICE_WIDTH = Device.getDeviceWidth();
const COLLECTIBLE_WIDTH = (DEVICE_WIDTH - 30 - 16) / 3;

const createStyles = (colors: ThemeColors, brandColors: BrandColor) =>
  StyleSheet.create({
    itemWrapper: {
      paddingHorizontal: 15,
      paddingBottom: 16,
    },
    collectibleContractIcon: { width: 30, height: 30 },
    collectibleContractIconContainer: { marginHorizontal: 8, borderRadius: 30 },
    titleContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    verticalAlignedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    titleText: {
      fontSize: 18,
      color: colors.text.default,
      ...fontStyles.normal,
    },
    collectibleIcon: {
      width: COLLECTIBLE_WIDTH,
      height: COLLECTIBLE_WIDTH,
    },
    collectibleInTheMiddle: {
      marginHorizontal: 8,
    },
    collectiblesRowContainer: {
      flex: 1,
      flexDirection: 'row',
      marginTop: 15,
    },
    collectibleBox: {
      flex: 1,
      flexDirection: 'row',
    },
    favoritesLogoWrapper: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: brandColors.yellow500 as string,
    },
  });

interface CollectibleContractAsset {
  address?: string;
  name?: string;
  logo?: string;
  favorites?: boolean;
}

/**
 * Collectibles rendered in the grid are only guaranteed to carry an address
 * and a token id; the rest of the NFT metadata is filled in asynchronously.
 */
type CollectibleItem = Partial<Nft> & {
  address: string;
  tokenId: string;
  logo?: string;
};

interface OwnProps {
  /**
   * Object being rendered
   */
  asset: CollectibleContractAsset;
  /**
   * Array of collectibles. Favorites that are no longer owned resolve to
   * `undefined`.
   */
  contractCollectibles: (CollectibleItem | undefined)[];
  /**
   * Whether the collectibles are visible or not
   */
  collectiblesVisible?: boolean;
  /**
   * Called when the collectible is pressed
   */
  onPress: (collectible: CollectibleItem) => void;
  /**
   * Dispatch remove collectible from favorites action. Provided by
   * `mapDispatchToProps`, but call sites may override it.
   */
  removeFavoriteCollectible?: (
    selectedAddress: string | undefined,
    chainId: string,
    collectible: CollectibleItem | null,
  ) => void;
}

interface StateProps {
  /**
   * Chain id
   */
  chainId: string;
  /**
   * Selected address
   */
  selectedAddress?: string;
}

interface DispatchProps {
  removeFavoriteCollectible: (
    selectedAddress: string | undefined,
    chainId: string,
    collectible: CollectibleItem | null,
  ) => void;
}

type CollectibleContractElementProps = OwnProps & StateProps & DispatchProps;

/**
 * The collectible boxes below pass a `styles` prop, which `View` ignores; it is
 * kept to preserve the rendered output.
 */
const CollectibleBox = View as unknown as React.FC<
  ViewProps & { styles?: StyleProp<ViewStyle>; children?: React.ReactNode }
>;

/**
 * `CollectibleMedia` expects a fully populated NFT; the collectibles rendered
 * here are partially populated list items.
 */
const CollectibleMediaItem = CollectibleMedia as unknown as React.FC<
  Omit<CollectibleMediaProps, 'collectible'> & {
    collectible: Partial<Nft> & { logo?: string };
    iconStyle?: CollectibleMediaProps['style'];
  }
>;

const splitIntoSubArrays = (
  array: (CollectibleItem | undefined)[],
  count: number,
): (CollectibleItem | undefined)[][] => {
  const newArray: (CollectibleItem | undefined)[][] = [];
  while (array.length > 0) {
    newArray.push(array.splice(0, count));
  }
  return newArray;
};

/**
 * Customizable view to render assets in lists
 */
function CollectibleContractElement({
  asset,
  contractCollectibles,
  collectiblesVisible: propsCollectiblesVisible,
  onPress,
  chainId,
  selectedAddress,
  removeFavoriteCollectible,
}: CollectibleContractElementProps) {
  const [collectiblesGrid, setCollectiblesGrid] = useState<
    (CollectibleItem | undefined)[][]
  >([]);
  const [collectiblesVisible, setCollectiblesVisible] = useState(
    propsCollectiblesVisible,
  );
  const actionSheetRef = useRef<{ show: () => void } | null>(null);
  const longPressedCollectible = useRef<CollectibleItem | null>(null);
  const { colors, themeAppearance, brandColors } = useTheme();
  const styles = createStyles(colors, brandColors);
  const { trackEvent, createEventBuilder } = useMetrics();

  const toggleCollectibles = useCallback(() => {
    setCollectiblesVisible(!collectiblesVisible);
  }, [collectiblesVisible, setCollectiblesVisible]);

  const onPressCollectible = useCallback(
    (collectible: CollectibleItem) => {
      onPress(collectible);
    },
    [onPress],
  );

  const onLongPressCollectible = useCallback(
    (collectible: CollectibleItem) => {
      actionSheetRef.current?.show();
      longPressedCollectible.current = collectible;
    },
    [],
  );

  const removeNft = () => {
    const { NftController } = Engine.context;
    removeFavoriteCollectible(
      selectedAddress,
      chainId,
      longPressedCollectible.current,
    );
    const collectible = longPressedCollectible.current as CollectibleItem;
    NftController.removeAndIgnoreNft(collectible.address, collectible.tokenId);
    trackEvent(
      createEventBuilder(MetaMetricsEvents.COLLECTIBLE_REMOVED)
        .addProperties({
          chain_id: getDecimalChainId(chainId),
        })
        .build(),
    );
    Alert.alert(
      strings('wallet.collectible_removed_title'),
      strings('wallet.collectible_removed_desc'),
    );
  };

  const refreshMetadata = () => {
    const { NftController } = Engine.context;

    const collectible = longPressedCollectible.current as CollectibleItem;
    NftController.addNft(collectible.address, collectible.tokenId);
  };

  const handleMenuAction = (index: number) => {
    if (index === 1) {
      removeNft();
    } else if (index === 0) {
      refreshMetadata();
    }
  };

  const renderCollectible = useCallback(
    (collectible: CollectibleItem, index: number) => {
      if (!collectible) return null;
      const onPressItem = () => onPressCollectible({ ...collectible });
      const onLongPress = () =>
        !asset.favorites ? onLongPressCollectible({ ...collectible }) : null;
      return (
        <CollectibleBox
          key={collectible.address + collectible.tokenId}
          styles={styles.collectibleBox}
          testID={`collectible-${collectible.name}-${collectible.tokenId}`}
        >
          <TouchableOpacity
            onPress={onPressItem}
            onLongPress={onLongPress}
            testID={`collectible-${collectible.name}-${collectible.tokenId}`}
          >
            <View style={index === 1 ? styles.collectibleInTheMiddle : {}}>
              <CollectibleMediaItem
                style={styles.collectibleIcon}
                collectible={{ ...collectible }}
                onPressColectible={onPressItem}
                isTokenImage
              />
            </View>
          </TouchableOpacity>
        </CollectibleBox>
      );
    },
    [asset.favorites, onPressCollectible, onLongPressCollectible, styles],
  );

  useEffect(() => {
    const temp = splitIntoSubArrays(contractCollectibles, 3);

    setCollectiblesGrid(temp);
  }, [contractCollectibles, setCollectiblesGrid]);
  return (
    <View style={styles.itemWrapper}>
      <TouchableOpacity
        testID={`collectible-contract-element-${asset.address}-${asset.name}`}
        onPress={toggleCollectibles}
        style={styles.titleContainer}
      >
        <View style={styles.verticalAlignedContainer}>
          <Icon
            name={
              collectiblesVisible ? IconName.ArrowDown : IconName.ArrowRight
            }
            size={IconSize.Xs}
            color={IconColor.Default}
          />
        </View>
        <View style={styles.collectibleContractIconContainer}>
          {!asset.favorites ? (
            <CollectibleMediaItem
              iconStyle={styles.collectibleContractIcon}
              collectible={{
                name: strings('collectible.untitled_collection'),
                ...asset,
                image: asset.logo,
              }}
              tiny
            />
          ) : (
            <View style={styles.favoritesLogoWrapper}>
              <Icon
                name={IconName.Star}
                color={IconColor.Inverse}
                size={IconSize.Lg}
              />
            </View>
          )}
        </View>
        <View style={styles.verticalAlignedContainer}>
          <Text numberOfLines={1} style={styles.titleText}>
            {asset?.name || strings('collectible.untitled_collection')}
          </Text>
        </View>
      </TouchableOpacity>
      {collectiblesVisible && (
        // `grid` is not part of the stylesheet; the lookup is kept to preserve
        // the rendered output.
        <View style={(styles as { grid?: StyleProp<ViewStyle> }).grid}>
          {collectiblesGrid.map((row, i) => (
            <View key={i} style={styles.collectiblesRowContainer}>
              {row.map((collectible, index) =>
                renderCollectible(
                  { ...collectible, logo: asset.logo } as CollectibleItem,
                  index,
                ),
              )}
            </View>
          ))}
        </View>
      )}
      <ActionSheet
        ref={actionSheetRef}
        title={strings('wallet.collectible_action_title')}
        options={[
          strings('wallet.refresh_metadata'),
          strings('wallet.remove'),
          strings('wallet.cancel'),
        ]}
        cancelButtonIndex={2}
        destructiveButtonIndex={1}
        // eslint-disable-next-line react/jsx-no-bind
        onPress={handleMenuAction}
        theme={themeAppearance}
      />
    </View>
  );
}

const mapStateToProps = (state: RootState): StateProps => ({
  chainId: selectChainId(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  removeFavoriteCollectible: (
    selectedAddress: string | undefined,
    chainId: string,
    collectible: CollectibleItem | null,
  ) =>
    dispatch(
      removeFavoriteCollectibleAction(selectedAddress, chainId, collectible),
    ),
});

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps,
)(CollectibleContractElement);
