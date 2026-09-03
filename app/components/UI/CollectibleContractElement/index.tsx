import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';
import type { Nft } from '@metamask/assets-controllers';
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
import type { RootState } from '../../../reducers';
import type { BrandColors, Colors } from '../../../util/theme/models';

const DEVICE_WIDTH = Device.getDeviceWidth();
const COLLECTIBLE_WIDTH = (DEVICE_WIDTH - 30 - 16) / 3;

interface CollectibleAsset {
  address: string;
  name?: string | null;
  tokenId: string | number;
  [key: string]: unknown;
}

const toFavoriteCollectible = ({ address, tokenId }: CollectibleAsset) => ({
  address,
  tokenId: String(tokenId),
});

interface ActionSheetRef {
  show: () => void;
}

interface CollectibleContractAsset {
  address?: string;
  favorites?: boolean;
  logo?: string;
  name?: string;
}

interface OwnProps {
  /**
   * Object being rendered
   */
  asset: CollectibleContractAsset;
  /**
   * Array of collectibles
   */
  contractCollectibles: CollectibleAsset[];
  /**
   * Whether the collectibles are visible or not
   */
  collectiblesVisible: boolean;
  /**
   * Called when the collectible is pressed
   */
  onPress: (collectible: CollectibleAsset) => void;
}

interface StateProps {
  /**
   * Selected address
   */
  selectedAddress: string;
  /**
   * Chain id
   */
  chainId: string;
}

interface DispatchProps {
  /**
   * Dispatch remove collectible from favorites action
   */
  removeFavoriteCollectible: (
    selectedAddress: string,
    chainId: string,
    collectible: CollectibleAsset,
  ) => void;
}

type Props = OwnProps & StateProps & DispatchProps;

const createStyles = (colors: Colors, brandColors: BrandColors) =>
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
  array: CollectibleAsset[],
  count: number,
): CollectibleAsset[][] => {
  const newArray: CollectibleAsset[][] = [];
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
}: Props) {
  const [collectiblesGrid, setCollectiblesGrid] = useState<
    CollectibleAsset[][]
  >([]);
  const [collectiblesVisible, setCollectiblesVisible] = useState(
    propsCollectiblesVisible,
  );
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const longPressedCollectible = useRef<CollectibleAsset | null>(null);
  const { colors, themeAppearance, brandColors } = useTheme();
  const styles = createStyles(colors, brandColors);
  const { trackEvent, createEventBuilder } = useMetrics();

  const toggleCollectibles = useCallback(() => {
    setCollectiblesVisible(!collectiblesVisible);
  }, [collectiblesVisible, setCollectiblesVisible]);

  const onPressCollectible = useCallback(
    (collectible: CollectibleAsset) => {
      onPress(collectible);
    },
    [onPress],
  );

  const onLongPressCollectible = useCallback(
    (collectible: CollectibleAsset) => {
      actionSheetRef.current?.show();
      longPressedCollectible.current = collectible;
    },
    [],
  );

  const removeNft = () => {
    if (!longPressedCollectible.current) return;
    const { NftController } = Engine.context;
    removeFavoriteCollectible(
      selectedAddress,
      chainId,
      toFavoriteCollectible(longPressedCollectible.current),
    );
    NftController.removeAndIgnoreNft(
      longPressedCollectible.current.address,
      String(longPressedCollectible.current.tokenId),
    );
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
    if (!longPressedCollectible.current) return;
    const { NftController } = Engine.context;

    NftController.addNft(
      longPressedCollectible.current.address,
      String(longPressedCollectible.current.tokenId),
    );
  };

  const handleMenuAction = (index: number) => {
    if (index === 1) {
      removeNft();
    } else if (index === 0) {
      refreshMetadata();
    }
  };

  const renderCollectible = useCallback(
    (collectible: CollectibleAsset, index: number) => {
      if (!collectible) return null;
      const handlePress = () => onPressCollectible({ ...collectible });
      const handleLongPress = () =>
        !asset.favorites ? onLongPressCollectible({ ...collectible }) : null;
      return (
        <View
          key={collectible.address + collectible.tokenId}
          {...({ styles: styles.collectibleBox } as Record<string, unknown>)}
          testID={`collectible-${collectible.name}-${collectible.tokenId}`}
        >
          <TouchableOpacity
            onPress={handlePress}
            onLongPress={handleLongPress}
            testID={`collectible-${collectible.name}-${collectible.tokenId}`}
          >
            <View style={index === 1 ? styles.collectibleInTheMiddle : {}}>
              <CollectibleMedia
                style={styles.collectibleIcon}
                collectible={{ ...collectible } as unknown as Nft}
                onPressColectible={handlePress}
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
              } as Record<string, unknown>)}
              collectible={
                {
                  name: strings('collectible.untitled_collection'),
                  ...asset,
                  image: asset.logo,
                } as unknown as Nft
              }
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

const mapStateToProps = (state: RootState): StateProps => ({
  chainId: selectChainId(state) ?? '',
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state) ?? '',
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  removeFavoriteCollectible: (selectedAddress, chainId, collectible) =>
    dispatch(
      removeFavoriteCollectibleAction(
        selectedAddress,
        chainId,
        toFavoriteCollectible(collectible),
      ),
    ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CollectibleContractElement);
