import React, { PureComponent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Nft } from '@metamask/assets-controllers';
import { ThemeColors } from '@metamask/design-tokens';
import { Dispatch } from 'redux';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import CollectibleMedia from '../CollectibleMedia';
import AssetActionButton from '../AssetOverview/AssetActionButton';
import Device from '../../../util/device';
import { toggleCollectibleContractModal } from '../../../actions/modals';
import { connect } from 'react-redux';
import collectiblesTransferInformation from '../../../util/collectibles-transfer.json';
import { newAssetTransaction } from '../../../actions/transaction';
import { toLowerCaseEquals } from '../../../util/general';
import { collectiblesSelector } from '../../../reducers/collectibles';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { TokenOverviewSelectorsIDs } from '../../../../e2e/selectors/wallet/TokenOverview.selectors';
import { WalletViewSelectorsIDs } from '../../../../e2e/selectors/wallet/WalletView.selectors';

import { RootState } from '../../../reducers';
import { Theme } from '../../../util/theme/models';
import { CollectibleMediaProps } from '../CollectibleMedia/CollectibleMedia.types';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      paddingHorizontal: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border.muted,
      alignContent: 'center',
      alignItems: 'center',
      paddingBottom: 30,
    },
    assetLogo: {
      marginTop: 20,
    },
    information: {
      flex: 1,
      flexDirection: 'row',
      marginTop: 10,
      marginBottom: 20,
    },
    name: {
      fontSize: 30,
      textAlign: 'center',
      color: colors.text.default,
      ...fontStyles.normal,
    },
    actions: {
      width: Device.isSmallDevice() ? '65%' : '50%',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      flexDirection: 'row',
    },
  });

interface CollectibleContract {
  name?: string;
  symbol?: string;
  description?: string;
  address: string;
  totalSupply?: number;
  logo?: string;
}

interface CollectibleTransferInformation {
  name: string;
  tradable: boolean;
  method?: string;
}

const transferInformation =
  collectiblesTransferInformation as unknown as Record<
    string,
    CollectibleTransferInformation
  >;

interface OwnProps {
  /**
   * Object that represents the asset to be displayed
   */
  collectibleContract: CollectibleContract;
  /**
   * Navigation object required to push
   * the Asset detail view
   */
  navigation?: {
    navigate: (route: string, params?: object) => void;
    push: (route: string, params?: object) => void;
  };
  /**
   * How many collectibles are owned by the user
   */
  ownerOf?: number;
}

interface StateProps {
  /**
   * Array of ERC721 assets
   */
  collectibles: Nft[];
}

interface DispatchProps {
  /**
   * Action that sets a collectible contract type transaction
   */
  toggleCollectibleContractModal: () => void;
  /**
   * Start transaction with asset
   */
  newAssetTransaction: (selectedAsset?: Nft) => void;
}

type CollectibleContractOverviewProps = OwnProps & StateProps & DispatchProps;

/**
 * `CollectibleMedia` expects a fully populated NFT; only the contract address
 * and logo are available here.
 */
const CollectibleContractMedia = CollectibleMedia as React.FC<
  Omit<CollectibleMediaProps, 'collectible'> & {
    collectible: { address: string; image?: string };
  }
>;

/**
 * View that displays a specific collectible contract
 * including the overview (name, address, symbol, logo, description, total supply)
 */
/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging --
 * Declaration merging types `this.context` as the app theme without emitting a
 * class field, which Babel would turn into an own property that shadows the
 * `context` React assigns from `contextType`.
 */
interface CollectibleContractOverview {
  context: Theme;
}

class CollectibleContractOverview extends PureComponent<CollectibleContractOverviewProps> {
  onAdd = () => {
    const { navigation, collectibleContract } = this.props;
    navigation?.push('AddAsset', {
      assetType: 'collectible',
      collectibleContract,
    });
  };

  onSend = () => {
    const { collectibleContract, collectibles } = this.props;
    const collectible = collectibles.find((item) =>
      toLowerCaseEquals(item.address, collectibleContract.address),
    );
    this.props.newAssetTransaction(collectible);
    this.props.navigation?.navigate('SendFlowView');
  };

  onInfo = () => this.props.toggleCollectibleContractModal();

  renderLogo = () => {
    const {
      collectibleContract: { logo, address },
    } = this.props;
    return (
      <CollectibleContractMedia small collectible={{ address, image: logo }} />
    );
  };

  render() {
    const {
      collectibleContract: { name, address },
      ownerOf,
    } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);
    const lowerAddress = address.toLowerCase();
    const leftActionButtonText =
      lowerAddress in transferInformation
        ? transferInformation[lowerAddress].tradable &&
          strings('asset_overview.send_button')
        : strings('asset_overview.send_button');
    return (
      <View style={styles.wrapper} testID={'collectible-overview-screen'}>
        <View style={styles.assetLogo}>{this.renderLogo()}</View>
        <View style={styles.information}>
          <Text
            style={styles.name}
            testID={WalletViewSelectorsIDs.NFT_CONTAINER}
          >
            {ownerOf} {name}
          </Text>
        </View>

        <View style={styles.actions}>
          <AssetActionButton
            icon="send"
            onPress={this.onSend}
            label={leftActionButtonText || undefined}
            testID={TokenOverviewSelectorsIDs.SEND_BUTTON}
          />
          <AssetActionButton
            icon="add"
            onPress={this.onAdd}
            label={strings('asset_overview.add_collectible_button')}
            testID={TokenOverviewSelectorsIDs.ADD_BUTTON}
          />
          <AssetActionButton
            testID={'collectible-info-button'}
            icon="add"
            onPress={this.onInfo}
            label={strings('asset_overview.info')}
          />
        </View>
      </View>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  collectibles: collectiblesSelector(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  toggleCollectibleContractModal: () =>
    dispatch(toggleCollectibleContractModal()),
  newAssetTransaction: (selectedAsset?: Nft) =>
    dispatch(newAssetTransaction(selectedAsset as Nft)),
});

CollectibleContractOverview.contextType = ThemeContext;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CollectibleContractOverview);
