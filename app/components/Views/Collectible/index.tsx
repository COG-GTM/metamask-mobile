import React, { PureComponent } from 'react';
import { RefreshControl, ScrollView, View, StyleSheet } from 'react-native';
import type { Nft } from '@metamask/assets-controllers';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { getNetworkNavbarOptions } from '../../UI/Navbar';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';
import Collectibles from '../../UI/Collectibles';
import CollectibleContractOverview from '../../UI/CollectibleContractOverview';
import Engine from '../../../core/Engine';
import Modal from 'react-native-modal';
import CollectibleContractInformation from '../../UI/CollectibleContractInformation';
import { toggleCollectibleContractModal } from '../../../actions/modals';
import { toLowerCaseEquals } from '../../../util/general';
import { collectiblesSelector } from '../../../reducers/collectibles';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { useNftDetectionChainIds } from '../../hooks/useNftDetectionChainIds';
import type { RootState } from '../../../reducers';
import type { Theme } from '@metamask/design-tokens';

interface CollectibleContractParams {
  address: string;
  name?: string;
  logo?: string;
  [key: string]: unknown;
}

interface OwnProps {
  navigation: NavigationProp<ParamListBase>;
  route: { params: CollectibleContractParams };
}

interface StateProps {
  collectibles: Nft[];
  collectibleContractModalVisible: boolean;
}

interface DispatchProps {
  toggleCollectibleContractModal: () => void;
}

interface State {
  refreshing: boolean;
  collectibles: Nft[];
}

type Props = OwnProps & StateProps & DispatchProps;

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
  });

/**
 * View that displays a specific collectible
 * including the overview (name, address, symbol, logo, description, total supply)
 * and also individual collectibles list
 */
class Collectible extends PureComponent<Props, State> {
  static contextType = ThemeContext;

  state: State = {
    refreshing: false,
    collectibles: [],
  };

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors = (this.context as unknown as Theme).colors || mockTheme.colors;
    getNetworkNavbarOptions(
      route.params?.name ?? '',
      false,
      navigation,
      colors,
    );
  };

  componentDidMount = () => {
    this.updateNavBar();
  };

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  onRefresh = async () => {
    this.setState({ refreshing: true });
    const { NftDetectionController } = Engine.context;
    const chainIdsToDetectNftsFor = useNftDetectionChainIds();
    try {
      await NftDetectionController.detectNfts(chainIdsToDetectNftsFor);
    } finally {
      this.setState({ refreshing: false });
    }
  };

  hideCollectibleContractModal = () => {
    this.props.toggleCollectibleContractModal();
  };

  render = () => {
    const {
      route: { params },
      navigation,
      collectibleContractModalVisible,
    } = this.props;
    const collectibleContract = params;
    const address = params.address;
    const { collectibles } = this.props;
    const colors = (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);
    const filteredCollectibles = collectibles.filter((collectible) =>
      toLowerCaseEquals(collectible.address, address),
    );
    const contractName = collectibleContract.name;
    filteredCollectibles.map((collectible) => {
      if (!collectible.name || collectible.name === '') {
        collectible.name = contractName ?? null;
      }
      if (!collectible.image && collectibleContract.logo) {
        collectible.image = collectibleContract.logo ?? null;
      }
      return collectible;
    });

    const ownerOf = filteredCollectibles.length;

    return (
      <View style={styles.wrapper}>
        <ScrollView
          testID="refresh-control"
          refreshControl={
            <RefreshControl
              colors={[colors.primary.default]}
              tintColor={colors.icon.default}
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh}
            />
          }
          style={styles.wrapper}
        >
          <View>
            <View>
              <CollectibleContractOverview
                navigation={navigation}
                collectibleContract={collectibleContract}
                ownerOf={ownerOf}
              />
            </View>
            <View style={styles.wrapper}>
              <Collectibles
                navigation={navigation}
                collectibles={filteredCollectibles}
                collectibleContract={collectibleContract}
              />
            </View>
          </View>
        </ScrollView>
        <Modal
          isVisible={collectibleContractModalVisible}
          onBackdropPress={this.hideCollectibleContractModal}
          onBackButtonPress={this.hideCollectibleContractModal}
          onSwipeComplete={this.hideCollectibleContractModal}
          swipeDirection={'down'}
          backdropColor={colors.overlay.default}
          backdropOpacity={1}
        >
          <CollectibleContractInformation
            navigation={navigation}
            onClose={this.hideCollectibleContractModal}
            collectibleContract={collectibleContract}
          />
        </Modal>
      </View>
    );
  };
}

const mapStateToProps = (state: RootState): StateProps => ({
  collectibles: collectiblesSelector(state),
  collectibleContractModalVisible: state.modals.collectibleContractModalVisible,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  toggleCollectibleContractModal: () =>
    dispatch(toggleCollectibleContractModal()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Collectible);
