import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { connect, ConnectedProps } from 'react-redux';
import { fontStyles } from '../../../styles/common';
import CollectibleMedia from '../CollectibleMedia';
import Device from '../../../util/device';
import Text from '../../Base/Text';
import ActionSheet from '@metamask/react-native-actionsheet';
import { strings } from '../../../../locales/i18n';
import Engine from '../../../core/Engine';
import { removeFavoriteCollectible } from '../../../actions/collectibles';
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
import { Theme } from '../../../util/theme/models';

const DEVICE_WIDTH = Device.getDeviceWidth();
const COLLECTIBLE_WIDTH = (DEVICE_WIDTH - 30 - 16) / 3;

interface CollectibleAsset {
  address: string;
  name?: string;
  logo?: string;
  favorites?: boolean;
}

interface Collectible {
  address: string;
  tokenId: string;
  name?: string;
  logo?: string;
}

const createStyles = (colors: Theme['colors'], brandColors: Theme['brandColors']) =>
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
    grid: {},
  });

const splitIntoSubArrays = <T,>(array: T[], count: number): T[][] => {
  const newArray: T[][] = [];
  const arrayCopy = [...array];
  while (arrayCopy.length > 0) {
    newArray.push(arrayCopy.splice(0, count));
  }
  return newArray;
};

interface CollectibleContractElementProps extends PropsFromRedux {
  asset: CollectibleAsset;
  contractCollectibles: Collectible[];
  collectiblesVisible?: boolean;
  onPress: (collectible: Collectible) => void;
}

const CollectibleContractElement: React.FC<CollectibleContractElementProps> = ({
  asset,
  contractCollectibles,
  collectiblesVisible: propsCollectiblesVisible,
  onPress,
  chainId,
  selectedAddress,
  removeFavoriteCollectible: dispatchRemoveFavoriteCollectible,
}) => {
  const [collectiblesGrid, setCollectiblesGrid] = useState<Collectible[][]>([]);
  const [collectiblesVisible, setCollectiblesVisible] = useState(
    propsCollectiblesVisible,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actionSheetRef = useRef<any>(null);
  const longPressedCollectible = useRef<Collectible | null>(null);
  const { colors, themeAppearance, brandColors } = useTheme();
  const styles = createStyles(colors, brandColors);
  const { trackEvent, createEventBuilder } = useMetrics();

  const toggleCollectibles = useCallback(() => {
    setCollectiblesVisible(!collectiblesVisible);
  }, [collectiblesVisible, setCollectiblesVisible]);

  const onPressCollectible = useCallback(
    (collectible: Collectible) => {
      onPress(collectible);
    },
    [onPress],
  );

  const onLongPressCollectible = useCallback((collectible: Collectible) => {
    actionSheetRef.current?.show();
    longPressedCollectible.current = collectible;
  }, []);

  const removeNft = () => {
    const { NftController } = Engine.context;
    if (!longPressedCollectible.current) return;

    dispatchRemoveFavoriteCollectible(
      selectedAddress,
      chainId,
      longPressedCollectible.current,
    );
    NftController.removeAndIgnoreNft(
      longPressedCollectible.current.address,
      longPressedCollectible.current.tokenId,
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
    const { NftController } = Engine.context;
    if (!longPressedCollectible.current) return;

    NftController.addNft(
      longPressedCollectible.current.address,
      longPressedCollectible.current.tokenId,
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
    (collectible: Collectible, index: number) => {
      if (!collectible) return null;
      const handlePress = () => onPressCollectible({ ...collectible });
      const handleLongPress = () =>
        !asset.favorites ? onLongPressCollectible({ ...collectible }) : null;
      return (
        <View
          key={collectible.address + collectible.tokenId}
          style={styles.collectibleBox}
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
                // @ts-expect-error - CollectibleMedia accepts partial collectible data
                collectible={{ ...collectible }}
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
    const temp = splitIntoSubArrays([...contractCollectibles], 3);
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
              iconStyle={styles.collectibleContractIcon}
              // @ts-expect-error - CollectibleMedia accepts partial collectible data
              collectible={{
                name: strings('collectible.untitled_collection'),
                ...asset,
                image: asset.logo || null,
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
        <View style={styles.grid}>
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
        onPress={handleMenuAction}
        theme={themeAppearance}
      />
    </View>
  );
};

const mapStateToProps = (state: RootState) => ({
  chainId: selectChainId(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
});

const mapDispatchToProps = {
  removeFavoriteCollectible,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CollectibleContractElement);
