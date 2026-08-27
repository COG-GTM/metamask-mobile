/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Appearance,
} from 'react-native';
import { connect } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import FeatherIcons from 'react-native-vector-icons/Feather';
import { BlurView } from '@react-native-community/blur';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import Logger from '../../../util/Logger';
import { baseStyles } from '../../../styles/common';
import StyledButton from '../../UI/StyledButton';
import OnboardingProgress from '../../UI/OnboardingProgress';
import { strings } from '../../../../locales/i18n';
import ActionView from '../../UI/ActionView';
import Engine from '../../../core/Engine';
import { getOnboardingNavbarOptions } from '../../UI/Navbar';
import { ScreenshotDeterrent } from '../../UI/ScreenshotDeterrent';
import {
  MANUAL_BACKUP_STEPS,
  SEED_PHRASE,
  CONFIRM_PASSWORD,
  WRONG_PASSWORD_ERROR,
} from '../../../constants/onboarding';
import { useTheme } from '../../../util/theme';
import { uint8ArrayToMnemonic } from '../../../util/mnemonic';
import { createStyles } from './styles';

import { MetaMetricsEvents } from '../../../core/Analytics';
import { Authentication } from '../../../core';
import { ManualBackUpStepsSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ManualBackUpSteps.selectors';
import trackOnboarding from '../../../util/metrics/TrackOnboarding/trackOnboarding';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';

/**
 * View that's shown during the second step of
 * the backup seed phrase flow
 */
const ManualBackupStep1 = ({
  route,
  navigation,
  appTheme,
}: ManualBackupStep1Props) => {
  const [seedPhraseHidden, setSeedPhraseHidden] = useState(true);

  const [password, setPassword] = useState(undefined);
  const [warningIncorrectPassword, setWarningIncorrectPassword] =
    useState(undefined);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState(SEED_PHRASE);
  const [words, setWords] = useState([]);

  const { colors, themeAppearance } = useTheme();
  const styles = createStyles(colors);

  const currentStep = 1;
  const steps = MANUAL_BACKUP_STEPS;

  const updateNavBar = useCallback(() => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    navigation.setOptions(
      getOnboardingNavbarOptions(route as any, {}, colors),
    );
  }, [colors, navigation, route]);

  // @ts-expect-error -- legacy JavaScript UI type boundary
  const tryExportSeedPhrase = async (password) => {
    const { KeyringController } = Engine.context;
    const uint8ArrayMnemonic = await KeyringController.exportSeedPhrase(
      password,
    );
    return uint8ArrayToMnemonic(uint8ArrayMnemonic, wordlist).split(' ');
  };

  useEffect(() => {
    const getSeedphrase = async () => {
      if (!words.length) {
        try {
          const credentials = await Authentication.getPassword();
          if (credentials) {
            // @ts-expect-error -- legacy JavaScript UI type boundary
            setWords(await tryExportSeedPhrase(credentials.password));
          } else {
            // @ts-expect-error -- legacy JavaScript UI type boundary
            setView(CONFIRM_PASSWORD);
          }
        } catch (e) {
          const srpRecoveryError = new Error(
            'Error trying to recover SRP from keyring-controller',
          );
          Logger.error(srpRecoveryError);
          // @ts-expect-error -- legacy JavaScript UI type boundary
          setView(CONFIRM_PASSWORD);
        }
      }
    };

    getSeedphrase();
    setWords((route as any).params?.words ?? []);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateNavBar();
  }, [updateNavBar]);

  // @ts-expect-error -- legacy JavaScript UI type boundary
  const onPasswordChange = (password) => {
    setPassword(password);
  };

  const goNext = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    navigation.navigate('ManualBackupStep2', {
      words,
      steps,
    });
  };

  const revealSeedPhrase = () => {
    setSeedPhraseHidden(false);
    trackOnboarding(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.WALLET_SECURITY_PHRASE_REVEALED,
      ).build(),
    );
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  const tryUnlockWithPassword = async (password) => {
    setReady(false);
    try {
      const seedPhrase = await tryExportSeedPhrase(password);
      // @ts-expect-error -- legacy JavaScript UI type boundary
      setWords(seedPhrase);
      setView(SEED_PHRASE);
      setReady(true);
    } catch (e) {
      let msg = strings('reveal_credential.warning_incorrect_password');
      // @ts-expect-error -- legacy JavaScript UI type boundary
      if (e.toString().toLowerCase() !== WRONG_PASSWORD_ERROR.toLowerCase()) {
        msg = strings('reveal_credential.unknown_error');
      }
      setWarningIncorrectPassword(msg);
      setReady(true);
    }
  };

  const tryUnlock = () => {
    tryUnlockWithPassword(password);
  };

  const getBlurType = () => {
    let blurType = 'light';
    switch (appTheme) {
      case 'light':
        blurType = 'light';
        break;
      case 'dark':
        blurType = 'dark';
        break;
      case 'os':
        // @ts-expect-error -- legacy JavaScript UI type boundary
        blurType = Appearance.getColorScheme();
        break;
      default:
        blurType = 'light';
    }
    return blurType;
  };

  const renderSeedPhraseConcealer = () => {
    const blurType = getBlurType();

    return (
      <View style={styles.seedPhraseConcealerContainer}>
        {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
        <BlurView blurType={blurType} blurAmount={5} style={styles.blurView} />
        <View style={styles.seedPhraseConcealer}>
          <FeatherIcons name="eye-off" size={24} style={styles.icon} />
          <Text style={styles.reveal}>
            {strings('manual_backup_step_1.reveal')}
          </Text>
          <Text style={styles.watching}>
            {strings('manual_backup_step_1.watching')}
          </Text>
          {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
          <View style={styles.viewButtonWrapper}>
            <StyledButton
              type={'onOverlay'}
              onPress={revealSeedPhrase}
              testID={ManualBackUpStepsSelectorsIDs.VIEW_BUTTON}
              containerStyle={styles.viewButtonContainer}
            >
              {strings('manual_backup_step_1.view')}
            </StyledButton>
          </View>
        </View>
      </View>
    );
  };

  const renderConfirmPassword = () => (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={'padding'}
    >
      <KeyboardAwareScrollView style={baseStyles.flexGrow} enableOnAndroid>
        <View style={styles.confirmPasswordWrapper}>
          <View style={[styles.content, styles.passwordRequiredContent]}>
            <Text style={styles.title}>
              {strings('manual_backup_step_1.confirm_password')}
            </Text>
            <View style={styles.text}>
              <Text style={styles.label}>
                {strings('manual_backup_step_1.before_continiuing')}
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder={'Password'}
              placeholderTextColor={colors.text.muted}
              onChangeText={onPasswordChange}
              secureTextEntry
              onSubmitEditing={tryUnlock}
              testID={ManualBackUpStepsSelectorsIDs.CONFIRM_PASSWORD_INPUT}
              keyboardAppearance={themeAppearance}
              autoCapitalize="none"
            />
            {warningIncorrectPassword && (
              <Text style={styles.warningMessageText}>
                {warningIncorrectPassword}
              </Text>
            )}
          </View>
          <View style={styles.buttonWrapper}>
            <StyledButton
              // @ts-expect-error -- legacy JavaScript UI type boundary
              containerStyle={styles.button}
              type={'confirm'}
              onPress={tryUnlock}
              testID={ManualBackUpStepsSelectorsIDs.SUBMIT_BUTTON}
            >
              {strings('manual_backup_step_1.confirm')}
            </StyledButton>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );

  const renderSeedphraseView = () => {
    const wordLength = words.length;
    const half = wordLength / 2 || 6;

    return (
      <ActionView
        confirmTestID={ManualBackUpStepsSelectorsIDs.CONTINUE_BUTTON}
        confirmText={strings('manual_backup_step_1.continue')}
        onConfirmPress={goNext}
        confirmDisabled={seedPhraseHidden}
        showCancelButton={false}
        confirmButtonMode={'confirm'}
      >
        <View
          style={styles.wrapper}
          testID={ManualBackUpStepsSelectorsIDs.STEP_1_CONTAINER}
        >
          <Text style={styles.action}>
            {strings('manual_backup_step_1.action')}
          </Text>
          <View style={styles.infoWrapper}>
            <Text style={styles.info}>
              {strings('manual_backup_step_1.info')}
            </Text>
          </View>
          <View style={styles.seedPhraseWrapper}>
            {seedPhraseHidden ? (
              renderSeedPhraseConcealer()
            ) : (
              <React.Fragment>
                <View style={styles.wordColumn}>
                  {words.slice(0, half).map((word, i) => (
                    <View key={`word_${i}`} style={styles.wordWrapper}>
                      <Text style={styles.word}>{`${i + 1}. ${word}`}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.wordColumn}>
                  {words.slice(-half).map((word, i) => (
                    <View key={`word_${i}`} style={styles.wordWrapper}>
                      <Text style={styles.word}>{`${
                        i + (half + 1)
                      }. ${word}`}</Text>
                    </View>
                  ))}
                </View>
                <ScreenshotDeterrent enabled isSRP />
              </React.Fragment>
            )}
          </View>
        </View>
      </ActionView>
    );
  };

  return ready ? (
    <SafeAreaView style={styles.mainWrapper}>
      <View style={styles.onBoardingWrapper}>
        {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
        <OnboardingProgress currentStep={currentStep} steps={steps} />
      </View>
      {view === SEED_PHRASE ? renderSeedphraseView() : renderConfirmPassword()}
    </SafeAreaView>
  ) : (
    <View style={styles.loader}>
      <ActivityIndicator size="small" />
    </View>
  );
};

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapStateToProps = (state) => ({
  appTheme: state.user.appTheme,
});

export default connect(mapStateToProps)(ManualBackupStep1);

interface ManualBackupStep1Props {
  appTheme?: string;
  navigation?: Record<string, any>;
  route?: Record<string, any>;
}
