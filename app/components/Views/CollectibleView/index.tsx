import React, { PureComponent, type ComponentType } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import PropTypes from 'prop-types';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { Theme } from '@metamask/design-tokens';
import CollectibleOverview from '../../UI/CollectibleOverview';
import { getNetworkNavbarOptions } from '../../UI/Navbar';
import StyledButton from '../../UI/StyledButton';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import { connect, type ConnectedProps } from 'react-redux';
import type { Dispatch } from 'redux';
import collectiblesTransferInformation from '../../../util/collectibles-transfer.json';
import { newAssetTransaction } from '../../../actions/transaction';
import { ThemeContext, mockTheme } from '../../../util/theme';

const createStyles = (colors: Theme['colors']) =>
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

interface CollectibleViewStyles {
  root: ViewStyle;
  wrapper: ViewStyle;
  buttons: ViewStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  assetOverviewWrapper?: ViewStyle;
  flexRow?: ViewStyle;
}

interface CollectibleViewParams {
  address: string;
  contractName?: string;
  [key: string]: unknown;
}

interface CollectibleViewOwnProps {
  navigation: Pick<NavigationProp<ParamListBase>, 'navigate'>;
  route: { params: CollectibleViewParams };
}

interface CollectibleViewDispatchProps {
  newAssetTransaction: (selectedAsset: CollectibleViewParams) => void;
}

const mapDispatchToProps = (
  dispatch: Dispatch,
): CollectibleViewDispatchProps => ({
  newAssetTransaction: (selectedAsset) =>
    dispatch(newAssetTransaction(selectedAsset)),
});

const connector = connect<
  Record<string, never>,
  CollectibleViewDispatchProps,
  CollectibleViewOwnProps
>(null, mapDispatchToProps);
type ReduxProps = ConnectedProps<typeof connector>;

interface CollectibleViewProps extends ReduxProps, CollectibleViewOwnProps {}

/**
 * View that displays a specific collectible asset
 */
class CollectibleView extends PureComponent<CollectibleViewProps> {
  static contextType = ThemeContext;

  static propTypes = {
    /**
    /* navigation object required to access the props
    /* passed by the parent component
    */
    navigation: PropTypes.object,
    /**
     * Start transaction with asset
     */
    newAssetTransaction: PropTypes.func,
    /**
     * Object that represents the current route info like params passed to it
     */
    route: PropTypes.object,
  };

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
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
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles: CollectibleViewStyles = createStyles(colors);

    const lowerAddress = collectible.address.toLowerCase();
    const transferInformation = collectiblesTransferInformation as Record<
      string,
      { tradable: boolean }
    >;
    const tradable =
      lowerAddress in transferInformation
        ? transferInformation[lowerAddress].tradable
        : true;

    return (
      <SafeAreaView style={styles.root}>
        <ScrollView
          style={styles.wrapper}
          ref={
            (
              this as unknown as {
                scrollViewRef: React.RefObject<ScrollView>;
              }
            ).scrollViewRef
          }
        >
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

export default connector(
  CollectibleView as ComponentType<CollectibleViewProps>,
);
