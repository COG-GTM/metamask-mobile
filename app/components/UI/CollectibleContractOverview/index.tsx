import React, { PureComponent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PropTypes from 'prop-types';
import { Dispatch } from 'redux';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import CollectibleMedia from '../CollectibleMedia';
import AssetActionButton from '../AssetOverview/AssetActionButton';
import Device from '../../../util/device';
import { toggleCollectibleContractModal } from '../../../actions/modals';
import { connect } from 'react-redux';
// @ts-expect-error Legacy collectible transfer data is unavailable to the TypeScript module graph.
import collectiblesTransferInformation from '../../../util/collectibles-transfer';
import { newAssetTransaction } from '../../../actions/transaction';
import { toLowerCaseEquals } from '../../../util/general';
import { collectiblesSelector } from '../../../reducers/collectibles';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { TokenOverviewSelectorsIDs } from '../../../../e2e/selectors/wallet/TokenOverview.selectors';
import { WalletViewSelectorsIDs } from '../../../../e2e/selectors/wallet/WalletView.selectors';
import { NftContract } from '@metamask/assets-controllers';
import { Colors, Theme } from '../../../util/theme/models';
import { RootState } from '../../../reducers';

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

/**
 * View that displays a specific collectible contract
 * including the overview (name, address, symbol, logo, description, total supply)
 */
interface Collectible {
  address: string;
  tokenId: string;
  [key: string]: unknown;
}

type CollectibleContract = Omit<NftContract, 'totalSupply'> & {
  totalSupply?: string | number;
};

interface CollectibleContractOverviewProps {
  collectibleContract: CollectibleContract;
  collectibles: Collectible[];
  navigation?: {
    push: (name: string, params?: object) => void;
    navigate: (name: string, params?: object) => void;
  };
  ownerOf?: number;
  toggleCollectibleContractModal: () => void;
  newAssetTransaction: (asset?: Collectible) => unknown;
}

type CollectibleContractOverviewStateProps = Pick<
  CollectibleContractOverviewProps,
  'collectibles'
>;

type CollectibleContractOverviewDispatchProps = Pick<
  CollectibleContractOverviewProps,
  'toggleCollectibleContractModal' | 'newAssetTransaction'
>;

type CollectibleContractOverviewOwnProps = Omit<
  CollectibleContractOverviewProps,
  keyof CollectibleContractOverviewStateProps | keyof CollectibleContractOverviewDispatchProps
>;

class CollectibleContractOverview extends PureComponent<CollectibleContractOverviewProps> {
  static propTypes = {
    /**
     * Object that represents the asset to be displayed
     */
    collectibleContract: PropTypes.object,
    /**
     * Array of ERC721 assets
     */
    collectibles: PropTypes.array,
    /**
     * Navigation object required to push
     * the Asset detail view
     */
    navigation: PropTypes.object,
    /**
     * How many collectibles are owned by the user
     */
    ownerOf: PropTypes.number,
    /**
     * Action that sets a collectible contract type transaction
     */
    toggleCollectibleContractModal: PropTypes.func.isRequired,
    /**
     * Start transaction with asset
     */
    newAssetTransaction: PropTypes.func,
  };

  onAdd = () => {
    const { navigation, collectibleContract } = this.props;
    (navigation as {
      push: (name: string, params?: object) => void;
    }).push('AddAsset', {
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
    (this.props.navigation as {
      navigate: (name: string, params?: object) => void;
    }).navigate('SendFlowView');
  };

  onInfo = () => this.props.toggleCollectibleContractModal();

  renderLogo = () => {
    const {
      collectibleContract: { logo, address },
    } = this.props;
    return (
      // @ts-expect-error Contract metadata is intentionally passed as a minimal collectible.
      <CollectibleMedia small collectible={{ address, image: logo }} />
    );
  };

  render() {
    const {
      collectibleContract: { name, address },
      ownerOf,
    } = this.props;
    const colors = (this.context as Theme)?.colors || mockTheme.colors;
    const styles = createStyles(colors);
    const lowerAddress = address.toLowerCase();
    const leftActionButtonText =
      lowerAddress in collectiblesTransferInformation
        ? collectiblesTransferInformation[lowerAddress].tradable &&
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

const mapStateToProps = (
  state: RootState,
  _ownProps: CollectibleContractOverviewOwnProps,
): CollectibleContractOverviewStateProps => ({
  collectibles: collectiblesSelector(state),
});

const mapDispatchToProps = (
  dispatch: Dispatch,
): CollectibleContractOverviewDispatchProps => ({
  toggleCollectibleContractModal: (): void => {
    dispatch(toggleCollectibleContractModal());
  },
    newAssetTransaction: (selectedAsset: Collectible | undefined) =>
      // @ts-expect-error Preserve the legacy action call with a possibly undefined collectible.
      dispatch(newAssetTransaction(selectedAsset)),
});

CollectibleContractOverview.contextType = ThemeContext;

// @ts-expect-error Legacy propTypes validators do not reflect Redux-injected required props.
const connectedCollectibleContractOverview: React.ComponentType<CollectibleContractOverviewProps> =
  CollectibleContractOverview;

export default connect<
  CollectibleContractOverviewStateProps,
  CollectibleContractOverviewDispatchProps,
  CollectibleContractOverviewOwnProps,
  RootState
>(
  mapStateToProps,
  mapDispatchToProps,
)(connectedCollectibleContractOverview);
