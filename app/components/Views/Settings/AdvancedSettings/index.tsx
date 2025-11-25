// Third party dependencies.
import React, { PureComponent, RefObject } from 'react';
import {
  Linking,
  SafeAreaView,
  StyleSheet,
  Switch,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { connect } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Dispatch } from 'redux';

import { typography } from '@metamask/design-tokens';

// External dependencies.
import ActionModal from '../../../UI/ActionModal';
import Engine from '../../../../core/Engine';
import { baseStyles } from '../../../../styles/common';
import { getNavigationOptionsTitle } from '../../../UI/Navbar';
import {
  setShowCustomNonce,
  setShowFiatOnTestnets,
  setShowHexData,
} from '../../../../actions/settings';
import { strings } from '../../../../../locales/i18n';
import Device from '../../../../util/device';
import { mockTheme, ThemeContext } from '../../../../util/theme';
import {
  selectChainId,
  selectEvmChainId,
} from '../../../../selectors/networkController';
import {
  selectSmartTransactionsOptInStatus,
  selectUseTokenDetection,
} from '../../../../selectors/preferencesController';
import { selectSmartTransactionsEnabled } from '../../../../selectors/smartTransactionsController';
import Routes from '../../../../constants/navigation/Routes';

import { MetaMetricsEvents } from '../../../../core/Analytics';
import { AdvancedViewSelectorsIDs } from '../../../../../e2e/selectors/Settings/AdvancedView.selectors';
import Text, {
  TextVariant,
  TextColor,
  getFontFamily,
} from '../../../../component-library/components/Texts/Text';
import Button, {
  ButtonVariants,
  ButtonSize,
  ButtonWidthTypes,
} from '../../../../component-library/components/Buttons/Button';
import { withMetricsAwareness } from '../../../../components/hooks/useMetrics';
import { IWithMetricsAwarenessProps } from '../../../../components/hooks/useMetrics/withMetricsAwareness.types';
import { wipeTransactions } from '../../../../util/transaction-controller';
import AppConstants from '../../../../../app/core/AppConstants';
import { downloadStateLogs } from '../../../../util/logs';
import AutoDetectTokensSettings from '../AutoDetectTokensSettings';
import { RootState } from '../../../../reducers';
import { Theme, Colors } from '../../../../util/theme/models';
import { Hex } from '@metamask/utils';

interface AdvancedSettingsStyles {
  wrapper: ViewStyle;
  titleContainer: ViewStyle;
  title: ViewStyle;
  toggle: ViewStyle;
  toggleDesc: ViewStyle;
  desc: ViewStyle;
  accessory: ViewStyle;
  switchLine: ViewStyle;
  switch: ViewStyle;
  setting: ViewStyle;
  firstSetting: ViewStyle;
  modalView: ViewStyle;
  modalTitle: TextStyle;
  modalText?: TextStyle;
  picker: ViewStyle;
  inner: ViewStyle;
  ipfsGatewayLoadingWrapper: ViewStyle;
  warningBox: ViewStyle;
  warningText: TextStyle;
}

const createStyles = (colors: Colors): AdvancedSettingsStyles =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      padding: 16,
      paddingBottom: 100,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      flex: 1,
    },
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 16,
    },
    toggleDesc: {
      marginRight: 8,
    },
    desc: {
      marginTop: 8,
    },
    accessory: {
      marginTop: 16,
    },
    switchLine: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    switch: {
      alignSelf: 'flex-start',
    },
    setting: {
      marginTop: 32,
    },
    firstSetting: {
      marginTop: 0,
    },
    modalView: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      padding: 20,
    },
    modalTitle: {
      textAlign: 'center',
      marginBottom: 20,
    },
    picker: {
      borderColor: colors.border.default,
      borderRadius: 5,
      borderWidth: 2,
      marginTop: 16,
    },
    inner: {
      paddingBottom: 48,
    },
    ipfsGatewayLoadingWrapper: {
      height: 37,
      alignItems: 'center',
      justifyContent: 'center',
    },
    warningBox: {
      flexDirection: 'row',
      backgroundColor: colors.error.muted,
      borderLeftColor: colors.error.default,
      borderRadius: 4,
      borderLeftWidth: 4,
      marginTop: 24,
      marginHorizontal: 8,
      paddingStart: 11,
      paddingEnd: 8,
      paddingVertical: 8,
    },
    warningText: {
      ...(typography.sBodyMD as TextStyle),
      fontFamily: getFontFamily(TextVariant.BodyMD),
      color: colors.text.default,
      flex: 1,
      marginStart: 8,
    },
  });

