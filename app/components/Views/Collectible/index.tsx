import React, { PureComponent } from 'react';
import { RefreshControl, ScrollView, View, StyleSheet, ViewStyle } from 'react-native';
import { getNetworkNavbarOptions } from '../../UI/Navbar';
import { connect } from 'react-redux';
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
import { Theme } from '../../../util/theme/models';
import { RootState } from '../../../reducers';

interface Styles {
  wrapper: ViewStyle;
  assetOverviewWrapper?: ViewStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
  });

interface CollectibleItem {
  address: string;
  name?: string;
  image?: string;
  [key: string]: unknown;
}

interface CollectibleContract {
  address: string;
  name?: string;
  logo?: string;
  [key: string]: unknown;
}

interface NavigationObject {
  setOptions?: (options: unknown) => void;
  [key: string]: unknown;
}

interface RouteObject {
  params?: CollectibleContract;
}

interface CollectibleProps {
  collectibles: CollectibleItem[];
  navigation: NavigationObject;
  toggleCollectibleContractModal: () => void;
  collectibleContractModalVisible: boolean;
  route: RouteObject;
}

interface CollectibleState {
  refreshing: boolean;
  collectibles: CollectibleItem[];
}

/**
 * View that displays a specific collectible
 * including the overview (name, address, symbol, logo, description, total supply)
 * and also individual collectibles list
 */
class Collectible extends PureComponent<CollectibleProps, CollectibleState> {
  declare context: React.ContextType<typeof ThemeContext>;

  state: CollectibleState = {
    refreshing: false,
    collectibles: [],
  };

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors = this.context?.colors || mockTheme.colors;
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
    const address = params?.address ?? '';
    const { collectibles } = this.props;
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);
    const filteredCollectibles = collectibles.filter((collectible) =>
      toLowerCaseEquals(collectible.address, address),
    );
    filteredCollectibles.map((collectible) => {
      if (!collectible.name || collectible.name === '') {
        collectible.name = collectibleContract?.name;
      }
      if (!collectible.image && collectibleContract?.logo) {
        collectible.image = collectibleContract.logo;
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
            <View style={styles.assetOverviewWrapper}>
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

const mapStateToProps = (state: RootState) => ({
  collectibles: collectiblesSelector(state),
  collectibleContractModalVisible: state.modals.collectibleContractModalVisible,
});

const mapDispatchToProps = (dispatch: (action: unknown) => void) => ({
  toggleCollectibleContractModal: () =>
    dispatch(toggleCollectibleContractModal()),
});

Collectible.contextType = ThemeContext;

export default connect(mapStateToProps, mapDispatchToProps)(Collectible);
