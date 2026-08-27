/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React, { PureComponent } from 'react';
import { ScrollView, View, StyleSheet, Text, SafeAreaView } from 'react-native';
import CollectibleOverview from '../../UI/CollectibleOverview';
import { getNetworkNavbarOptions } from '../../UI/Navbar';
import StyledButton from '../../UI/StyledButton';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import { connect } from 'react-redux';
// @ts-expect-error -- legacy JavaScript UI type boundary
import collectiblesTransferInformation from '../../../util/collectibles-transfer';
import { newAssetTransaction } from '../../../actions/transaction';
import { ThemeContext, mockTheme } from '../../../util/theme';

// @ts-expect-error -- legacy JavaScript UI type boundary
const createStyles = (colors) =>
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
class CollectibleView extends PureComponent {

  updateNavBar = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { navigation, route } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
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
      // @ts-expect-error -- legacy JavaScript UI type boundary
      route: { params },
    } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.newAssetTransaction(params);
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.navigation.navigate('SendFlowView');
  };

  render() {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      route: { params },
      // @ts-expect-error -- legacy JavaScript UI type boundary
      navigation,
    } = this.props;
    const collectible = params;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    const lowerAddress = collectible.address.toLowerCase();
    const tradable =
      lowerAddress in collectiblesTransferInformation
        ? collectiblesTransferInformation[lowerAddress].tradable
        : true;

    return (
      <SafeAreaView style={styles.root}>
        {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
        <ScrollView style={styles.wrapper} ref={this.scrollViewRef}>
          {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
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
              // @ts-expect-error -- legacy JavaScript UI type boundary
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

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapDispatchToProps = (dispatch) => ({
  // @ts-expect-error -- legacy JavaScript UI type boundary
  newAssetTransaction: (selectedAsset) =>
    dispatch(newAssetTransaction(selectedAsset)),
});

export default connect(null, mapDispatchToProps)(CollectibleView);

interface CollectibleViewProps {
  navigation?: Record<string, any>;
  newAssetTransaction?: (...args: any[]) => any;
  route?: Record<string, any>;
}
