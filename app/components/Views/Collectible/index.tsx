import React, { PureComponent } from 'react';
import {
  RefreshControl,
  ScrollView,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
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
import type { Dispatch } from 'redux';
import { RootState } from '../../../reducers';

interface CollectibleContractParams {
  name?: string;
  address?: string;
  logo?: string;
  symbol?: string;
}

interface NftItem {
  address: string;
  name?: string;
  image?: string;
  tokenId?: string;
  [key: string]: unknown;
}

const createStyles = (colors: { background: { default: string } }) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    } as ViewStyle,
  });

type CollectibleNavigation = {
  navigate: (...args: unknown[]) => void;
  setOptions?: (options: object) => void;
  push?: (...args: unknown[]) => void;
};

type CollectibleRoute = {
  params: CollectibleContractParams;
};

interface OwnProps {
  /**
   * navigation object required to access the props
   * passed by the parent component
   */
  navigation?: CollectibleNavigation;
  /**
   * Object that represents the current route info like params passed to it
   */
  route: CollectibleRoute;
}

interface StateProps {
  /**
   * Array of assets (in this case Collectibles)
   */
  collectibles: NftItem[];
  /**
   * Whether collectible contract information is visible
   */
  collectibleContractModalVisible: boolean;
}

interface DispatchProps {
  /**
   * Called to toggle collectible contract information modal
   */
  toggleCollectibleContractModal: () => void;
}

type Props = OwnProps & StateProps & DispatchProps;

interface State {
  refreshing: boolean;
  collectibles: NftItem[];
}

/**
 * View that displays a specific collectible
 * including the overview (name, address, symbol, logo, description, total supply)
 * and also individual collectibles list
 */
class Collectible extends PureComponent<Props, State> {
  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  state: State = {
    refreshing: false,
    collectibles: [],
  };

  updateNavBar = () => {
    const { navigation, route } = this.props;
    if (!navigation) return;
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
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
    const ctx = this.context as {
      colors?: typeof mockTheme.colors & {
        primary: { default: string };
        icon: { default: string };
        overlay: { default: string };
      };
    };
    const colors = (ctx?.colors as typeof mockTheme.colors) || mockTheme.colors;
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

const mapStateToProps = (state: RootState): StateProps => ({
  collectibles: collectiblesSelector(state) as NftItem[],
  collectibleContractModalVisible:
    state.modals.collectibleContractModalVisible,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  toggleCollectibleContractModal: () =>
    dispatch(toggleCollectibleContractModal()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Collectible);
