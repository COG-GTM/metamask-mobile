import React, { PureComponent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dispatch } from 'redux';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import CollectibleMedia from '../CollectibleMedia';
import type { CollectibleMediaProps } from '../CollectibleMedia/CollectibleMedia.types';
import AssetActionButton from '../AssetOverview/AssetActionButton';
import Device from '../../../util/device';
import { toggleCollectibleContractModal } from '../../../actions/modals';
import { connect } from 'react-redux';
import collectiblesTransferInformation from '../../../util/collectibles-transfer.json';
import { newAssetTransaction } from '../../../actions/transaction';
import { toLowerCaseEquals } from '../../../util/general';
import { collectiblesSelector } from '../../../reducers/collectibles';
import { ThemeContext, mockTheme } from '../../../util/theme';
import type { Theme, Colors } from '../../../util/theme/models';
import type { RootState } from '../../../reducers';
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

interface CollectibleContract {
  name?: string;
  symbol?: string;
  description?: string;
  totalSupply?: string | number;
  address: string;
  logo?: string;
}

interface Collectible {
  address: string;
  [key: string]: unknown;
}

type NewAssetTransactionParam = Parameters<typeof newAssetTransaction>[0];

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
    push: (routeName: string, params?: Record<string, unknown>) => void;
    navigate: (routeName: string) => void;
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
  collectibles: Collectible[];
}

interface DispatchProps {
  /**
   * Action that sets a collectible contract type transaction
   */
  toggleCollectibleContractModal: () => void;
  /**
   * Start transaction with asset
   */
  newAssetTransaction: (selectedAsset: NewAssetTransactionParam) => void;
}

type Props = OwnProps & StateProps & DispatchProps;

/**
 * View that displays a specific collectible contract
 * including the overview (name, address, symbol, logo, description, total supply)
 */
class CollectibleContractOverview extends PureComponent<Props> {
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
    this.props.newAssetTransaction(
      collectible as unknown as NewAssetTransactionParam,
    );
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
          {
            address,
            image: logo as string,
          } as CollectibleMediaProps['collectible']
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
    const transferInformation =
      collectiblesTransferInformation as unknown as Record<
        string,
        { name: string; tradable: boolean; method: string }
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

const mapStateToProps = (state: RootState): StateProps => ({
  collectibles: collectiblesSelector(state) as Collectible[],
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  toggleCollectibleContractModal: () =>
    dispatch(toggleCollectibleContractModal()),
  newAssetTransaction: (selectedAsset: NewAssetTransactionParam) =>
    dispatch(newAssetTransaction(selectedAsset)),
});

CollectibleContractOverview.contextType = ThemeContext;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CollectibleContractOverview);
