import React, { ComponentType, PureComponent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { Theme } from '../../../util/theme/models';
import { RootState } from '../../../reducers';

const createStyles = (colors: Theme['colors']) =>
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

interface Collectible {
  address: string;
  tokenId?: string;
  name?: string;
  symbol?: string;
  description?: string;
  totalSupply?: string | number;
  logo?: string;
  image?: string;
}

interface CollectibleContractOverviewOwnProps {
  /**
   * Object that represents the asset to be displayed
   */
  collectibleContract: Collectible;
  /**
   * Navigation object required to push
   * the Asset detail view
   */
  navigation?: {
    push?(...args: unknown[]): void;
    navigate?(...args: unknown[]): void;
  };
  /**
   * How many collectibles are owned by the user
   */
  ownerOf?: number;
}

interface CollectibleContractOverviewProps
  extends CollectibleContractOverviewOwnProps {
  /**
   * Array of ERC721 assets
   */
  collectibles: Collectible[];
  /**
   * Action that sets a collectible contract type transaction
   */
  toggleCollectibleContractModal: () => void;
  /**
   * Start transaction with asset
   */
  newAssetTransaction: (selectedAsset: Collectible) => void;
}

/**
 * View that displays a specific collectible contract
 * including the overview (name, address, symbol, logo, description, total supply)
 */
class CollectibleContractOverview extends PureComponent<CollectibleContractOverviewProps> {
  static contextType = ThemeContext;

  onAdd = () => {
    const { navigation, collectibleContract } = this.props;
    navigation?.push?.('AddAsset', {
      assetType: 'collectible',
      collectibleContract,
    });
  };

  onSend = () => {
    const { collectibleContract, collectibles } = this.props;
    const collectible = collectibles.find((item: Collectible) =>
      toLowerCaseEquals(item.address, collectibleContract.address),
    );
    this.props.newAssetTransaction(collectible as Collectible);
    this.props.navigation?.navigate?.('SendFlowView');
  };

  onInfo = () => this.props.toggleCollectibleContractModal();

  renderLogo = () => {
    const {
      collectibleContract: { logo, address },
    } = this.props;
    return (
      <CollectibleMedia
        small
        collectible={
          { address, image: logo } as React.ComponentProps<
            typeof CollectibleMedia
          >['collectible']
        }
      />
    );
  };

  render() {
    const {
      collectibleContract: { name, address },
      ownerOf,
    } = this.props;
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);
    const lowerAddress = address.toLowerCase();
    const transferInformation = collectiblesTransferInformation as Record<
      string,
      { tradable: boolean }
    >;
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
            label={leftActionButtonText}
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
  newAssetTransaction: (selectedAsset: Collectible) =>
    dispatch(newAssetTransaction(selectedAsset)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  CollectibleContractOverview,
) as unknown as ComponentType<CollectibleContractOverviewOwnProps>;
