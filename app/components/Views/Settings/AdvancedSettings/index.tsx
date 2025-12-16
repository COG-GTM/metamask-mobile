// Third party dependencies.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, SafeAreaView, Switch, View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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
import { useTheme } from '../../../../util/theme';
import {
  selectSmartTransactionsOptInStatus,
} from '../../../../selectors/preferencesController';
import Routes from '../../../../constants/navigation/Routes';
import { MetaMetricsEvents, useMetrics } from '../../../hooks/useMetrics';
import { AdvancedViewSelectorsIDs } from '../../../../../e2e/selectors/Settings/AdvancedView.selectors';
import Text, {
  TextVariant,
  TextColor,
} from '../../../../component-library/components/Texts/Text';
import Button, {
  ButtonVariants,
  ButtonSize,
  ButtonWidthTypes,
} from '../../../../component-library/components/Buttons/Button';
import { wipeTransactions } from '../../../../util/transaction-controller';
import AppConstants from '../../../../../app/core/AppConstants';
import { downloadStateLogs } from '../../../../util/logs';
import AutoDetectTokensSettings from '../AutoDetectTokensSettings';
import { RootState } from '../../../../reducers';
import ReduxService from '../../../../core/redux';

// Internal dependencies.
import createStyles from './AdvancedSettings.styles';
import { AdvancedSettingsProps, AdvancedSettingsParams } from './AdvancedSettings.types';

/**
 * Main view for app configurations
 */
const AdvancedSettings = ({ navigation, route }: AdvancedSettingsProps) => {
  const theme = useTheme();
  const { colors } = theme;
  const styles = createStyles(colors);
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useMetrics();

  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [inputWidth, setInputWidth] = useState<string | undefined>(
    Device.isAndroid() ? '99%' : undefined,
  );

  // Redux selectors
  const showHexData = useSelector(
    (state: RootState) => state.settings.showHexData,
  );
  const showCustomNonce = useSelector(
    (state: RootState) => state.settings.showCustomNonce,
  );
  const showFiatOnTestnets = useSelector(
    (state: RootState) => state.settings.showFiatOnTestnets,
  );
  const smartTransactionsOptInStatus = useSelector(
    selectSmartTransactionsOptInStatus,
  );

  const params = route?.params as AdvancedSettingsParams | undefined;
  const isFullScreenModal = params?.isFullScreenModal || false;

  const updateNavBar = useCallback(() => {
    navigation.setOptions(
      getNavigationOptionsTitle(
        strings('app_settings.advanced_title'),
        navigation,
        isFullScreenModal,
        colors,
      ),
    );
  }, [navigation, isFullScreenModal, colors]);

  useEffect(() => {
    updateNavBar();
  }, [updateNavBar]);

  useEffect(() => {
    // Workaround https://github.com/facebook/react-native/issues/9958
    if (inputWidth) {
      const timer = setTimeout(() => {
        setInputWidth('100%');
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [inputWidth]);

  useEffect(() => {
    if (params?.scrollToBottom) {
      scrollViewRef.current?.scrollToEnd(true);
    }
  }, [params?.scrollToBottom]);

  const displayResetAccountModal = useCallback(() => {
    setResetModalVisible(true);
  }, []);

  const resetAccount = useCallback(() => {
    wipeTransactions();
    navigation.navigate('WalletView');
  }, [navigation]);

  const cancelResetAccount = useCallback(() => {
    setResetModalVisible(false);
  }, []);

  const handleDownloadStateLogs = useCallback(async () => {
    const fullState = ReduxService.store.getState();
    downloadStateLogs(fullState);
  }, []);

  const toggleSmartTransactionsOptInStatus = useCallback(
    (status: boolean) => {
      const { PreferencesController } = Engine.context;
      PreferencesController.setSmartTransactionsOptInStatus(status);

      trackEvent(
        createEventBuilder(MetaMetricsEvents.SMART_TRANSACTION_OPT_IN)
          .addProperties({
            stx_opt_in: status,
            location: 'Advanced Settings',
          })
          .build(),
      );
    },
    [trackEvent, createEventBuilder],
  );

  const openLinkAboutStx = useCallback(() => {
    Linking.openURL(AppConstants.URLS.SMART_TXS);
  }, []);

  const handleSetShowHexData = useCallback(
    (value: boolean) => {
      dispatch(setShowHexData(value));
    },
    [dispatch],
  );

  const handleSetShowCustomNonce = useCallback(
    (value: boolean) => {
      dispatch(setShowCustomNonce(value));
    },
    [dispatch],
  );

  const handleShowFiatOnTestnetsChange = useCallback(
    (value: boolean) => {
      if (value) {
        navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
          screen: Routes.SHEET.FIAT_ON_TESTNETS_FRICTION,
        });
      } else {
        dispatch(setShowFiatOnTestnets(false));
      }
    },
    [navigation, dispatch],
  );

  return (
    <SafeAreaView style={baseStyles.flexGrow}>
      <KeyboardAwareScrollView
        style={styles.wrapper}
        resetScrollToCoords={{ x: 0, y: 0 }}
        testID={AdvancedViewSelectorsIDs.ADVANCED_SETTINGS_SCROLLVIEW}
        ref={scrollViewRef}
      >
        <View style={styles.inner} testID={AdvancedViewSelectorsIDs.CONTAINER}>
          <ActionModal
            modalVisible={resetModalVisible}
            confirmText={strings('app_settings.reset_account_confirm_button')}
            cancelText={strings('app_settings.reset_account_cancel_button')}
            onCancelPress={cancelResetAccount}
            onRequestClose={cancelResetAccount}
            onConfirmPress={resetAccount}
          >
            <View style={styles.modalView}>
              <Text style={styles.modalTitle} variant={TextVariant.HeadingMD}>
                {strings('app_settings.reset_account_modal_title')}
              </Text>
              <Text>{strings('app_settings.reset_account_modal_message')}</Text>
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
              onPress={displayResetAccountModal}
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
                  onValueChange={toggleSmartTransactionsOptInStatus}
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
              <Button
                variant={ButtonVariants.Link}
                size={ButtonSize.Auto}
                onPress={openLinkAboutStx}
                label={strings('app_settings.smart_transactions_learn_more')}
              />
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
                  onValueChange={handleSetShowHexData}
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
                  onValueChange={handleSetShowCustomNonce}
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
                  onValueChange={handleShowFiatOnTestnetsChange}
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
              onPress={handleDownloadStateLogs}
              label={strings('app_settings.state_logs_button')}
              style={styles.accessory}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default AdvancedSettings;
