import React, { useEffect, useState, useCallback, RefObject } from 'react';
import {
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Text,
  View,
  TextInput,
  SafeAreaView,
  Platform,
} from 'react-native';
import { connect } from 'react-redux';
import StorageWrapper from '../../../store/storage-wrapper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import zxcvbn from 'zxcvbn';
import Icon from 'react-native-vector-icons/FontAwesome';
import { OutlinedTextField } from 'react-native-material-textfield';
import Clipboard from '@react-native-clipboard/clipboard';
import AppConstants from '../../../core/AppConstants';
import Device from '../../../util/device';
import {
  failedSeedPhraseRequirements,
  isValidMnemonic,
  parseSeedPhrase,
  parseVaultValue,
} from '../../../util/validators';
import Logger from '../../../util/Logger';
import {
  getPasswordStrengthWord,
  passwordRequirementsMet,
  MIN_PASSWORD_LENGTH,
} from '../../../util/password';
import { MetaMetricsEvents } from '../../../core/Analytics';

import { useTheme } from '../../../util/theme';
import { passwordSet, seedphraseBackedUp } from '../../../actions/user';
import { QRTabSwitcherScreens } from '../../../components/Views/QRTabSwitcher';
import { setLockTime } from '../../../actions/settings';
import setOnboardingWizardStep from '../../../actions/wizard';
import { strings } from '../../../../locales/i18n';
import TermsAndConditions from '../TermsAndConditions';
import { getOnboardingNavbarOptions } from '../../UI/Navbar';
import StyledButton from '../../UI/StyledButton';
import { LoginOptionsSwitch } from '../../UI/LoginOptionsSwitch';
import { ScreenshotDeterrent } from '../../UI/ScreenshotDeterrent';
import {
  BIOMETRY_CHOICE_DISABLED,
  ONBOARDING_WIZARD,
  TRUE,
  PASSCODE_DISABLED,
} from '../../../constants/storage';
import Routes from '../../../constants/navigation/Routes';

