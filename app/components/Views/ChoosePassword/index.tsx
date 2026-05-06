import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  TextInput,
  SafeAreaView,
  StyleSheet,
  Image,
  TextStyle,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Theme } from '@metamask/design-tokens';
import { connect } from 'react-redux';
import zxcvbn from 'zxcvbn';
import Icon from 'react-native-vector-icons/FontAwesome';
import Text, {
  TextColor,
  TextVariant,
} from '../../../component-library/components/Texts/Text';
import StorageWrapper from '../../../store/storage-wrapper';
import {
  passwordSet,
  passwordUnset,
  seedphraseNotBackedUp,
} from '../../../actions/user';
import { setLockTime } from '../../../actions/settings';
import StyledButton from '../../UI/StyledButton';
import Engine from '../../../core/Engine';
import Device from '../../../util/device';
import {
  passcodeType,
  updateAuthTypeStorageFlags,
} from '../../../util/authentication';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import { getOnboardingNavbarOptions } from '../../UI/Navbar';
import AppConstants from '../../../core/AppConstants';
import OnboardingProgress from '../../UI/OnboardingProgress';
import Logger from '../../../util/Logger';
import { ONBOARDING, PREVIOUS_SCREEN } from '../../../constants/navigation';
import {
  EXISTING_USER,
  TRUE,
  SEED_PHRASE_HINTS,
  BIOMETRY_CHOICE_DISABLED,
  PASSCODE_DISABLED,
} from '../../../constants/storage';
import {
  getPasswordStrengthWord,
  passwordRequirementsMet,
  MIN_PASSWORD_LENGTH,
} from '../../../util/password';

import { CHOOSE_PASSWORD_STEPS } from '../../../constants/onboarding';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { Authentication } from '../../../core';
import AUTHENTICATION_TYPE from '../../../constants/userProperties';
import { ThemeContext, mockTheme } from '../../../util/theme';

import { LoginOptionsSwitch } from '../../UI/LoginOptionsSwitch';
import navigateTermsOfUse from '../../../util/termsOfUse/termsOfUse';
import { ChoosePasswordSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ChoosePassword.selectors';
import trackOnboarding from '../../../util/metrics/TrackOnboarding/trackOnboarding';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    mainWrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    } as ViewStyle,
    wrapper: {
      flex: 1,
      marginBottom: 10,
      marginTop: 16,
    } as ViewStyle,
    scrollableWrapper: {
      flex: 1,
      paddingHorizontal: 32,
    } as ViewStyle,
    keyboardScrollableWrapper: {
      flexGrow: 1,
    } as ViewStyle,
    loadingWrapper: {
      paddingHorizontal: 40,
      paddingBottom: 30,
      alignItems: 'center',
      flex: 1,
    } as ViewStyle,
    foxWrapper: {
      width: Device.isIos() ? 90 : 80,
      height: Device.isIos() ? 90 : 80,
      marginTop: 30,
      marginBottom: 30,
    } as ViewStyle,
    image: {
      alignSelf: 'center',
      width: 80,
      height: 80,
    } as ImageStyle,
    content: {
      textAlign: 'center',
      alignItems: 'center',
    } as TextStyle,
    title: {
      marginTop: 20,
      marginBottom: 20,
      justifyContent: 'center',
      textAlign: 'center',
    } as TextStyle,
    subtitle: {
      textAlign: 'center',
    } as TextStyle,
    text: {
      marginBottom: 10,
      justifyContent: 'center',
      ...fontStyles.normal,
    } as TextStyle,
    checkboxContainer: {
      marginTop: 10,
      marginHorizontal: 10,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    } as ViewStyle,
    checkbox: {
      width: 18,
      height: 18,
      margin: 10,
      marginTop: -5,
    } as ViewStyle,
    label: {
      paddingHorizontal: 10,
    } as TextStyle,
    learnMore: {
      textDecorationLine: 'underline',
      textDecorationColor: colors.primary.default,
    } as TextStyle,
    field: {
      marginVertical: 5,
      position: 'relative',
    } as ViewStyle,
    input: {
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: 10,
      borderRadius: 6,
      fontSize: 14,
      height: 50,
      ...fontStyles.normal,
      color: colors.text.default,
    } as TextStyle,
    ctaWrapper: {
      flex: 1,
      marginTop: 20,
      paddingHorizontal: 10,
    } as ViewStyle,
    biometrics: {
      position: 'relative',
      marginTop: 20,
      marginBottom: 30,
    } as ViewStyle,
    biometryLabel: {
      flex: 1,
      fontSize: 16,
      color: colors.text.default,
      ...fontStyles.normal,
    } as TextStyle,
    biometrySwitch: {
      position: 'absolute',
      top: 0,
      right: 0,
    } as ViewStyle,
    passwordStrengthLabel: {
      marginTop: 10,
    } as TextStyle,
    showPassword: {
      position: 'absolute',
      top: 0,
      right: 0,
    } as TextStyle,
    // eslint-disable-next-line react-native/no-unused-styles
    strength_weak: {
      color: colors.error.default,
    } as TextStyle,
    // eslint-disable-next-line react-native/no-unused-styles
    strength_good: {
      color: colors.primary.default,
    } as TextStyle,
    // eslint-disable-next-line react-native/no-unused-styles
    strength_strong: {
      color: colors.success.default,
    } as TextStyle,
    showMatchingPasswords: {
      position: 'absolute',
      top: 36,
      right: 10,
      alignSelf: 'flex-end',
    } as ViewStyle,
  });

