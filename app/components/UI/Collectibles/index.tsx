import React, { LegacyRef, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  RefreshControl,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ActionSheet from '@metamask/react-native-actionsheet';
import { Nft } from '@metamask/assets-controllers';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import Engine from '../../../core/Engine';
import CollectibleMedia from '../CollectibleMedia';
import AssetElement from '../AssetElement';
import { TokenI } from '../Tokens/types';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';

interface Props {
  /**
   * Navigation object required to push
   * the Asset detail view
   */
  navigation?: StackNavigationProp<ParamListBase>;
  /**
   * Array of assets (in this case Collectibles)
   */
  collectibles?: Nft[];
  /**
   * Collectible contract object
   */
  collectibleContract?: { name?: string };
  /**
   * Callback triggered when collectible pressed from collectibles list
   */
  onPress?: (collectible: Nft) => void;
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    emptyView: {
      backgroundColor: colors.background.default,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
    },
    text: {
      fontSize: 20,
      color: colors.text.muted,
      ...fontStyles.normal,
    },
    itemWrapper: {
      flex: 1,
      flexDirection: 'row',
    },
    rows: {
      flex: 1,
      marginLeft: 20,
      marginTop: 6,
    },
    name: {
      fontSize: 16,
      color: colors.text.default,
      ...fontStyles.normal,
    },
    tokenId: {
      fontSize: 12,
      marginTop: 4,
      marginRight: 8,
      color: colors.text.alternative,
      ...fontStyles.normal,
    },
  });

/**
 * View that renders a list of Collectibles
 * also known as ERC-721 Tokens
 */
const Collectibles = ({
  navigation,
  collectibles,
  collectibleContract,
}: Props) => {
  const { colors, themeAppearance } = useTheme();
  const styles = createStyles(colors);
  const [refreshing] = useState(false);
  const actionSheet = useRef<typeof ActionSheet>();
  const longPressedCollectible = useRef<Nft | null>(null);

  const renderEmpty = () => (
    <ScrollView
      refreshControl={
        <RefreshControl
          colors={[colors.primary.default]}
          tintColor={colors.icon.default}
          refreshing={refreshing}
        />
      }
    >
      <View style={styles.emptyView}>
        <Text style={styles.text}>{strings('wallet.no_collectibles')}</Text>
      </View>
    </ScrollView>
  );

  const onItemPress = (collectible: Nft) => {
    navigation?.navigate('CollectibleView', {
      ...collectible,
      contractName: collectibleContract?.name,
    });
  };

  const showRemoveMenu = (collectible: Nft) => {
    longPressedCollectible.current = collectible;
    actionSheet.current?.show();
  };

  const refreshMetadata = () => {
    const { NftController } = Engine.context;

    NftController.addNft(
      longPressedCollectible.current?.address as string,
      longPressedCollectible.current?.tokenId as string,
    );
  };

  const removeNft = () => {
    const { NftController } = Engine.context;
    NftController.removeAndIgnoreNft(
      longPressedCollectible.current?.address as string,
      longPressedCollectible.current?.tokenId as string,
    );
    Alert.alert(
      strings('wallet.collectible_removed_title'),
      strings('wallet.collectible_removed_desc'),
    );
  };

  const handleMenuAction = (index: number) => {
    if (index === 1) {
      removeNft();
    } else if (index === 0) {
      refreshMetadata();
    }
  };

  const keyExtractor = (item: Nft) => `${item.address}_${item.tokenId}`;

  const renderItem: ListRenderItem<Nft> = ({ item }) => (
    <AssetElement
      onPress={onItemPress as unknown as (asset: TokenI) => void}
      onLongPress={showRemoveMenu as unknown as (asset: TokenI) => void}
      asset={item as unknown as TokenI}
    >
      <View style={styles.itemWrapper}>
        <CollectibleMedia small collectible={item} />
        <View style={styles.rows}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.tokenId} numberOfLines={1}>
            {strings('unit.token_id')}
            {item.tokenId}
          </Text>
        </View>
      </View>
    </AssetElement>
  );

  const renderCollectiblesList = () => (
    <FlatList
      data={collectibles}
      extraData={refreshing}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    />
  );

  return (
    <View style={styles.wrapper} testID={'collectibles'}>
      {collectibles?.length
        ? renderCollectiblesList()
        : renderEmpty()}
      <ActionSheet
        ref={actionSheet as LegacyRef<typeof ActionSheet>}
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

export default Collectibles;
