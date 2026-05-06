// Third party dependencies.

import React, { PureComponent } from 'react';
import { Linking, SafeAreaView, StyleSheet, Switch, View } from 'react-native';
import { connect } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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
import { selectChainId } from '../../../../selectors/networkController';
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
import { wipeTransactions } from '../../../../util/transaction-controller';
import AppConstants from '../../../../../app/core/AppConstants';
import { downloadStateLogs } from '../../../../util/logs';
import AutoDetectTokensSettings from '../AutoDetectTokensSettings';

interface MetricsBuilderProps {
  addProperties: (props: Record<string, unknown>) => MetricsBuilderProps;
  build: () => unknown;
}
interface Metrics {
  trackEvent: (event: unknown) => void;
  createEventBuilder: (event: string) => MetricsBuilderProps;
}
interface NavigationLike {
  navigate: (route: string, params?: Record<string, unknown>) => void;
  setOptions: (opts: Record<string, unknown>) => void;
}
interface RouteLike {
  params?: { isFullScreenModal?: boolean; scrollToBottom?: boolean };
}

interface Props {
  navigation: NavigationLike;
  route?: RouteLike;
  showHexData?: boolean;
  showCustomNonce?: boolean;
  showFiatOnTestnets?: boolean;
  fullState?: unknown;
  isTokenDetectionEnabled?: boolean;
  chainId?: string;
  smartTransactionsOptInStatus?: boolean;
  smartTransactionsEnabled?: boolean;
  setShowHexData: (v: boolean) => void;
  setShowCustomNonce: (v: boolean) => void;
  setShowFiatOnTestnets: (v: boolean) => void;
  metrics: Metrics;
}
interface State {
  resetModalVisible: boolean;
  inputWidth: string | undefined;
}

interface ColorTokens {
  background: { default: string; muted?: string };
  border: { default: string; muted: string };
  error: { muted: string; default: string };
  text: { default: string };
  primary: { default: string; muted?: string };
  brandColors?: { white: string };
  [key: string]: unknown;
}

const createStyles = (colors: ColorTokens) =>
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
      ...typography.sBodyMD,
      fontFamily: getFontFamily(TextVariant.BodyMD),
      color: colors.text.default,
      flex: 1,
      marginStart: 8,
    },
    modalText: {
      textAlign: 'center' as const,
    },
  });

/**
 * Main view for app configurations
 */
class AdvancedSettings extends PureComponent<Props, State> {
  /* propTypes removed during JS→TS migration */

  scrollView = React.createRef<KeyboardAwareScrollView>();

  mounted = false;

  state: State = {
    resetModalVisible: false,
    inputWidth: Device.isAndroid() ? '99%' : undefined,
  };

  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  getStyles = () => {
    const colors = (this.context?.colors || mockTheme.colors) as ColorTokens;
    const styles = createStyles(colors);
    return { styles, colors };
  };

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const { colors } = this.getStyles();
    const isFullScreenModal = route?.params?.isFullScreenModal || false;
    (navigation as { setOptions: (opts: unknown) => void }).setOptions(
      getNavigationOptionsTitle(
        strings('app_settings.advanced_title'),
        navigation as unknown as Record<string, unknown>,
        isFullScreenModal,
        colors as unknown as Record<string, unknown>,
      ),
    );
  };

  componentDidMount = async () => {
    this.updateNavBar();
    this.mounted = true;
    // Workaround https://github.com/facebook/react-native/issues/9958
    if (this.state.inputWidth) {
      setTimeout(() => {
        if (this.mounted) this.setState({ inputWidth: '100%' });
      }, 100);
    }

    if (this.props.route?.params?.scrollToBottom) {
      (
        this.scrollView?.current as unknown as {
          scrollToEnd: (opts: { animated: boolean }) => void;
        }
      )?.scrollToEnd({ animated: true });
    }
  };

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  componentWillUnmount = () => {
    this.mounted = false;
  };

  displayResetAccountModal = () => {
    this.setState({ resetModalVisible: true });
  };

  resetAccount = () => {
    const { navigation } = this.props;
    wipeTransactions();
    navigation.navigate('WalletView');
  };

  cancelResetAccount = () => {
    this.setState({ resetModalVisible: false });
  };

  downloadStateLogs = async () => {
    const { fullState } = this.props;
    downloadStateLogs(fullState as Parameters<typeof downloadStateLogs>[0]);
  };

  toggleTokenDetection = (detectionStatus: boolean) => {
    const { PreferencesController } = Engine.context;
    PreferencesController.setUseTokenDetection(detectionStatus);
  };

  toggleSmartTransactionsOptInStatus = (smartTransactionsOptInStatus: boolean) => {
    const { PreferencesController } = Engine.context;
    PreferencesController.setSmartTransactionsOptInStatus(
      smartTransactionsOptInStatus,
    );

    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(
          MetaMetricsEvents.SMART_TRANSACTION_OPT_IN as unknown as string,
        )
        .addProperties({
          stx_opt_in: smartTransactionsOptInStatus,
          location: 'Advanced Settings',
        })
        .build(),
    );
  };

  openLinkAboutStx = () => {
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
    const theme = this.context || mockTheme;

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
                <Text
                  color={TextColor.Primary}
                  // @ts-expect-error legacy Text props (link)
                  link
                  onPress={this.openLinkAboutStx}
                >
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
                    onValueChange={(showFiatOnTestnets) => {
                      if (showFiatOnTestnets) {
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



const mapStateToProps = (rawState: Record<string, Record<string, unknown>>) => {
  const state = rawState as unknown as Parameters<typeof selectChainId>[0];
  const settings = rawState.settings as Record<string, unknown>;
  return {
    showHexData: settings.showHexData as boolean | undefined,
    showCustomNonce: settings.showCustomNonce as boolean | undefined,
    showFiatOnTestnets: settings.showFiatOnTestnets as boolean | undefined,
    fullState: rawState,
    isTokenDetectionEnabled: selectUseTokenDetection(
      state as unknown as Parameters<typeof selectUseTokenDetection>[0],
    ),
    chainId: selectChainId(state) as `0x${string}` | undefined,
    smartTransactionsOptInStatus: selectSmartTransactionsOptInStatus(
      state as unknown as Parameters<typeof selectSmartTransactionsOptInStatus>[0],
    ),
    smartTransactionsEnabled: selectSmartTransactionsEnabled(
      state as unknown as Parameters<typeof selectSmartTransactionsEnabled>[0],
      selectChainId(state) as `0x${string}`,
    ),
  };
};

interface AppDispatch {
  (action: { type: string; [k: string]: unknown }): unknown;
}

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  setShowHexData: (showHexData: boolean) =>
    dispatch(setShowHexData(showHexData)),
  setShowCustomNonce: (showCustomNonce: boolean) =>
    dispatch(setShowCustomNonce(showCustomNonce)),
  setShowFiatOnTestnets: (showFiatOnTestnets: boolean) =>
    dispatch(setShowFiatOnTestnets(showFiatOnTestnets)),
});

type WithMetricsParam = Parameters<typeof withMetricsAwareness>[0];

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(AdvancedSettings as unknown as WithMetricsParam));
