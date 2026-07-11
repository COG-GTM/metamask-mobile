import React, { PureComponent } from 'react';
import {
  Alert,
  ScrollView,
  RefreshControl,
  FlatList,
  StyleSheet,
  Text,
  View,
  ListRenderItemInfo,
} from 'react-native';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import ActionSheet from '@metamask/react-native-actionsheet';
import Engine from '../../../core/Engine';
import CollectibleMedia from '../CollectibleMedia';
import type { CollectibleMediaProps } from '../CollectibleMedia/CollectibleMedia.types';
import AssetElement from '../AssetElement';
import type { TokenI } from '../Tokens/types';
import { ThemeContext, mockTheme } from '../../../util/theme';
import type { Theme, Colors } from '../../../util/theme/models';

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

interface Collectible {
  address: string;
  tokenId: string;
  name?: string;
  [key: string]: unknown;
}

interface CollectiblesProps {
  /**
   * Navigation object required to push
   * the Asset detail view
   */
  navigation?: {
    navigate: (routeName: string, params?: Record<string, unknown>) => void;
    push: (routeName: string, params?: Record<string, unknown>) => void;
  };
  /**
   * Array of assets (in this case Collectibles)
   */
  collectibles?: Collectible[];
  /**
   * Collectible contract object
   */
  collectibleContract?: { name?: string };
  /**
   * Callback triggered when collectible pressed from collectibles list
   */
  onPress?: (collectible: Collectible) => void;
}

interface CollectiblesState {
  refreshing: boolean;
}

/**
 * View that renders a list of Collectibles
 * also known as ERC-721 Tokens
 */
export default class Collectibles extends PureComponent<
  CollectiblesProps,
  CollectiblesState
> {
  state = {
    refreshing: false,
  };

  actionSheet: typeof ActionSheet | null = null;

  longPressedCollectible: Collectible | null = null;

  renderEmpty = () => {
    const colors = (this.context as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            colors={[colors.primary.default]}
            tintColor={colors.icon.default}
            refreshing={this.state.refreshing}
          />
        }
      >
        <View style={styles.emptyView}>
          <Text style={styles.text}>{strings('wallet.no_collectibles')}</Text>
        </View>
      </ScrollView>
    );
  };

  onItemPress = (collectible: Collectible) => {
    this.props.navigation?.navigate('CollectibleView', {
      ...collectible,
      contractName: this.props.collectibleContract?.name,
    });
  };

  handleOnPress = (collectible: Collectible) => {
    this.props.onPress?.(collectible);
  };

  goToAddCollectible = () => {
    this.props.navigation?.push('AddAsset', { assetType: 'collectible' });
  };

  showRemoveMenu = (collectible: Collectible) => {
    this.longPressedCollectible = collectible;
    this.actionSheet?.show();
  };

  refreshMetadata = () => {
    const { NftController } = Engine.context;
    const longPressedCollectible = this
      .longPressedCollectible as unknown as {
      current: { address: string; tokenId: string };
    };

    NftController.addNft(
      longPressedCollectible.current.address,
      longPressedCollectible.current.tokenId,
    );
  };

  handleMenuAction = (index: number) => {
    if (index === 1) {
      this.removeNft();
    } else if (index === 0) {
      this.refreshMetadata();
    }
  };

  removeNft = () => {
    const { NftController } = Engine.context;
    const longPressedCollectible = this.longPressedCollectible as Collectible;
    NftController.removeAndIgnoreNft(
      longPressedCollectible.address,
      longPressedCollectible.tokenId,
    );
    Alert.alert(
      strings('wallet.collectible_removed_title'),
      strings('wallet.collectible_removed_desc'),
    );
  };

  createActionSheetRef = (ref: typeof ActionSheet | null) => {
    this.actionSheet = ref;
  };

  keyExtractor = (item: Collectible) => `${item.address}_${item.tokenId}`;

  renderItem = ({ item }: ListRenderItemInfo<Collectible>) => {
    const colors = (this.context as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <AssetElement
        onPress={this.onItemPress as unknown as (asset: TokenI) => void}
        onLongPress={this.showRemoveMenu as unknown as (asset: TokenI) => void}
        asset={item as unknown as TokenI}
      >
        <View style={styles.itemWrapper}>
          <CollectibleMedia
            small
            collectible={
              item as unknown as CollectibleMediaProps['collectible']
            }
          />
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
  };

  renderCollectiblesList() {
    const { collectibles } = this.props;

    return (
      <FlatList
        data={collectibles}
        extraData={this.state}
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
      />
    );
  }

  render() {
    const { collectibles } = this.props;
    const colors = (this.context as Theme).colors || mockTheme.colors;
    const themeAppearance = (this.context as Theme).themeAppearance;
    const styles = createStyles(colors);

    return (
      <View style={styles.wrapper} testID={'collectibles'}>
        {collectibles?.length
          ? this.renderCollectiblesList()
          : this.renderEmpty()}
        <ActionSheet
          ref={this.createActionSheetRef}
          title={strings('wallet.collectible_action_title')}
          options={[
            strings('wallet.refresh_metadata'),
            strings('wallet.remove'),
            strings('wallet.cancel'),
          ]}
          cancelButtonIndex={2}
          destructiveButtonIndex={1}
          // eslint-disable-next-line react/jsx-no-bind
          onPress={this.handleMenuAction}
          theme={themeAppearance}
        />
      </View>
    );
  }
}

Collectibles.contextType = ThemeContext;
