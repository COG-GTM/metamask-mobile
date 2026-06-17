import React, { PureComponent } from 'react';
import {
  RefreshControl,
  ScrollView,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  NavigationProp,
  ParamListBase,
  RouteProp,
} from '@react-navigation/native';
import { getNetworkNavbarOptions } from '../../UI/Navbar';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
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
import { Colors, Theme } from '../../../util/theme/models';
import { RootState } from '../../../reducers';

const createStyles = (colors: Colors) =>
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
interface CollectibleContractParams {
  address: string;
  name?: string;
  logo?: string;
  [key: string]: unknown;
}

interface CollectibleItem {
  address: string;
  name?: string;
  image?: string;
  [key: string]: unknown;
}

interface CollectibleProps {
  /**
   * Array of assets (in this case Collectibles)
   */
  collectibles: ReturnType<typeof collectiblesSelector>;
  /**
   * navigation object required to access the props
   * passed by the parent component
   */
  navigation: NavigationProp<ParamListBase>;
  /**
   * Called to toggle collectible contract information modal
   */
  toggleCollectibleContractModal: () => void;
  /**
   * Whether collectible contract information is visible
   */
  collectibleContractModalVisible: boolean;
  /**
   * Object that represents the current route info like params passed to it
   */
  route: RouteProp<{ params: CollectibleContractParams }, 'params'>;
}

interface CollectibleState {
  refreshing: boolean;
  collectibles: unknown[];
}

class Collectible extends PureComponent<CollectibleProps, CollectibleState> {
  state: CollectibleState = {
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
    const styles = createStyles(colors) as ReturnType<typeof createStyles> & {
      assetOverviewWrapper?: ViewStyle;
    };
    const filteredCollectibles = collectibles.filter(
      (collectible: CollectibleItem) =>
        toLowerCaseEquals(collectible.address, address),
    );
    filteredCollectibles.map((collectible: CollectibleItem) => {
      if (!collectible.name || collectible.name === '') {
        collectible.name = collectibleContract.name;
      }
      if (!collectible.image && collectibleContract.logo) {
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

const mapDispatchToProps = (dispatch: Dispatch) => ({
  toggleCollectibleContractModal: () =>
    dispatch(toggleCollectibleContractModal()),
});

Collectible.contextType = ThemeContext;

export default connect(mapStateToProps, mapDispatchToProps)(Collectible);
