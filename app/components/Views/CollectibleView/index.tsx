import React, { PureComponent } from 'react';
import { ScrollView, View, StyleSheet, Text, SafeAreaView } from 'react-native';
import CollectibleOverview from '../../UI/CollectibleOverview';
import { getNetworkNavbarOptions } from '../../UI/Navbar';
import StyledButton from '../../UI/StyledButton';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import { connect } from 'react-redux';
import collectiblesTransferInformation from '../../../util/collectibles-transfer.json';
import { newAssetTransaction } from '../../../actions/transaction';
import { ThemeContext, mockTheme } from '../../../util/theme';
import type { Colors, Theme } from '../../../util/theme/models';

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

/**
 * View that displays a specific collectible asset
 */
interface CollectibleViewProps {
  /**
   * navigation object required to access the props
   * passed by the parent component
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  /**
   * Start transaction with asset
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newAssetTransaction: (selectedAsset: any) => void;
  /**
   * Object that represents the current route info like params passed to it
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

class CollectibleView extends PureComponent<CollectibleViewProps> {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollViewRef?: any;

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors = (this.context as Theme).colors || mockTheme.colors;
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
    const colors = (this.context as Theme).colors || mockTheme.colors;
    // Some referenced style keys are not defined in createStyles; keep the
    // loose type to preserve existing runtime behavior.
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const styles: any = createStyles(colors);

    const lowerAddress = collectible.address.toLowerCase();
    const transferInformation =
      collectiblesTransferInformation as unknown as Record<
        string,
        { name: string; tradable: boolean; method: string }
      >;
    const tradable =
      lowerAddress in transferInformation
        ? transferInformation[lowerAddress].tradable
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

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newAssetTransaction: (selectedAsset: any) =>
    dispatch(newAssetTransaction(selectedAsset)),
});

export default connect(null, mapDispatchToProps)(CollectibleView);
