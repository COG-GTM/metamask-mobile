import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { connect } from 'react-redux';
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

interface Styles {
  itemWrapper: ViewStyle;
  collectibleContractIcon: ImageStyle;
  collectibleContractIconContainer: ViewStyle;
  titleContainer: ViewStyle;
  verticalAlignedContainer: ViewStyle;
  titleText: TextStyle;
  collectibleIcon: ImageStyle;
  collectibleInTheMiddle: ViewStyle;
  collectiblesRowContainer: ViewStyle;
  collectibleBox: ViewStyle;
  favoritesLogoWrapper: ViewStyle;
  grid?: ViewStyle;
}

const createStyles = (colors: Theme['colors'], brandColors: Theme['brandColors']): Styles =>
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

const splitIntoSubArrays = <T,>(array: T[], count: number): T[][] => {
  const newArray: T[][] = [];
  const arrayCopy = [...array];
  while (arrayCopy.length > 0) {
    newArray.push(arrayCopy.splice(0, count));
  }
  return newArray;
};

interface Collectible {
  address: string;
  tokenId: string;
  name?: string;
  logo?: string;
  image?: string;
  symbol?: string;
}

interface Asset {
  address: string;
  name?: string;
  logo?: string;
  favorites?: boolean;
}

interface CollectibleContractElementProps {
  asset: Asset;
  contractCollectibles: Collectible[];
  collectiblesVisible?: boolean;
  onPress: (collectible: Collectible) => void;
  chainId: string;
  selectedAddress: string;
  removeFavoriteCollectible: (selectedAddress: string, chainId: string, collectible: Collectible) => void;
}

function CollectibleContractElement({
  asset,
  contractCollectibles,
  collectiblesVisible: propsCollectiblesVisible,
  onPress,
  chainId,
  selectedAddress,
  removeFavoriteCollectible,
}: CollectibleContractElementProps) {
  const [collectiblesGrid, setCollectiblesGrid] = useState<Collectible[][]>([]);
  const [collectiblesVisible, setCollectiblesVisible] = useState(
    propsCollectiblesVisible,
  );
  const actionSheetRef = useRef<ActionSheet>(null);
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
    const { NftController } = Engine.context as { NftController: { removeAndIgnoreNft: (address: string, tokenId: string) => void } };
    if (longPressedCollectible.current) {
      removeFavoriteCollectible(
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
    }
  };

  const refreshMetadata = () => {
    const { NftController } = Engine.context as { NftController: { addNft: (address: string, tokenId: string) => void } };

    if (longPressedCollectible.current) {
      NftController.addNft(
        longPressedCollectible.current.address,
        longPressedCollectible.current.tokenId,
      );
    }
  };

  const handleMenuAction = (index: number) => {
    if (index === 1) {
      removeNft();
    } else if (index === 0) {
      refreshMetadata();
    }
  };

  const renderCollectible = useCallback(
    (collectible: Collectible | null, index: number) => {
      if (!collectible) return null;
      const onPressHandler = () => onPressCollectible({ ...collectible });
      const onLongPress = () =>
        !asset.favorites ? onLongPressCollectible({ ...collectible }) : null;
      return (
        <View
          key={collectible.address + collectible.tokenId}
          style={styles.collectibleBox}
          testID={`collectible-${collectible.name}-${collectible.tokenId}`}
        >
          <TouchableOpacity
            onPress={onPressHandler}
            onLongPress={onLongPress}
            testID={`collectible-${collectible.name}-${collectible.tokenId}`}
          >
            <View style={index === 1 ? styles.collectibleInTheMiddle : {}}>
              <CollectibleMedia
                style={styles.collectibleIcon}
                collectible={{ ...collectible }}
                onPressColectible={onPressHandler}
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
}

const mapStateToProps = (state: RootState) => ({
  chainId: selectChainId(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
});

const mapDispatchToProps = (dispatch: (action: unknown) => void) => ({
  removeFavoriteCollectible: (selectedAddress: string, chainId: string, collectible: Collectible) =>
    dispatch(removeFavoriteCollectible(selectedAddress, chainId, collectible)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CollectibleContractElement);
