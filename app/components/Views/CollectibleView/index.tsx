import React, { PureComponent, RefObject, createRef } from 'react';
import { ScrollView, View, StyleSheet, Text, SafeAreaView, ViewStyle, TextStyle } from 'react-native';
import CollectibleOverview from '../../UI/CollectibleOverview';
import { getNetworkNavbarOptions } from '../../UI/Navbar';
import StyledButton from '../../UI/StyledButton';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import { connect } from 'react-redux';
import collectiblesTransferInformation from '../../../util/collectibles-transfer';
import { newAssetTransaction } from '../../../actions/transaction';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Theme } from '../../../util/theme/models';

interface Styles {
  root: ViewStyle;
  wrapper: ViewStyle;
  buttons: ViewStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  assetOverviewWrapper?: ViewStyle;
  flexRow?: ViewStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
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
      ...fontStyles.bold,
    },
  });

interface Collectible {
  address: string;
  contractName?: string;
  [key: string]: unknown;
}

interface NavigationObject {
  navigate: (route: string) => void;
}

interface RouteObject {
  params?: Collectible;
}

interface CollectibleViewProps {
  navigation: NavigationObject;
  newAssetTransaction: (selectedAsset: Collectible) => void;
  route: RouteObject;
}

/**
 * View that displays a specific collectible asset
 */
class CollectibleView extends PureComponent<CollectibleViewProps> {
  declare context: React.ContextType<typeof ThemeContext>;
  scrollViewRef: RefObject<ScrollView> = createRef();

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors = this.context?.colors || mockTheme.colors;
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
    if (params) {
      this.props.newAssetTransaction(params);
      this.props.navigation.navigate('SendFlowView');
    }
  };

  render() {
    const {
      route: { params },
      navigation,
    } = this.props;
    const collectible = params;
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (!collectible) {
      return null;
    }

    const lowerAddress = collectible.address.toLowerCase();
    const tradable =
      lowerAddress in collectiblesTransferInformation
        ? (collectiblesTransferInformation as Record<string, { tradable: boolean }>)[lowerAddress].tradable
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

CollectibleView.contextType = ThemeContext;

const mapDispatchToProps = (dispatch: (action: unknown) => void) => ({
  newAssetTransaction: (selectedAsset: Collectible) =>
    dispatch(newAssetTransaction(selectedAsset)),
});

export default connect(null, mapDispatchToProps)(CollectibleView);