interface NavigationProp {
  navigate: (route: string, params?: Record<string, unknown>) => void;
  setOptions: (options: Record<string, unknown>) => void;
}

interface RouteProp {
  params?: {
    isFullScreenModal?: boolean;
    scrollToBottom?: boolean;
  };
}

interface AdvancedSettingsStateProps {
  showHexData: boolean;
  showCustomNonce: boolean;
  showFiatOnTestnets: boolean;
  fullState: RootState;
  isTokenDetectionEnabled: boolean;
  chainId: string;
  smartTransactionsOptInStatus: boolean;
  smartTransactionsEnabled: boolean;
}

interface AdvancedSettingsDispatchProps {
  setShowHexData: (showHexData: boolean) => void;
  setShowCustomNonce: (showCustomNonce: boolean) => void;
  setShowFiatOnTestnets: (showFiatOnTestnets: boolean) => void;
}

interface AdvancedSettingsOwnProps {
  navigation: NavigationProp;
  route?: RouteProp;
}

type AdvancedSettingsProps = AdvancedSettingsStateProps &
  AdvancedSettingsDispatchProps &
  AdvancedSettingsOwnProps &
  IWithMetricsAwarenessProps;

interface AdvancedSettingsState {
  resetModalVisible: boolean;
  inputWidth: string | undefined;
}

/**
 * Main view for app configurations
 */
class AdvancedSettings extends PureComponent<
  AdvancedSettingsProps,
  AdvancedSettingsState
