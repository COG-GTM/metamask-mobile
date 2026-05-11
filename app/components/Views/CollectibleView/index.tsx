import React, { PureComponent } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  type TextStyle,
} from 'react-native';
import CollectibleOverview from '../../UI/CollectibleOverview';
import { getNetworkNavbarOptions } from '../../UI/Navbar';
import StyledButton from '../../UI/StyledButton';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import { connect } from 'react-redux';
// eslint-disable-next-line import/no-unresolved
import collectiblesTransferInformation from '../../../util/collectibles-transfer.json';
import type { Dispatch, AnyAction } from 'redux';
import { newAssetTransaction } from '../../../actions/transaction';
import { ThemeContext, mockTheme } from '../../../util/theme';
type ThemeColors = typeof mockTheme.colors;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    wrapper: {
      flex: 0.9,
    },
    buttons: {
      paddingVertical: 15,
      flex: 0.1,
      height: 4,
    },
    button: {
      marginHorizontal: 16,
      flexDirection: 'row',
    },
    buttonText: {
      marginLeft: 8,
      fontSize: 15,
      color: colors.primary.inverse,
      ...(fontStyles.bold as TextStyle),
    },
    assetOverviewWrapper: {},
    flexRow: {},
  });

interface CollectibleRouteParams {
  contractName?: string;
  address: string;
  [key: string]: unknown;
}

interface CollectibleViewNavigation {
  navigate: (route: string, params?: unknown) => void;
  setOptions?: (options: unknown) => void;
}

interface CollectibleViewRoute {
  params: CollectibleRouteParams;
}

interface CollectibleViewOwnProps {
  /**
   * navigation object required to access the props
   * passed by the parent component
   */
  navigation: CollectibleViewNavigation;
  /**
   * Object that represents the current route info like params passed to it
   */
  route: CollectibleViewRoute;
}

interface CollectibleViewDispatchProps {
  /**
   * Start transaction with asset
   */
  newAssetTransaction: (selectedAsset: CollectibleRouteParams) => void;
}

type CollectibleViewProps = CollectibleViewOwnProps &
  CollectibleViewDispatchProps;

/**
 * View that displays a specific collectible asset
 */
class CollectibleView extends PureComponent<CollectibleViewProps> {
  static contextType = ThemeContext;

  scrollViewRef = React.createRef<ScrollView>();

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors = (this.context as unknown as { colors?: typeof mockTheme.colors; themeAppearance?: 'light' | 'dark' | 'default' })?.colors || mockTheme.colors;
    getNetworkNavbarOptions(
      route.params?.contractName ?? '',
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

  onSend = async () => {
    const {
      route: { params },
    } = this.props;
    this.props.newAssetTransaction(params);
    this.props.navigation.navigate('SendFlowView');
  };

  render() {
    const {
      route: { params },
      navigation,
    } = this.props;
    const collectible = params;
    const colors = (this.context as unknown as { colors?: typeof mockTheme.colors; themeAppearance?: 'light' | 'dark' | 'default' })?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    const lowerAddress = collectible.address.toLowerCase();
    const transferInfo = collectiblesTransferInformation as Record<
      string,
      { tradable?: boolean }
    >;
    const tradable =
      lowerAddress in transferInfo
        ? transferInfo[lowerAddress].tradable
        : true;

    return (
      <SafeAreaView style={styles.root}>
        <ScrollView style={styles.wrapper} ref={this.scrollViewRef}>
          <View style={styles.assetOverviewWrapper}>
            <CollectibleOverview
              navigation={navigation}
              collectible={collectible}
            />
          </View>
        </ScrollView>
        {tradable && (
          <View style={styles.buttons}>
            <StyledButton
              type={'confirm'}
              onPress={this.onSend}
              containerStyle={styles.button}
              childGroupStyle={styles.flexRow}
              testID="send-button"
            >
              <Text style={styles.buttonText}>
                {strings('asset_overview.send_button').toUpperCase()}
              </Text>
            </StyledButton>
          </View>
        )}
      </SafeAreaView>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => ({
  newAssetTransaction: (selectedAsset: CollectibleRouteParams) =>
    dispatch(newAssetTransaction(selectedAsset)),
});

export default connect<
  Record<string, never>,
  CollectibleViewDispatchProps,
  CollectibleViewOwnProps
>(
  null,
  mapDispatchToProps,
)(CollectibleView);
