import React, { PureComponent } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  NavigationProp,
  ParamListBase,
  RouteProp,
} from '@react-navigation/native';
import { Theme } from '@metamask/design-tokens';
import CollectibleOverview from '../../UI/CollectibleOverview';
import { getNetworkNavbarOptions } from '../../UI/Navbar';
import StyledButton from '../../UI/StyledButton';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import collectiblesTransferInformationJson from '../../../util/collectibles-transfer.json';
import { newAssetTransaction } from '../../../actions/transaction';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface Collectible {
  address: string;
  contractName?: string;
  [key: string]: unknown;
}

interface CollectibleTransferInfo {
  name: string;
  tradable: boolean;
  method?: string;
}

const collectiblesTransferInformation =
  collectiblesTransferInformationJson as Record<
    string,
    CollectibleTransferInfo
  >;

interface CollectibleViewProps {
  /**
   * navigation object required to access the props
   * passed by the parent component
   */
  navigation: NavigationProp<ParamListBase>;
  /**
   * Start transaction with asset
   */
  newAssetTransaction: (collectible: Collectible) => void;
  /**
   * Object that represents the current route info like params passed to it
   */
  route: RouteProp<{ params: Collectible }, 'params'>;
}

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background.default,
    } as ViewStyle,
    wrapper: {
      flex: 0.9,
    } as ViewStyle,
    buttons: {
      paddingVertical: 15,
      flex: 0.1,
      height: 4,
    } as ViewStyle,
    button: {
      marginHorizontal: 16,
      flexDirection: 'row',
    } as ViewStyle,
    buttonText: {
      marginLeft: 8,
      fontSize: 15,
      color: colors.primary.inverse,
      ...fontStyles.bold,
    } as TextStyle,
  });

/**
 * View that displays a specific collectible asset
 */
class CollectibleView extends PureComponent<CollectibleViewProps> {
  static contextType = ThemeContext;

  scrollViewRef: React.RefObject<ScrollView> | undefined;

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
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
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    const styles = createStyles(colors) as ReturnType<typeof createStyles> & {
      assetOverviewWrapper?: ViewStyle;
      flexRow?: ViewStyle;
    };

    const lowerAddress = collectible.address.toLowerCase();
    const tradable =
      lowerAddress in collectiblesTransferInformation
        ? collectiblesTransferInformation[lowerAddress].tradable
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

const mapDispatchToProps = (dispatch: Dispatch) => ({
  newAssetTransaction: (selectedAsset: Collectible) =>
    dispatch(newAssetTransaction(selectedAsset)),
});

export default connect(null, mapDispatchToProps)(CollectibleView);