> {
  scrollView: RefObject<KeyboardAwareScrollView> = React.createRef();
  mounted = false;

  state: AdvancedSettingsState = {
    resetModalVisible: false,
    inputWidth: Device.isAndroid() ? '99%' : undefined,
  };

  getStyles = (): { styles: AdvancedSettingsStyles; colors: Colors } => {
    const theme = this.context as Theme;
    const colors = theme.colors || mockTheme.colors;
    const styles = createStyles(colors);
    return { styles, colors };
  };

  updateNavBar = (): void => {
    const { navigation, route } = this.props;
    const { colors } = this.getStyles();
    const isFullScreenModal = route?.params?.isFullScreenModal || false;
    navigation.setOptions(
      getNavigationOptionsTitle(
        strings('app_settings.advanced_title'),
        navigation,
        isFullScreenModal,
        colors,
      ) as Record<string, unknown>,
    );
  };

  componentDidMount = async (): Promise<void> => {
    this.updateNavBar();
    this.mounted = true;
    // Workaround https://github.com/facebook/react-native/issues/9958
    this.state.inputWidth &&
      setTimeout(() => {
        this.mounted && this.setState({ inputWidth: '100%' });
      }, 100);

    this.props.route?.params?.scrollToBottom &&
      this.scrollView?.current?.scrollToEnd(true);
  };

  componentDidUpdate = (): void => {
    this.updateNavBar();
  };

  componentWillUnmount = (): void => {
    this.mounted = false;
  };

  displayResetAccountModal = (): void => {
    this.setState({ resetModalVisible: true });
  };

  resetAccount = (): void => {
    const { navigation } = this.props;
    wipeTransactions();
    navigation.navigate('WalletView');
  };

  cancelResetAccount = (): void => {
    this.setState({ resetModalVisible: false });
  };

  downloadStateLogs = async (): Promise<void> => {
    const { fullState } = this.props;
    downloadStateLogs(fullState);
  };

  toggleTokenDetection = (detectionStatus: boolean): void => {
    const { PreferencesController } = Engine.context;
    PreferencesController.setUseTokenDetection(detectionStatus);
  };

  toggleSmartTransactionsOptInStatus = (
    smartTransactionsOptInStatus: boolean,
  ): void => {
    const { PreferencesController } = Engine.context;
    PreferencesController.setSmartTransactionsOptInStatus(
      smartTransactionsOptInStatus,
    );

    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.SMART_TRANSACTION_OPT_IN)
        .addProperties({
          stx_opt_in: smartTransactionsOptInStatus,
          location: 'Advanced Settings',
        })
        .build(),
    );
  };

  openLinkAboutStx = (): void => {
    Linking.openURL(AppConstants.URLS.SMART_TXS);
  };

  render = () => {
    const {
      showHexData,
      showCustomNonce,
      showFiatOnTestnets,
      setShowHexData,
      setShowCustomNonce,
      setShowFiatOnTestnets,
      smartTransactionsOptInStatus,
    } = this.props;
    const { resetModalVisible } = this.state;
    const { styles, colors } = this.getStyles();
    const theme = (this.context as Theme) || mockTheme;

    return (
      <SafeAreaView style={baseStyles.flexGrow}>
        <KeyboardAwareScrollView
          style={styles.wrapper}
          resetScrollToCoords={{ x: 0, y: 0 }}
          testID={AdvancedViewSelectorsIDs.ADVANCED_SETTINGS_SCROLLVIEW}
          ref={this.scrollView}
        >
          <View
            style={styles.inner}
            testID={AdvancedViewSelectorsIDs.CONTAINER}
          >
            <ActionModal
              modalVisible={resetModalVisible}
              confirmText={strings('app_settings.reset_account_confirm_button')}
              cancelText={strings('app_settings.reset_account_cancel_button')}
              onCancelPress={this.cancelResetAccount}
              onRequestClose={this.cancelResetAccount}
              onConfirmPress={this.resetAccount}
            >
              <View style={styles.modalView}>
                <Text style={styles.modalTitle} variant={TextVariant.HeadingMD}>
                  {strings('app_settings.reset_account_modal_title')}
                </Text>
                <Text style={styles.modalText}>
                  {strings('app_settings.reset_account_modal_message')}
                </Text>
              </View>
            </ActionModal>
            <View style={[styles.setting, styles.firstSetting]}>
              <Text variant={TextVariant.BodyLGMedium}>
                {strings('app_settings.reset_account')}
              </Text>
              <Text
                variant={TextVariant.BodyMD}
                color={TextColor.Alternative}
                style={styles.desc}
              >
                {strings('app_settings.reset_desc')}
              </Text>
              <Button
                variant={ButtonVariants.Secondary}
                size={ButtonSize.Lg}
                width={ButtonWidthTypes.Full}
                onPress={this.displayResetAccountModal}
                label={strings('app_settings.reset_account_button')}
                style={styles.accessory}
              />
            </View>

            <View style={styles.setting}>
              <View style={styles.titleContainer}>
                <Text variant={TextVariant.BodyLGMedium} style={styles.title}>
                  {strings('app_settings.smart_transactions_opt_in_heading')}
                </Text>
                <View style={styles.toggle}>
                  <Switch
                    testID={AdvancedViewSelectorsIDs.STX_OPT_IN_SWITCH}
                    value={smartTransactionsOptInStatus}
                    onValueChange={this.toggleSmartTransactionsOptInStatus}
                    trackColor={{
                      true: colors.primary.default,
                      false: colors.border.muted,
                    }}
                    thumbColor={theme.brandColors.white}
                    style={styles.switch}
                    ios_backgroundColor={colors.border.muted}
                    accessibilityLabel={strings(
                      'app_settings.smart_transactions_opt_in_heading',
                    )}
                  />
                </View>
              </View>

              <Text
                variant={TextVariant.BodyMD}
                color={TextColor.Alternative}
                style={styles.desc}
              >
                {strings(
                  'app_settings.smart_transactions_opt_in_desc_supported_networks',
                )}{' '}
                <Text color={TextColor.Primary} onPress={this.openLinkAboutStx}>
                  {strings('app_settings.smart_transactions_learn_more')}
                </Text>
              </Text>
            </View>

            <View style={styles.setting}>
              <View style={styles.titleContainer}>
                <Text variant={TextVariant.BodyLGMedium} style={styles.title}>
                  {strings('app_settings.show_hex_data')}
                </Text>
                <View style={styles.toggle}>
                  <Switch
                    value={showHexData}
                    onValueChange={setShowHexData}
                    trackColor={{
                      true: colors.primary.default,
                      false: colors.border.muted,
                    }}
                    thumbColor={theme.brandColors.white}
                    style={styles.switch}
                    ios_backgroundColor={colors.border.muted}
                  />
                </View>
              </View>
              <Text
                variant={TextVariant.BodyMD}
                color={TextColor.Alternative}
                style={styles.desc}
              >
                {strings('app_settings.hex_desc')}
              </Text>
            </View>
            <View style={styles.setting}>
              <View style={styles.titleContainer}>
                <Text variant={TextVariant.BodyLGMedium} style={styles.title}>
                  {strings('app_settings.show_custom_nonce')}
                </Text>
                <View style={styles.toggle}>
                  <Switch
                    value={showCustomNonce}
                    onValueChange={setShowCustomNonce}
                    trackColor={{
                      true: colors.primary.default,
                      false: colors.border.muted,
                    }}
                    thumbColor={theme.brandColors.white}
                    style={styles.switch}
                    ios_backgroundColor={colors.border.muted}
                  />
                </View>
              </View>
              <Text
                variant={TextVariant.BodyMD}
                color={TextColor.Alternative}
                style={styles.desc}
              >
                {strings('app_settings.custom_nonce_desc')}
              </Text>
            </View>
            <AutoDetectTokensSettings />
            <View style={styles.setting}>
              <View style={styles.titleContainer}>
                <Text variant={TextVariant.BodyLGMedium} style={styles.title}>
                  {strings('app_settings.show_fiat_on_testnets')}
                </Text>
                <View style={styles.toggle}>
                  <Switch
                    testID={AdvancedViewSelectorsIDs.SHOW_FIAT_ON_TESTNETS}
                    value={showFiatOnTestnets}
                    onValueChange={(newShowFiatOnTestnets: boolean) => {
                      if (newShowFiatOnTestnets) {
                        this.props.navigation.navigate(
                          Routes.MODAL.ROOT_MODAL_FLOW,
                          {
                            screen: Routes.SHEET.FIAT_ON_TESTNETS_FRICTION,
                          },
                        );
                      } else {
                        setShowFiatOnTestnets(false);
                      }
                    }}
                    trackColor={{
                      true: colors.primary.default,
                      false: colors.border.muted,
                    }}
                    thumbColor={theme.brandColors.white}
                    style={styles.switch}
                    ios_backgroundColor={colors.border.muted}
                  />
                </View>
              </View>
              <Text
                variant={TextVariant.BodyMD}
                color={TextColor.Alternative}
                style={styles.desc}
              >
                {strings('app_settings.show_fiat_on_testnets_desc')}
              </Text>
            </View>
            <View style={styles.setting}>
              <Text variant={TextVariant.BodyLGMedium}>
                {strings('app_settings.state_logs')}
              </Text>
              <Text
                variant={TextVariant.BodyMD}
                color={TextColor.Alternative}
                style={styles.desc}
              >
                {strings('app_settings.state_logs_desc')}
              </Text>
              <Button
                variant={ButtonVariants.Secondary}
                size={ButtonSize.Lg}
                width={ButtonWidthTypes.Full}
                onPress={this.downloadStateLogs}
                label={strings('app_settings.state_logs_button')}
                style={styles.accessory}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  };
}