const PASSCODE_NOT_SET_ERROR = 'Error: Passcode not set.';

interface ChoosePasswordOwnProps {
  // The navigator object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
  // Object that represents the current route info like params passed to it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route?: any;
}

interface ChoosePasswordDispatchProps {
  passwordSet: () => void;
  passwordUnset: () => void;
  setLockTime: (time: number) => void;
  seedphraseNotBackedUp: () => void;
}

type ChoosePasswordProps = ChoosePasswordOwnProps &
  ChoosePasswordDispatchProps;

interface ChoosePasswordState {
  isSelected: boolean;
  password: string;
  confirmPassword: string;
  secureTextEntry: boolean;
  biometryType: string | null | undefined;
  biometryChoice: boolean;
  rememberMe: boolean;
  loading: boolean;
  error: string | null;
  inputWidth: { width: string };
  passwordStrength?: number;
}

/**
 * View where users can set their password for the first time
 */
class ChoosePassword extends PureComponent<
  ChoosePasswordProps,
  ChoosePasswordState
> {
  state: ChoosePasswordState = {
    isSelected: false,
    password: '',
    confirmPassword: '',
    secureTextEntry: true,
    biometryType: null,
    biometryChoice: false,
    rememberMe: false,
    loading: false,
    error: null,
    inputWidth: { width: '99%' },
  };

  mounted = true;

  confirmPasswordInput = React.createRef<TextInput>();
  // Flag to know if password in keyring was set or not
  keyringControllerPasswordSet = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  track = (event: any, properties?: any) => {
    const eventBuilder = MetricsEventBuilder.createEventBuilder(event);
    if (properties) {
      eventBuilder.addProperties(properties);
    }
    trackOnboarding(eventBuilder.build());
  };

  updateNavBar = () => {
    const { route, navigation } = this.props;
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    navigation.setOptions(
      getOnboardingNavbarOptions(route, {} as never, colors),
    );
  };

  termsOfUse = async () => {
    if (this.props.navigation) {
      await navigateTermsOfUse(
        this.props.navigation.navigate as (...args: unknown[]) => unknown,
      );
    }
  };

  async componentDidMount() {
    const authData = await Authentication.getType();
    const previouslyDisabled = await StorageWrapper.getItem(
      BIOMETRY_CHOICE_DISABLED,
    );
    const passcodePreviouslyDisabled = await StorageWrapper.getItem(
      PASSCODE_DISABLED,
    );
    if (authData.currentAuthType === AUTHENTICATION_TYPE.PASSCODE) {
      this.setState({
        biometryType: passcodeType(authData.currentAuthType),
        biometryChoice: !(
          passcodePreviouslyDisabled && passcodePreviouslyDisabled === TRUE
        ),
      });
    } else if (authData.availableBiometryType) {
      this.setState({
        biometryType: authData.availableBiometryType,
        biometryChoice: !(previouslyDisabled && previouslyDisabled === TRUE),
      });
    }
    this.updateNavBar();
    setTimeout(() => {
      this.setState({
        inputWidth: { width: '100%' },
      });
    }, 100);
    this.termsOfUse();
  }

  componentDidUpdate(
    _prevProps: ChoosePasswordProps,
    prevState: ChoosePasswordState,
  ) {
    this.updateNavBar();
    const prevLoading = prevState.loading;
    const { loading } = this.state;
    const { navigation } = this.props;
    if (!prevLoading && loading) {
      // update navigationOptions
      navigation.setParams({
        headerLeft: () => <View />,
      });
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  setSelection = () => {
    const { isSelected } = this.state;
    this.setState(() => ({ isSelected: !isSelected }));
  };

  onPressCreate = async () => {
    const { loading, isSelected, password, confirmPassword } = this.state;
    const passwordsMatch = password !== '' && password === confirmPassword;
    const canSubmit = passwordsMatch && isSelected;

    if (!canSubmit) return;
    if (loading) return;
    if (!passwordRequirementsMet(password)) {
      Alert.alert('Error', strings('choose_password.password_length_error'));
      return;
    } else if (password !== confirmPassword) {
      Alert.alert('Error', strings('choose_password.password_dont_match'));
      return;
    }
    this.track(MetaMetricsEvents.WALLET_CREATION_ATTEMPTED);

    try {
      this.setState({ loading: true });
      const previous_screen = this.props.route.params?.[PREVIOUS_SCREEN];

      const authType = await Authentication.componentAuthenticationType(
        this.state.biometryChoice,
        this.state.rememberMe,
      );

      if (previous_screen === ONBOARDING) {
        try {
          await Authentication.newWalletAndKeychain(password, authType);
        } catch (error) {
          if (Device.isIos()) await this.handleRejectedOsBiometricPrompt();
        }
        this.keyringControllerPasswordSet = true;
        this.props.seedphraseNotBackedUp();
      } else {
        await this.recreateVault(password, authType);
      }

      this.props.passwordSet();
      this.props.setLockTime(AppConstants.DEFAULT_LOCK_TIMEOUT);
      this.setState({ loading: false });
      this.props.navigation.replace('AccountBackupStep1');
      this.track(MetaMetricsEvents.WALLET_CREATED, {
        biometrics_enabled: Boolean(this.state.biometryType),
      });
      this.track(MetaMetricsEvents.WALLET_SETUP_COMPLETED, {
        wallet_setup_type: 'new',
        new_wallet: true,
      });
    } catch (error) {
      try {
        await this.recreateVault('');
      } catch (e) {
        Logger.error(e as Error);
      }
      // Set state in app as it was with no password
      await StorageWrapper.setItem(EXISTING_USER, TRUE);
      await StorageWrapper.removeItem(SEED_PHRASE_HINTS);
      this.props.passwordUnset();
      this.props.setLockTime(-1);
      const errorString = (error as Error).toString();
      // Should we force people to enable passcode / biometrics?
      if (errorString === PASSCODE_NOT_SET_ERROR) {
        Alert.alert(
          strings('choose_password.security_alert_title'),
          strings('choose_password.security_alert_message'),
        );
        this.setState({ loading: false });
      } else {
        this.setState({ loading: false, error: errorString });
      }
      this.track(MetaMetricsEvents.WALLET_SETUP_FAILURE, {
        wallet_setup_type: 'new',
        error_type: errorString,
      });
    }
  };

  /**
   * This function handles the case when the user rejects the OS prompt for allowing use of biometrics.
   * If this occurs we will create the wallet automatically with password as the login method
   */
  handleRejectedOsBiometricPrompt = async () => {
    const newAuthData = await Authentication.componentAuthenticationType(
      false,
      false,
    );
    try {
      await Authentication.newWalletAndKeychain(
        this.state.password,
        newAuthData,
      );
    } catch (err) {
      throw Error(strings('choose_password.disable_biometric_error'));
    }
    this.setState({
      biometryType: newAuthData.availableBiometryType,
      biometryChoice: false,
    });
  };

  /**
   * Recreates a vault
   *
   * @param password - Password to recreate and set the vault with
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recreateVault = async (password: string, authType?: any) => {
    const { KeyringController } = Engine.context;
    const seedPhrase = (await this.getSeedPhrase()) as unknown as string;
    let importedAccounts: string[] = [];
    try {
      const keychainPassword = this.keyringControllerPasswordSet
        ? this.state.password
        : '';
      // Get imported accounts
      const simpleKeyrings = (
        KeyringController.state.keyrings as {
          type: string;
          accounts: string[];
        }[]
      ).filter((keyring) => keyring.type === 'Simple Key Pair');
      for (let i = 0; i < simpleKeyrings.length; i++) {
        const simpleKeyring = simpleKeyrings[i];
        const simpleKeyringAccounts = await Promise.all(
          simpleKeyring.accounts.map((account) =>
            (
              KeyringController as unknown as {
                exportAccount: (
                  password: string,
                  account: string,
                ) => Promise<string>;
              }
            ).exportAccount(keychainPassword, account),
          ),
        );
        importedAccounts = [...importedAccounts, ...simpleKeyringAccounts];
      }
    } catch (e) {
      Logger.error(
        e as Error,
        'error while trying to get imported accounts on recreate vault',
      );
    }

    // Recreate keyring with password given to this method
    await Authentication.newWalletAndRestore(
      password,
      authType as never,
      seedPhrase,
      true,
    );
    // Keyring is set with empty password or not
    this.keyringControllerPasswordSet = password !== '';

    // Get props to restore vault
    const hdKeyring = (
      KeyringController.state.keyrings as { accounts: string[] }[]
    )[0];
    const existingAccountCount = hdKeyring.accounts.length;

    // Create previous accounts again
    for (let i = 0; i < existingAccountCount - 1; i++) {
      await KeyringController.addNewAccount();
    }

    try {
      // Import imported accounts again
      for (let i = 0; i < importedAccounts.length; i++) {
        await KeyringController.importAccountWithStrategy(
          'privateKey' as never,
          [importedAccounts[i]] as never,
        );
      }
    } catch (e) {
      Logger.error(
        e as Error,
        'error while trying to import accounts on recreate vault',
      );
    }
  };

  /**
   * Returns current vault seed phrase
   * It does it using an empty password or a password set by the user
   * depending on the state the app is currently in
   */
  getSeedPhrase = async () => {
    const { KeyringController } = Engine.context;
    const { password } = this.state;
    const keychainPassword = this.keyringControllerPasswordSet ? password : '';
    return await KeyringController.exportSeedPhrase(keychainPassword);
  };

  jumpToConfirmPassword = () => {
    const { current } = this.confirmPasswordInput;
    current && current.focus();
  };

  updateBiometryChoice = async (biometryChoice: boolean) => {
    await updateAuthTypeStorageFlags(biometryChoice);
    this.setState({ biometryChoice });
  };

  renderSwitch = () => {
    const { biometryType, biometryChoice } = this.state;
    const handleUpdateRememberMe = (rememberMe: boolean) => {
      this.setState({ rememberMe });
    };
    return (
      <LoginOptionsSwitch
        shouldRenderBiometricOption={biometryType ?? null}
        biometryChoiceState={biometryChoice}
        onUpdateBiometryChoice={this.updateBiometryChoice}
        onUpdateRememberMe={handleUpdateRememberMe}
      />
    );
  };

  onPasswordChange = (val: string) => {
    const passInfo = zxcvbn(val);

    this.setState({ password: val, passwordStrength: passInfo.score });
  };

  toggleShowHide = () => {
    this.setState((state) => ({ secureTextEntry: !state.secureTextEntry }));
  };

  learnMore = () => {
    this.props.navigation.push('Webview', {
      screen: 'SimpleWebview',
      params: {
        url: 'https://support.metamask.io/managing-my-wallet/resetting-deleting-and-restoring/how-can-i-reset-my-password/',
        title: 'support.metamask.io',
      },
    });
  };

  setConfirmPassword = (val: string) => this.setState({ confirmPassword: val });

  render() {
    const {
      isSelected,
      inputWidth,
      password,
      passwordStrength,
      confirmPassword,
      secureTextEntry,
      error,
      loading,
    } = this.state;
    const passwordsMatch = password !== '' && password === confirmPassword;
    const canSubmit = passwordsMatch && isSelected;
    const previousScreen = this.props.route.params?.[PREVIOUS_SCREEN];
    const passwordStrengthWord = getPasswordStrengthWord(
      passwordStrength as number,
    );
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    const themeAppearance =
      (this.context as unknown as { themeAppearance?: string })
        ?.themeAppearance || 'light';
    const styles = createStyles(colors);

    return (
      <SafeAreaView style={styles.mainWrapper}>
        {loading ? (
          <View style={styles.loadingWrapper}>
            <View style={styles.foxWrapper}>
              <Image
                source={require('../../../images/branding/fox.png')}
                style={styles.image}
                resizeMethod={'auto'}
              />
            </View>
            <ActivityIndicator size="large" color={colors.text.default} />
            <Text variant={TextVariant.HeadingLG} style={styles.title}>
              {strings(
                previousScreen === ONBOARDING
                  ? 'create_wallet.title'
                  : 'secure_your_wallet.creating_password',
              )}
            </Text>
            <Text
              variant={TextVariant.HeadingSMRegular}
              style={styles.subtitle}
            >
              {strings('create_wallet.subtitle')}
            </Text>
          </View>
        ) : (
          <View style={styles.wrapper}>
            <OnboardingProgress steps={CHOOSE_PASSWORD_STEPS} />
            <KeyboardAwareScrollView
              style={styles.scrollableWrapper}
              contentContainerStyle={styles.keyboardScrollableWrapper}
              resetScrollToCoords={{ x: 0, y: 0 }}
            >
              <View testID={ChoosePasswordSelectorsIDs.CONTAINER_ID}>
                <View style={styles.content}>
                  <Text variant={TextVariant.HeadingLG} style={styles.title}>
                    {strings('choose_password.title')}
                  </Text>
                  <View style={styles.text}>
                    <Text
                      variant={TextVariant.HeadingSMRegular}
                      style={styles.subtitle}
                    >
                      {strings('choose_password.subtitle')}
                    </Text>
                  </View>
                </View>
                <View style={styles.field}>
                  <Text variant={TextVariant.BodySM}>
                    {strings('choose_password.password')}
                  </Text>
                  <Text
                    variant={TextVariant.BodySM}
                    onPress={this.toggleShowHide}
                    style={styles.showPassword}
                  >
                    {strings(
                      `choose_password.${secureTextEntry ? 'show' : 'hide'}`,
                    )}
                  </Text>
                  <TextInput
                    style={[styles.input, inputWidth] as never}
                    value={password}
                    onChangeText={this.onPasswordChange}
                    secureTextEntry={secureTextEntry}
                    placeholder=""
                    placeholderTextColor={colors.text.muted}
                    testID={ChoosePasswordSelectorsIDs.NEW_PASSWORD_INPUT_ID}
                    onSubmitEditing={this.jumpToConfirmPassword}
                    returnKeyType="next"
                    autoCapitalize="none"
                    keyboardAppearance={
                      themeAppearance as 'light' | 'dark' | 'default'
                    }
                  />
                  {(password !== '' && (
                    <Text
                      variant={TextVariant.BodySM}
                      style={styles.passwordStrengthLabel}
                    >
                      {strings('choose_password.password_strength')}
                      <Text
                        variant={TextVariant.BodySM}
                        style={
                          (
                            styles as unknown as Record<
                              string,
                              TextStyle | undefined
                            >
                          )[`strength_${passwordStrengthWord}`]
                        }
                      >
                        {' '}
                        {strings(
                          `choose_password.strength_${passwordStrengthWord}`,
                        )}
                      </Text>
                    </Text>
                  )) || (
                    <Text
                      variant={TextVariant.BodySM}
                      style={styles.passwordStrengthLabel}
                    >
                      {''}
                    </Text>
                  )}
                </View>
                <View style={styles.field}>
                  <Text variant={TextVariant.BodySM}>
                    {strings('choose_password.confirm_password')}
                  </Text>
                  <TextInput
                    ref={this.confirmPasswordInput}
                    style={[styles.input, inputWidth] as never}
                    value={confirmPassword}
                    onChangeText={this.setConfirmPassword}
                    secureTextEntry={secureTextEntry}
                    placeholder={''}
                    placeholderTextColor={colors.text.muted}
                    testID={
                      ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID
                    }
                    accessibilityLabel={
                      ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID
                    }
                    onSubmitEditing={this.onPressCreate}
                    returnKeyType={'done'}
                    autoCapitalize="none"
                    keyboardAppearance={
                      themeAppearance as 'light' | 'dark' | 'default'
                    }
                  />
                  <View style={styles.showMatchingPasswords}>
                    {passwordsMatch ? (
                      <Icon
                        name="check"
                        size={16}
                        color={colors.success.default}
                      />
                    ) : null}
                  </View>
                  <Text
                    variant={TextVariant.BodySM}
                    style={styles.passwordStrengthLabel}
                  >
                    {strings('choose_password.must_be_at_least', {
                      number: MIN_PASSWORD_LENGTH,
                    })}
                  </Text>
                </View>
                <View>{this.renderSwitch()}</View>
                <View style={styles.checkboxContainer}>
                  <CheckBox
                    value={isSelected}
                    onValueChange={this.setSelection}
                    style={styles.checkbox}
                    tintColors={{
                      true: colors.primary.default,
                      false: colors.border.default,
                    }}
                    boxType="square"
                    testID={
                      ChoosePasswordSelectorsIDs.IOS_I_UNDERSTAND_BUTTON_ID
                    }
                    accessibilityLabel={
                      ChoosePasswordSelectorsIDs.IOS_I_UNDERSTAND_BUTTON_ID
                    }
                  />
                  <Text
                    style={styles.label}
                    variant={TextVariant.BodySM}
                    onPress={this.setSelection}
                    testID={
                      ChoosePasswordSelectorsIDs.ANDROID_I_UNDERSTAND_BUTTON_ID
                    }
                  >
                    {strings('choose_password.i_understand')}{' '}
                    <Text
                      variant={TextVariant.BodySM}
                      color={TextColor.Info}
                      onPress={this.learnMore}
                      style={styles.learnMore}
                    >
                      {strings('choose_password.learn_more')}
                    </Text>
                  </Text>
                </View>

                {!!error && <Text color={TextColor.Error}>{error}</Text>}
              </View>

              <View style={styles.ctaWrapper}>
                <StyledButton
                  type={'blue'}
                  onPress={this.onPressCreate}
                  testID={ChoosePasswordSelectorsIDs.SUBMIT_BUTTON_ID}
                  disabled={!canSubmit}
                >
                  {strings('choose_password.create_button')}
                </StyledButton>
              </View>
            </KeyboardAwareScrollView>
          </View>
        )}
      </SafeAreaView>
    );
  }
}

(ChoosePassword as unknown as { contextType: typeof ThemeContext }).contextType =
  ThemeContext;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  passwordSet: () => dispatch(passwordSet()),
  passwordUnset: () => dispatch(passwordUnset()),
  setLockTime: (time: number) => dispatch(setLockTime(time)),
  seedphraseNotBackedUp: () => dispatch(seedphraseNotBackedUp()),
});

export default connect(null, mapDispatchToProps)(ChoosePassword);
