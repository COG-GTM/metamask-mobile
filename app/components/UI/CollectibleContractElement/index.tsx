import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
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
import { ThemeColors, BrandColor } from '@metamask/design-tokens';

interface CollectibleContractAsset {
  address?: string;
  name?: string;
  logo?: string;
  favorites?: boolean;
}

interface CollectibleItem {
  address: string;
  tokenId: string;
  name?: string;
  logo?: string;
  image?: string;
}

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
      backgroundColor: brandColors.yellow500,
    },
  });

const splitIntoSubArrays = (
  array: CollectibleItem[],
  count: number,
): CollectibleItem[][] => {
  const newArray: CollectibleItem[][] = [];
  while (array.length > 0) {
    newArray.push(array.splice(0, count));
  }
  return newArray;
};

interface CollectibleContractElementProps {
  /**
   * Object being rendered
   */
  asset: CollectibleContractAsset;
  /**
   * Array of collectibles
   */
  contractCollectibles: CollectibleItem[];
  /**
   * Whether the collectibles are visible or not
   */
  collectiblesVisible: boolean;
  /**
   * Called when the collectible is pressed
   */
  onPress?: (collectible: CollectibleItem) => void;
  /**
   * Selected address
   */
  selectedAddress?: string;
  /**
   * Chain id
   */
  chainId: ReturnType<typeof selectChainId>;
  /**
   * Dispatch remove collectible from favorites action
   */
  removeFavoriteCollectible: (
    selectedAddress: string | undefined,
    chainId: ReturnType<typeof selectChainId>,
    collectible: CollectibleItem,
  ) => void;
}

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
  const [collectiblesGrid, setCollectiblesGrid] = useState<CollectibleItem[][]>(
    [],
  );
  const [collectiblesVisible, setCollectiblesVisible] = useState(
    propsCollectiblesVisible,
  );
  const actionSheetRef = useRef<{ show: () => void }>(null);
  const longPressedCollectible = useRef<CollectibleItem | null>(null);
  const { colors, themeAppearance, brandColors } = useTheme();
  const styles = createStyles(colors, brandColors);
  const { trackEvent, createEventBuilder } = useMetrics();

  const toggleCollectibles = useCallback(() => {
    setCollectiblesVisible(!collectiblesVisible);
  }, [collectiblesVisible, setCollectiblesVisible]);

  const onPressCollectible = useCallback(
    (collectible: CollectibleItem) => {
      onPress?.(collectible);
    },
    [onPress],
  );

  const onLongPressCollectible = useCallback((collectible: CollectibleItem) => {
    actionSheetRef.current?.show();
    longPressedCollectible.current = collectible;
  }, []);

  const removeNft = () => {
    const { NftController } = Engine.context;
    const collectible = longPressedCollectible.current as CollectibleItem;
    removeFavoriteCollectible(selectedAddress, chainId, collectible);
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
      const handleItemPress = () => onPressCollectible({ ...collectible });
      const onLongPress = () =>
        !asset.favorites ? onLongPressCollectible({ ...collectible }) : null;
      return (
        <View
          key={collectible.address + collectible.tokenId}
          testID={`collectible-${collectible.name}-${collectible.tokenId}`}
        >
          <TouchableOpacity
            onPress={handleItemPress}
            onLongPress={onLongPress}
            testID={`collectible-${collectible.name}-${collectible.tokenId}`}
          >
            <View style={index === 1 ? styles.collectibleInTheMiddle : {}}>
              <CollectibleMedia
                style={styles.collectibleIcon}
                collectible={
                  { ...collectible } as CollectibleMediaProps['collectible']
                }
                onPressColectible={handleItemPress}
                isTokenImage
              />
            </View>
          </TouchableOpacity>
        </View>
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
            <CollectibleMedia
              {...({
                iconStyle: styles.collectibleContractIcon,
                collectible: {
                  name: strings('collectible.untitled_collection'),
                  ...asset,
                  image: asset.logo,
                },
                tiny: true,
              } as unknown as CollectibleMediaProps)}
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
        <View>
          {collectiblesGrid.map((row, i) => (
            <View key={i} style={styles.collectiblesRowContainer}>
              {row.map((collectible, index) =>
                renderCollectible({ ...collectible, logo: asset.logo }, index),
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

const mapStateToProps = (state: RootState) => ({
  chainId: selectChainId(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  removeFavoriteCollectible: (
    selectedAddress: string | undefined,
    chainId: ReturnType<typeof selectChainId>,
    collectible: CollectibleItem,
  ) =>
    dispatch(
      removeFavoriteCollectibleAction(selectedAddress, chainId, collectible),
    ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CollectibleContractElement);
