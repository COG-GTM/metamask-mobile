import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Nft } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
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
import { BrandColors, Colors } from '../../../util/theme/models';
import { RootState } from '../../../reducers';

interface CollectibleContractAsset {
  address?: string;
  name?: string;
  logo?: string;
  favorites?: boolean;
}

type ContractCollectible = Partial<Nft> & {
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
   * Array of collectibles
   */
  contractCollectibles: ContractCollectible[];
  /**
   * Whether the collectibles are visible or not
   */
  collectiblesVisible?: boolean;
  /**
   * Called when the collectible is pressed
   */
  onPress: (collectible: ContractCollectible) => void;
}

interface StateProps {
  /**
   * Chain id
   */
  chainId: Hex;
  /**
   * Selected address
   */
  selectedAddress?: string;
}

interface DispatchProps {
  /**
   * Dispatch remove collectible from favorites action
   */
  removeFavoriteCollectible: (
    selectedAddress: string | undefined,
    chainId: Hex,
    collectible: ContractCollectible,
  ) => void;
}

type CollectibleContractElementProps = OwnProps & StateProps & DispatchProps;

const DEVICE_WIDTH = Device.getDeviceWidth();
const COLLECTIBLE_WIDTH = (DEVICE_WIDTH - 30 - 16) / 3;

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

const splitIntoSubArrays = <T,>(array: T[], count: number): T[][] => {
  const newArray: T[][] = [];
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
    ContractCollectible[][]
  >([]);
  const [collectiblesVisible, setCollectiblesVisible] = useState(
    propsCollectiblesVisible,
  );
  const actionSheetRef = useRef<typeof ActionSheet>(null);
  const longPressedCollectible = useRef<ContractCollectible | null>(null);
  const { colors, themeAppearance, brandColors } = useTheme();
  const styles = createStyles(colors, brandColors);
  const { trackEvent, createEventBuilder } = useMetrics();

  const toggleCollectibles = useCallback(() => {
    setCollectiblesVisible(!collectiblesVisible);
  }, [collectiblesVisible, setCollectiblesVisible]);

  const onPressCollectible = useCallback(
    (collectible: ContractCollectible) => {
      onPress(collectible);
    },
    [onPress],
  );

  const onLongPressCollectible = useCallback(
    (collectible: ContractCollectible) => {
      actionSheetRef.current?.show();
      longPressedCollectible.current = collectible;
    },
    [],
  );

  const removeNft = () => {
    const collectible = longPressedCollectible.current;
    if (!collectible) return;
    const { NftController } = Engine.context;
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
    const collectible = longPressedCollectible.current;
    if (!collectible) return;
    const { NftController } = Engine.context;

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
    (collectible: ContractCollectible, index: number) => {
      if (!collectible) return null;
      const handleCollectiblePress = () =>
        onPressCollectible({ ...collectible });
      const onLongPress = () =>
        !asset.favorites ? onLongPressCollectible({ ...collectible }) : null;
      return (
        <View
          key={collectible.address + collectible.tokenId}
          // @ts-expect-error `styles` is not a valid View prop; kept as-is to preserve existing render output
          styles={styles.collectibleBox}
          testID={`collectible-${collectible.name}-${collectible.tokenId}`}
        >
          <TouchableOpacity
            onPress={handleCollectiblePress}
            onLongPress={onLongPress}
            testID={`collectible-${collectible.name}-${collectible.tokenId}`}
          >
            <View style={index === 1 ? styles.collectibleInTheMiddle : {}}>
              <CollectibleMedia
                style={styles.collectibleIcon}
                collectible={{ ...collectible } as Nft}
                onPressColectible={handleCollectiblePress}
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
              // @ts-expect-error `iconStyle` is not part of CollectibleMediaProps; kept as-is to preserve existing behavior
              iconStyle={styles.collectibleContractIcon}
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
  chainId: selectChainId(state) as Hex,
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  removeFavoriteCollectible: (
    selectedAddress: string | undefined,
    chainId: Hex,
    collectible: ContractCollectible,
  ) =>
    dispatch(
      removeFavoriteCollectibleAction(selectedAddress, chainId, collectible),
    ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CollectibleContractElement);
