import React, { PureComponent } from 'react';
import {
  Alert,
  ScrollView,
  RefreshControl,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import ActionSheet from '@metamask/react-native-actionsheet';
import Engine from '../../../core/Engine';
import CollectibleMedia from '../CollectibleMedia';
import AssetElement from '../AssetElement';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Nft } from '@metamask/assets-controllers';
import { TokenI } from '../Tokens/types';
import { Theme } from '../../../util/theme/models';

const createStyles = (colors: Theme['colors']) =>
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

interface CollectiblesProps {
  /**
   * Navigation object required to push
   * the Asset detail view
   */
  navigation?: {
    navigate: (route: string, params: Record<string, unknown>) => void;
    push: (route: string, params: Record<string, unknown>) => void;
  };
  /**
   * Array of assets (in this case Collectibles)
   */
  collectibles?: Nft[];
  /**
   * Collectible contract object
   */
  collectibleContract?: {
    name?: string;
  };
  /**
   * Callback triggered when collectible pressed from collectibles list
   */
  onPress?: (collectible: Nft) => void;
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

  actionSheet: { show: () => void } | null = null;

  longPressedCollectible: Nft | null = null;

  renderEmpty = () => {
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
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

  onItemPress = (collectible: Nft) => {
    this.props.navigation?.navigate('CollectibleView', {
      ...collectible,
      contractName: this.props.collectibleContract?.name,
    });
  };

  handleOnPress = (collectible: Nft) => {
    this.props.onPress?.(collectible);
  };

  goToAddCollectible = () => {
    this.props.navigation?.push('AddAsset', { assetType: 'collectible' });
  };

  showRemoveMenu = (collectible: Nft) => {
    this.longPressedCollectible = collectible;
    this.actionSheet?.show();
  };

  refreshMetadata = () => {
    const { NftController } = Engine.context;
    // `showRemoveMenu` stores the collectible itself, so this reads through a
    // `current` wrapper the field never has; asserted to keep behaviour as-is.
    const longPressedCollectible = this.longPressedCollectible as unknown as {
      current: Nft;
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
    const longPressedCollectible = this.longPressedCollectible as Nft;
    NftController.removeAndIgnoreNft(
      longPressedCollectible.address,
      longPressedCollectible.tokenId,
    );
    Alert.alert(
      strings('wallet.collectible_removed_title'),
      strings('wallet.collectible_removed_desc'),
    );
  };

  createActionSheetRef = (ref: { show: () => void } | null) => {
    this.actionSheet = ref;
  };

  keyExtractor = (item: Nft) => `${item.address}_${item.tokenId}`;

  renderItem = ({ item }: ListRenderItemInfo<Nft>) => {
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <AssetElement
        onPress={this.onItemPress as unknown as (asset: TokenI) => void}
        onLongPress={this.showRemoveMenu as unknown as (asset: TokenI) => void}
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
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const themeAppearance = (this.context as unknown as Theme).themeAppearance;
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