AdvancedSettings.contextType = ThemeContext;

const mapStateToProps = (state: RootState): AdvancedSettingsStateProps => {
  const chainId = selectChainId(state);
  const evmChainId = selectEvmChainId(state);
  return {
    showHexData: state.settings.showHexData,
    showCustomNonce: state.settings.showCustomNonce,
    showFiatOnTestnets: state.settings.showFiatOnTestnets,
    fullState: state,
    isTokenDetectionEnabled: selectUseTokenDetection(state),
    chainId,
    smartTransactionsOptInStatus: selectSmartTransactionsOptInStatus(state),
    smartTransactionsEnabled: selectSmartTransactionsEnabled(state, evmChainId),
  };
};

const mapDispatchToProps = (
  dispatch: Dispatch,
): AdvancedSettingsDispatchProps => ({
  setShowHexData: (showHexData: boolean) =>
    dispatch(setShowHexData(showHexData)),
  setShowCustomNonce: (showCustomNonce: boolean) =>
    dispatch(setShowCustomNonce(showCustomNonce)),
  setShowFiatOnTestnets: (showFiatOnTestnets: boolean) =>
    dispatch(setShowFiatOnTestnets(showFiatOnTestnets)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withMetricsAwareness(
    AdvancedSettings as unknown as React.ComponentType<IWithMetricsAwarenessProps>,
  ),
);