import createStyles from './styles';
import { Authentication } from '../../../core';
import AUTHENTICATION_TYPE from '../../../constants/userProperties';
import {
  passcodeType,
  updateAuthTypeStorageFlags,
} from '../../../util/authentication';
import navigateTermsOfUse from '../../../util/termsOfUse/termsOfUse';
import { ImportFromSeedSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ImportFromSeed.selectors';
import { ChoosePasswordSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ChoosePassword.selectors';
import trackOnboarding from '../../../util/metrics/TrackOnboarding/trackOnboarding';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import { Dispatch } from 'redux';

const MINIMUM_SUPPORTED_CLIPBOARD_VERSION = 9;

const PASSCODE_NOT_SET_ERROR = 'Error: Passcode not set.';
const IOS_REJECTED_BIOMETRICS_ERROR =
  'Error: The user name or passphrase you entered is not correct.';

interface ImportFromSecretRecoveryPhraseProps {
  navigation: NavigationProp<ParamListBase>;
  passwordSet: () => void;
  setLockTime: (time: number) => void;
  seedphraseBackedUp: () => void;
  setOnboardingWizardStep: (step: number) => void;
  route: RouteProp<ParamListBase>;
}

interface InputWidth {
  width: string;
}

interface QRScanResult {
  seed?: string;
}

/**
 * View where users can set restore their account
 * using a secret recovery phrase (SRP)
 * The SRP was formally called the seed phrase
 */
const ImportFromSecretRecoveryPhrase = ({
  navigation,
  passwordSet,
  setLockTime,
  seedphraseBackedUp,
  setOnboardingWizardStep,
  route,
}: ImportFromSecretRecoveryPhraseProps): React.ReactElement => {
  const { colors, themeAppearance } = useTheme();
  const styles = createStyles(colors);

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<number | undefined>();
  const [seed, setSeed] = useState<string>('');
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true);
  const [biometryChoice, setBiometryChoice] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [seedphraseInputFocused, setSeedphraseInputFocused] = useState<boolean>(false);
  const [inputWidth, setInputWidth] = useState<InputWidth>({ width: '99%' });
  const [hideSeedPhraseInput, setHideSeedPhraseInput] = useState<boolean>(true);

  const passwordInput: RefObject<TextInput> = React.createRef();
  const confirmPasswordInput: RefObject<TextInput> = React.createRef();

  const track = (event: typeof MetaMetricsEvents[keyof typeof MetaMetricsEvents], properties?: Record<string, unknown>): void => {
    const eventBuilder = MetricsEventBuilder.createEventBuilder(event);
    if (properties) {
      eventBuilder.addProperties(properties);
    }
    trackOnboarding(eventBuilder.build());
  };

  const updateNavBar = (): void => {
    navigation.setOptions(getOnboardingNavbarOptions(route, {}, colors));
  };

  useEffect(() => {
    updateNavBar();

    const setBiometricsOption = async (): Promise<void> => {
      const authData = await Authentication.getType();
      const previouslyDisabled = await StorageWrapper.getItem(
        BIOMETRY_CHOICE_DISABLED,
      );
      const passcodePreviouslyDisabled = await StorageWrapper.getItem(
        PASSCODE_DISABLED,
      );
      if (authData.currentAuthType === AUTHENTICATION_TYPE.PASSCODE) {
        setBiometryType(passcodeType(authData.currentAuthType));
        setBiometryChoice(
          !(passcodePreviouslyDisabled && passcodePreviouslyDisabled === TRUE),
        );
      } else if (authData.availableBiometryType) {
        setBiometryType(authData.availableBiometryType);
        setBiometryChoice(!(previouslyDisabled && previouslyDisabled === TRUE));
      }
    };

    setBiometricsOption();
    // Workaround https://github.com/facebook/react-native/issues/9958
    setTimeout(() => {
      setInputWidth({ width: '100%' });
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const termsOfUse = useCallback(async (): Promise<void> => {
    if (navigation) {
      await navigateTermsOfUse(navigation.navigate);
    }
  }, [navigation]);

  useEffect(() => {
    termsOfUse();
  }, [termsOfUse]);

  const updateBiometryChoice = async (biometryChoice: boolean): Promise<void> => {
    await updateAuthTypeStorageFlags(biometryChoice);
    setBiometryChoice(biometryChoice);
  };

  /**
   * This function handles the case when the user rejects the OS prompt for allowing use of biometrics.
   * If this occurs we will create the wallet automatically with password as the login method
   */
  const handleRejectedOsBiometricPrompt = async (parsedSeed: string): Promise<void> => {
    const newAuthData = await Authentication.componentAuthenticationType(
      false,
      false,
    );
    try {
      await Authentication.newWalletAndRestore(
        password,
        newAuthData,
        parsedSeed,
        true,
      );
    } catch (err) {
      setLoading(false);
      setError((err as Error).toString());
    }
    setBiometryType(newAuthData.availableBiometryType);
    updateBiometryChoice(false);
  };

  const onPressImport = async (): Promise<void> => {
    const vaultSeed = await parseVaultValue(password, seed);
    const parsedSeed = parseSeedPhrase(vaultSeed || seed);
    //Set the seed state with a valid parsed seed phrase (handle vault scenario)
    setSeed(parsedSeed);

    if (loading) return;
    track(MetaMetricsEvents.WALLET_IMPORT_ATTEMPTED);
    let importError: string | null = null;
    if (!passwordRequirementsMet(password)) {
      importError = strings('import_from_seed.password_length_error');
    } else if (password !== confirmPassword) {
      importError = strings('import_from_seed.password_dont_match');
    }

    if (failedSeedPhraseRequirements(parsedSeed)) {
      importError = strings('import_from_seed.seed_phrase_requirements');
    } else if (!isValidMnemonic(parsedSeed)) {
      importError = strings('import_from_seed.invalid_seed_phrase');
    }

    if (importError) {
      Alert.alert(strings('import_from_seed.error'), importError);
      track(MetaMetricsEvents.WALLET_SETUP_FAILURE, {
        wallet_setup_type: 'import',
        error_type: importError,
      });
    } else {
      try {
        setLoading(true);
        const authData = await Authentication.componentAuthenticationType(
          biometryChoice,
          rememberMe,
        );

        try {
          await Authentication.newWalletAndRestore(
            password,
            authData,
            parsedSeed,
            true,
          );
        } catch (err) {
          // retry faceID if the user cancels the
          if (Device.isIos && (err as Error).toString() === IOS_REJECTED_BIOMETRICS_ERROR)
            await handleRejectedOsBiometricPrompt(parsedSeed);
        }
        // Get onboarding wizard state
        const onboardingWizard = await StorageWrapper.getItem(
          ONBOARDING_WIZARD,
        );
        setLoading(false);
        passwordSet();
        setLockTime(AppConstants.DEFAULT_LOCK_TIMEOUT);
        seedphraseBackedUp();
        track(MetaMetricsEvents.WALLET_IMPORTED, {
          biometrics_enabled: Boolean(biometryType),
        });
        track(MetaMetricsEvents.WALLET_SETUP_COMPLETED, {
          wallet_setup_type: 'import',
          new_wallet: false,
        });
        !onboardingWizard && setOnboardingWizardStep(1);
        navigation.reset({
          index: 1,
          routes: [{ name: Routes.ONBOARDING.SUCCESS_FLOW }],
        });
      } catch (catchError) {
        // Should we force people to enable passcode / biometrics?
        if ((catchError as Error).toString() === PASSCODE_NOT_SET_ERROR) {
          Alert.alert(
            'Security Alert',
            'In order to proceed, you need to turn Passcode on or any biometrics authentication method supported in your device (FaceID, TouchID or Fingerprint)',
          );
          setLoading(false);
        } else {
          setLoading(false);
          setError((catchError as Error).message);
          Logger.log('Error with seed phrase import', (catchError as Error).message);
        }
        track(MetaMetricsEvents.WALLET_SETUP_FAILURE, {
          wallet_setup_type: 'import',
          error_type: (catchError as Error).toString(),
        });
      }
    }
  };

  const clearSecretRecoveryPhrase = async (seedValue: string): Promise<void> => {
    // get clipboard contents
    const clipboardContents = await Clipboard.getString();
    const parsedClipboardContents = parseSeedPhrase(clipboardContents);
    if (
      // only clear clipboard if contents isValidMnemonic
      !failedSeedPhraseRequirements(parsedClipboardContents) &&
      isValidMnemonic(parsedClipboardContents) &&
      // only clear clipboard if the seed phrase entered matches what's in the clipboard
      parseSeedPhrase(seedValue) === parsedClipboardContents
    ) {
      await Clipboard.clearString();
    }
  };

  const onSeedWordsChange = useCallback(async (seedValue: string): Promise<void> => {
    setSeed(seedValue);
    // Only clear on android since iOS will notify users when we getString()
    if (Device.isAndroid()) {
      const androidOSVersion = parseInt(Platform.constants.Release as string, 10);
      // This conditional is necessary to avoid an error in Android 8.1.0 or lower
      if (androidOSVersion >= MINIMUM_SUPPORTED_CLIPBOARD_VERSION) {
        await clearSecretRecoveryPhrase(seedValue);
      }
    }
  }, []);

  const onPasswordChange = (value: string): void => {
    const passInfo = zxcvbn(value);

    setPassword(value);
    setPasswordStrength(passInfo.score);
  };

  const onPasswordConfirmChange = (value: string): void => {
    setConfirmPassword(value);
  };

  const jumpToPassword = useCallback((): void => {
    const { current } = passwordInput;
    current && current.focus();
  }, [passwordInput]);

  const jumpToConfirmPassword = (): void => {
    const { current } = confirmPasswordInput;
    current && current.focus();
  };

  const renderSwitch = (): React.ReactNode => {
    const handleUpdateRememberMe = (rememberMeValue: boolean): void => {
      setRememberMe(rememberMeValue);
    };
    return (
      <LoginOptionsSwitch
        shouldRenderBiometricOption={biometryType}
        biometryChoiceState={biometryChoice}
        onUpdateBiometryChoice={updateBiometryChoice}
        onUpdateRememberMe={handleUpdateRememberMe}
      />
    );
  };

  const toggleShowHide = (): void => {
    setSecureTextEntry(!secureTextEntry);
  };

  const toggleHideSeedPhraseInput = useCallback((): void => {
    setHideSeedPhraseInput(!hideSeedPhraseInput);
  }, [hideSeedPhraseInput]);

  const onQrCodePress = useCallback((): void => {
    let shouldHideSRP = true;
    if (!hideSeedPhraseInput) {
      shouldHideSRP = false;
    }

    setHideSeedPhraseInput(false);
    navigation.navigate(Routes.QR_TAB_SWITCHER, {
      initialScreen: QRTabSwitcherScreens.Scanner,
      disableTabber: true,
      onScanSuccess: ({ seed: scannedSeed = undefined }: QRScanResult) => {
        if (scannedSeed) {
          setSeed(scannedSeed);
        } else {
          Alert.alert(
            strings('import_from_seed.invalid_qr_code_title'),
            strings('import_from_seed.invalid_qr_code_message'),
          );
        }
        setHideSeedPhraseInput(shouldHideSRP);
      },
      onScanError: () => {
        setHideSeedPhraseInput(shouldHideSRP);
      },
    });
  }, [hideSeedPhraseInput, navigation]);

  const passwordStrengthWord = getPasswordStrengthWord(passwordStrength);

  const hiddenSRPInput = useCallback(
    () => (
      <OutlinedTextField
        style={styles.input}
        containerStyle={inputWidth}
        inputContainerStyle={styles.padding}
        placeholder={strings('import_from_seed.seed_phrase_placeholder')}
        testID={ImportFromSeedSelectorsIDs.SEED_PHRASE_INPUT_ID}
        placeholderTextColor={colors.text.muted}
        returnKeyType="next"
        autoCapitalize="none"
        secureTextEntry={hideSeedPhraseInput}
        onChangeText={onSeedWordsChange}
        value={seed}
        baseColor={colors.border.default}
        tintColor={colors.primary.default}
        onSubmitEditing={jumpToPassword}
        keyboardAppearance={themeAppearance || 'light'}
      />
    ),
    [
      colors.border.default,
      colors.primary.default,
      colors.text.muted,
      hideSeedPhraseInput,
      inputWidth,
      jumpToPassword,
      onSeedWordsChange,
      seed,
      styles.input,
      styles.padding,
      themeAppearance,
    ],
  );

  return (
    <SafeAreaView style={styles.mainWrapper}>
      <KeyboardAwareScrollView
        style={styles.wrapper}
        resetScrollToCoords={{ x: 0, y: 0 }}
      >
        <View testID={ImportFromSeedSelectorsIDs.CONTAINER_ID}>
          <Text
            style={styles.title}
            testID={ImportFromSeedSelectorsIDs.SCREEN_TITLE_ID}
          >
            {strings('import_from_seed.title')}
          </Text>
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.label}>
                {strings('choose_password.seed_phrase')}
              </Text>
            </View>
            <View style={[styles.fieldCol, styles.fieldColRight]}>
              <TouchableOpacity onPress={toggleHideSeedPhraseInput}>
                <Text style={styles.label}>
                  {strings(
                    `choose_password.${hideSeedPhraseInput ? 'show' : 'hide'}`,
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {hideSeedPhraseInput ? (
            hiddenSRPInput()
          ) : (
            <TextInput
              value={seed}
              numberOfLines={3}
              style={[
                styles.seedPhrase,
                inputWidth,
                seedphraseInputFocused && styles.inputFocused,
              ]}
              secureTextEntry
              multiline={!hideSeedPhraseInput}
              placeholder={strings('import_from_seed.seed_phrase_placeholder')}
              placeholderTextColor={colors.text.muted}
              onChangeText={onSeedWordsChange}
              blurOnSubmit
              onSubmitEditing={jumpToPassword}
              returnKeyType="next"
              keyboardType={
                (!hideSeedPhraseInput &&
                  Device.isAndroid() &&
                  'visible-password') ||
                'default'
              }
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={
                (() =>
                  !hideSeedPhraseInput &&
                  setSeedphraseInputFocused(!seedphraseInputFocused)) || undefined
              }
              onBlur={
                (() =>
                  !hideSeedPhraseInput &&
                  setSeedphraseInputFocused(!seedphraseInputFocused)) || undefined
              }
              keyboardAppearance={themeAppearance || 'light'}
            />
          )}
          <TouchableOpacity style={styles.qrCode} onPress={onQrCodePress}>
            <Icon name="qrcode" size={20} color={colors.icon.default} />
          </TouchableOpacity>
          <View style={styles.field}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Text style={styles.label}>
                  {strings('import_from_seed.new_password')}
                </Text>
              </View>
              <View style={[styles.fieldCol, styles.fieldColRight]}>
                <TouchableOpacity onPress={toggleShowHide}>
                  <Text style={styles.label}>
                    {strings(
                      `choose_password.${secureTextEntry ? 'show' : 'hide'}`,
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <OutlinedTextField
              style={styles.input}
              containerStyle={inputWidth}
              testID={ChoosePasswordSelectorsIDs.NEW_PASSWORD_INPUT_ID}
              placeholder={strings('import_from_seed.new_password')}
              placeholderTextColor={colors.text.muted}
              returnKeyType={'next'}
              autoCapitalize="none"
              secureTextEntry={secureTextEntry}
              onChangeText={onPasswordChange}
              value={password}
              baseColor={colors.border.default}
              tintColor={colors.primary.default}
              onSubmitEditing={jumpToConfirmPassword}
              keyboardAppearance={themeAppearance || 'light'}
            />

            {(password !== '' && (
              <Text
                style={styles.passwordStrengthLabel}
                testID={ImportFromSeedSelectorsIDs.PASSWORD_STRENGTH_ID}
              >
                {strings('choose_password.password_strength')}
                <Text style={styles[`strength_${passwordStrengthWord}` as keyof typeof styles]}>
                  {' '}
                  {strings(`choose_password.strength_${passwordStrengthWord}`)}
                </Text>
              </Text>
            )) || <Text style={styles.passwordStrengthLabel} />}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {strings('import_from_seed.confirm_password')}
            </Text>
            <OutlinedTextField
              style={styles.input}
              containerStyle={inputWidth}
              testID={ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID}
              onChangeText={onPasswordConfirmChange}
              returnKeyType={'next'}
              autoCapitalize="none"
              secureTextEntry={secureTextEntry}
              placeholder={strings('import_from_seed.confirm_password')}
              value={confirmPassword}
              baseColor={colors.border.default}
              tintColor={colors.primary.default}
              onSubmitEditing={onPressImport}
              placeholderTextColor={colors.text.muted}
              keyboardAppearance={themeAppearance || 'light'}
            />

            <View style={styles.showMatchingPasswords}>
              {password !== '' && password === confirmPassword ? (
                <Icon
                  name="check"
                  size={12}
                  color={colors.success.default}
                  testID={
                    ImportFromSeedSelectorsIDs.CONFIRM_PASSWORD_CHECK_ICON_ID
                  }
                />
              ) : null}
            </View>
            <Text style={styles.passwordStrengthLabel}>
              {strings('choose_password.must_be_at_least', {
                number: MIN_PASSWORD_LENGTH,
              })}
            </Text>
          </View>

          {renderSwitch()}

          {!!error && (
            <Text
              style={styles.errorMsg}
              testID={
                ImportFromSeedSelectorsIDs.INVALID_SEED_PHRASE_PLACE_HOLDER_TEXT
              }
            >
              {error}
            </Text>
          )}

          <View style={styles.ctaWrapper}>
            <StyledButton
              type={'blue'}
              onPress={onPressImport}
              testID={ImportFromSeedSelectorsIDs.SUBMIT_BUTTON_ID}
              disabled={!(password !== '' && password === confirmPassword)}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary.inverse}
                />
              ) : (
                strings('import_from_seed.import_button')
              )}
            </StyledButton>
          </View>
        </View>
      </KeyboardAwareScrollView>
      <View style={styles.termsAndConditions}>
        <TermsAndConditions
          navigation={navigation}
          action={strings('import_from_seed.import_button')}
        />
      </View>
      <ScreenshotDeterrent enabled isSRP />
    </SafeAreaView>
  );
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setLockTime: (time: number) => dispatch(setLockTime(time)),
  setOnboardingWizardStep: (step: number) => dispatch(setOnboardingWizardStep(step)),
  passwordSet: () => dispatch(passwordSet()),
  seedphraseBackedUp: () => dispatch(seedphraseBackedUp()),
});

export default connect(
  null,
  mapDispatchToProps,
)(ImportFromSecretRecoveryPhrase);
