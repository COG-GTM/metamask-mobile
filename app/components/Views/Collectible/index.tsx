import React, { PureComponent } from 'react';
import { RefreshControl, ScrollView, View, StyleSheet } from 'react-native';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
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
import { Theme } from '../../../util/theme/models';
import { RootState } from '../../../reducers';
import { useNftDetectionChainIds } from '../../hooks/useNftDetectionChainIds';

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
interface CollectibleContractParams {
  address?: string;
  name?: string;
  logo?: string;
}

interface CollectibleItem {
  address: string;
  name?: string;
  image?: string | null;
}

interface CollectibleProps {
  /**
   * Array of assets (in this case Collectibles)
   */
  collectibles?: CollectibleItem[];
  /**
   * navigation object required to access the props
   * passed by the parent component
   */
  navigation?: StackNavigationProp<ParamListBase>;
  /**
   * Called to toggle collectible contract information modal
   */
  toggleCollectibleContractModal?: () => void;
  /**
   * Whether collectible contract information is visible
   */
  collectibleContractModalVisible?: boolean;
  /**
   * Object that represents the current route info like params passed to it
   */
  route?: { params?: CollectibleContractParams };
}

interface CollectibleState {
  refreshing: boolean;
  collectibles: CollectibleItem[];
}

class Collectible extends PureComponent<CollectibleProps, CollectibleState> {
  static contextType = ThemeContext;

  state: CollectibleState = {
    refreshing: false,
    collectibles: [],
  };

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors = (this.context as unknown as Theme).colors || mockTheme.colors;
    if (navigation) {
      getNetworkNavbarOptions(
        route?.params?.name ?? '',
        false,
        navigation,
        colors,
      );
    }
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
    this.props.toggleCollectibleContractModal?.();
  };

  render = () => {
    const { route, navigation, collectibleContractModalVisible } = this.props;
    const params = route?.params ?? {};
    const collectibleContract = params;
    const address = params.address;
    const collectibles = this.props.collectibles ?? [];
    const colors = (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);
    const filteredCollectibles = collectibles.filter((collectible) =>
      toLowerCaseEquals(collectible.address, address),
    );
    filteredCollectibles.map((collectible) => {
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

const mapStateToProps = (state: RootState) => ({
  collectibles: collectiblesSelector(state),
  collectibleContractModalVisible: state.modals.collectibleContractModalVisible,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  toggleCollectibleContractModal: () =>
    dispatch(toggleCollectibleContractModal()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Collectible);
