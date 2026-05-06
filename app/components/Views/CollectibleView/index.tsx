import React, { PureComponent } from 'react';
import { ScrollView, View, StyleSheet, Text, SafeAreaView } from 'react-native';
import { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import { connect } from 'react-redux';
import CollectibleOverview from '../../UI/CollectibleOverview';
import { getNetworkNavbarOptions } from '../../UI/Navbar';
import StyledButton from '../../UI/StyledButton';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import collectiblesTransferInformation from '../../../util/collectibles-transfer.json';
import { newAssetTransaction } from '../../../actions/transaction';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Colors, Theme } from '../../../util/theme/models';

const createStyles = (colors: Colors) =>
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
  tokenId: string;
  contractName?: string;
  [key: string]: unknown;
}

interface CollectibleViewRouteParams extends Collectible {
  contractName?: string;
}

interface OwnProps {
  /**
   * navigation object required to access the props
   * passed by the parent component
   */
  navigation: NavigationProp<ParamListBase>;
  /**
   * Object that represents the current route info like params passed to it
   */
  route: RouteProp<{ params: CollectibleViewRouteParams }, 'params'>;
}

interface DispatchProps {
  /**
   * Start transaction with asset
   */
  newAssetTransaction: (selectedAsset: Collectible) => void;
}

type Props = OwnProps & DispatchProps;

/**
 * View that displays a specific collectible asset
 */
class CollectibleView extends PureComponent<Props> {
  static contextType = ThemeContext;

  scrollViewRef = React.createRef<ScrollView>();

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors = (this.context as Theme | undefined)?.colors || mockTheme.colors;
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
    const colors = (this.context as Theme | undefined)?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    const lowerAddress = collectible.address.toLowerCase();
    const tradable =
      lowerAddress in collectiblesTransferInformation
        ? (collectiblesTransferInformation as Record<string, { tradable: boolean }>)[lowerAddress].tradable
        : true;

    return (
      <SafeAreaView style={styles.root}>
        <ScrollView style={styles.wrapper} ref={this.scrollViewRef}>
          <View>
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

const mapDispatchToProps = (
  dispatch: (action: ReturnType<typeof newAssetTransaction>) => void,
): DispatchProps => ({
  newAssetTransaction: (selectedAsset: Collectible) =>
    dispatch(newAssetTransaction(selectedAsset)),
});

export default connect(null, mapDispatchToProps)(CollectibleView);
