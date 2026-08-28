import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { type Dispatch } from 'redux';
import { Nft } from '@metamask/assets-controllers';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import CollectibleMedia from '../CollectibleMedia';
import AssetActionButton from '../AssetOverview/AssetActionButton';
import Device from '../../../util/device';
import { toggleCollectibleContractModal } from '../../../actions/modals';
import collectiblesTransferInformationJson from '../../../util/collectibles-transfer.json';
import { newAssetTransaction } from '../../../actions/transaction';
import { toLowerCaseEquals } from '../../../util/general';
import { collectiblesSelector } from '../../../reducers/collectibles';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import { RootState } from '../../../reducers';
import { TokenOverviewSelectorsIDs } from '../../../../e2e/selectors/wallet/TokenOverview.selectors';
import { WalletViewSelectorsIDs } from '../../../../e2e/selectors/wallet/WalletView.selectors';

interface CollectibleTransferInformation {
  name: string;
  tradable: boolean;
  method?: string;
}

const collectiblesTransferInformation: Record<
  string,
  CollectibleTransferInformation
> = collectiblesTransferInformationJson;

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
  address: string;
  name?: string;
  logo?: string;
  symbol?: string;
  description?: string;
  totalSupply?: number;
}

interface Navigation {
  navigate: (screen: string) => void;
  push: (screen: string, params: object) => void;
}

interface OwnProps {
  /**
   * Object that represents the asset to be displayed
   */
  collectibleContract: CollectibleContract;
  /**
   * Navigation object required to push
   * the Asset detail view
   */
  navigation?: Navigation;
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

type Props = OwnProps & StateProps & DispatchProps;

/**
 * View that displays a specific collectible contract
 * including the overview (name, address, symbol, logo, description, total supply)
 */
const CollectibleContractOverview = ({
  collectibleContract,
  collectibles,
  navigation,
  ownerOf,
  toggleCollectibleContractModal: toggleModal,
  newAssetTransaction: startAssetTransaction,
}: Props) => {
  const { colors } = useTheme();
  const { name, address, logo } = collectibleContract;

  const onAdd = () => {
    navigation?.push('AddAsset', {
      assetType: 'collectible',
      collectibleContract,
    });
  };

  const onSend = () => {
    const collectible = collectibles.find((item) =>
      toLowerCaseEquals(item.address, address),
    );
    startAssetTransaction(collectible);
    navigation?.navigate('SendFlowView');
  };

  const onInfo = () => toggleModal();

  const renderLogo = () => (
    <CollectibleMedia small collectible={{ address, image: logo } as Nft} />
  );

  const styles = createStyles(colors);
  const lowerAddress = address.toLowerCase();
  const leftActionButtonText =
    lowerAddress in collectiblesTransferInformation
      ? collectiblesTransferInformation[lowerAddress].tradable &&
        strings('asset_overview.send_button')
      : strings('asset_overview.send_button');
  return (
    <View style={styles.wrapper} testID={'collectible-overview-screen'}>
      <View style={styles.assetLogo}>{renderLogo()}</View>
      <View style={styles.information}>
        <Text style={styles.name} testID={WalletViewSelectorsIDs.NFT_CONTAINER}>
          {ownerOf} {name}
        </Text>
      </View>

      <View style={styles.actions}>
        <AssetActionButton
          icon="send"
          onPress={onSend}
          label={leftActionButtonText}
          testID={TokenOverviewSelectorsIDs.SEND_BUTTON}
        />
        <AssetActionButton
          icon="add"
          onPress={onAdd}
          label={strings('asset_overview.add_collectible_button')}
          testID={TokenOverviewSelectorsIDs.ADD_BUTTON}
        />
        <AssetActionButton
          testID={'collectible-info-button'}
          icon="add"
          onPress={onInfo}
          label={strings('asset_overview.info')}
        />
      </View>
    </View>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  collectibles: collectiblesSelector(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  toggleCollectibleContractModal: () =>
    dispatch(toggleCollectibleContractModal()),
  newAssetTransaction: (selectedAsset?: Nft) =>
    dispatch(newAssetTransaction(selectedAsset as object)),
});

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps,
)(CollectibleContractOverview);
