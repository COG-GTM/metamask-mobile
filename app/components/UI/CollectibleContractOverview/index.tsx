import React, { PureComponent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import CollectibleMedia from '../CollectibleMedia';
import { CollectibleMediaProps } from '../CollectibleMedia/CollectibleMedia.types';
import AssetActionButton from '../AssetOverview/AssetActionButton';
import Device from '../../../util/device';
import { toggleCollectibleContractModal } from '../../../actions/modals';
import { connect, ConnectedProps } from 'react-redux';
import { Dispatch } from 'redux';
import { Nft, NftContract } from '@metamask/assets-controllers';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import collectiblesTransferInformation from '../../../util/collectibles-transfer.json';
import { newAssetTransaction } from '../../../actions/transaction';
import { toLowerCaseEquals } from '../../../util/general';
import { collectiblesSelector } from '../../../reducers/collectibles';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Colors, Theme } from '../../../util/theme/models';
import { RootState } from '../../../reducers';
import { TokenOverviewSelectorsIDs } from '../../../../e2e/selectors/wallet/TokenOverview.selectors';
import { WalletViewSelectorsIDs } from '../../../../e2e/selectors/wallet/WalletView.selectors';

const createStyles = (colors: Colors) =>
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

interface CollectibleTransferInformation {
  name: string;
  tradable: boolean;
  method?: string;
}

const transferInformation: Record<string, CollectibleTransferInformation> =
  collectiblesTransferInformation;

const mapStateToProps = (state: RootState) => ({
  collectibles: collectiblesSelector(state) as Nft[],
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  toggleCollectibleContractModal: () =>
    dispatch(toggleCollectibleContractModal()),
  newAssetTransaction: (selectedAsset: Nft) =>
    dispatch(newAssetTransaction(selectedAsset)),
});

const connector = connect(mapStateToProps, mapDispatchToProps);

export interface CollectibleContractOverviewOwnProps {
  /**
   * Object that represents the asset to be displayed
   */
  collectibleContract: Omit<NftContract, 'totalSupply'> & {
    totalSupply?: string | number;
  };
  /**
   * Navigation object required to push new views
   */
  navigation?: Pick<StackNavigationProp<ParamListBase>, 'push' | 'navigate'>;
  /**
   * How many collectibles are owned by the user
   */
  ownerOf?: number;
}

type CollectibleContractOverviewProps = CollectibleContractOverviewOwnProps &
  ConnectedProps<typeof connector>;

/**
 * View that displays a specific collectible contract
 * including the overview (name, address, symbol, logo, description, total supply)
 */
class CollectibleContractOverview extends PureComponent<CollectibleContractOverviewProps> {
  static contextType = ThemeContext;

  onAdd = () => {
    const { navigation, collectibleContract } = this.props;
    navigation?.push('AddAsset', {
      assetType: 'collectible',
      collectibleContract,
    });
  };

  onSend = () => {
    const { collectibleContract, collectibles } = this.props;
    const collectible = collectibles.find((collectible) =>
      toLowerCaseEquals(collectible.address, collectibleContract.address),
    );
    if (!collectible) return;
    this.props.newAssetTransaction(collectible);
    this.props.navigation?.navigate('SendFlowView');
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
          { address, image: logo } as CollectibleMediaProps['collectible']
        }
      />
    );
  };

  render() {
    const {
      collectibleContract: { name, address },
      ownerOf,
    } = this.props;
    const colors = (this.context as Theme).colors || mockTheme.colors;
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

export default connector(CollectibleContractOverview);
