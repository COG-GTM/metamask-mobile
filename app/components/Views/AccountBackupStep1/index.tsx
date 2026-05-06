import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  SafeAreaView,
  StyleSheet,
  BackHandler,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { Theme } from '@metamask/design-tokens';
import { fontStyles } from '../../../styles/common';
import StyledButton from '../../UI/StyledButton';
import OnboardingProgress from '../../UI/OnboardingProgress';
import { strings } from '../../../../locales/i18n';
import AndroidBackHandler from '../AndroidBackHandler';
import Device from '../../../util/device';
import SeedphraseModal from '../../UI/SeedphraseModal';
import { getOnboardingNavbarOptions } from '../../UI/Navbar';
import scaling from '../../../util/scaling';
import Engine from '../../../core/Engine';
import { ONBOARDING_WIZARD } from '../../../constants/storage';
import { CHOOSE_PASSWORD_STEPS } from '../../../constants/onboarding';
import SkipAccountSecurityModal from '../../UI/SkipAccountSecurityModal';
import { connect } from 'react-redux';
import setOnboardingWizardStep from '../../../actions/wizard';
import { MetaMetricsEvents } from '../../../core/Analytics';

import StorageWrapper from '../../../store/storage-wrapper';
import { useTheme } from '../../../util/theme';
import { ManualBackUpStepsSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ManualBackUpSteps.selectors';
import trackOnboarding from '../../../util/metrics/TrackOnboarding/trackOnboarding';
import Routes from '../../../../app/constants/navigation/Routes';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import SRPDesign from '../../../images/srp-lock-design.png';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    mainWrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    } as ViewStyle,
    scrollviewWrapper: {
      flexGrow: 1,
    } as ViewStyle,
    wrapper: {
      flex: 1,
      padding: 20,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 16,
    } as ViewStyle,
    content: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      flex: 1,
      marginBottom: 10,
    } as ViewStyle,
    title: {
      fontSize: 24,
      marginBottom: 24,
      marginTop: 24,
      color: colors.text.default,
      textAlign: 'center',
      ...fontStyles.bold,
    } as TextStyle,
    text: {
      marginTop: 32,
      justifyContent: 'center',
    } as ViewStyle,
    label: {
      lineHeight: scaling.scale(20),
      fontSize: scaling.scale(14),
      color: colors.text.default,
      textAlign: 'left',
      ...fontStyles.normal,
    } as TextStyle,
    buttonWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
    } as ViewStyle,
    bold: {
      ...fontStyles.bold,
    } as TextStyle,
    blue: {
      color: colors.primary.default,
    } as TextStyle,
    remindLaterText: {
      textAlign: 'center',
      fontSize: 15,
      lineHeight: 20,
      color: colors.primary.default,
      ...fontStyles.normal,
    } as TextStyle,
    remindLaterSubText: {
      textAlign: 'center',
      fontSize: 11,
      lineHeight: 20,
      color: colors.text.alternative,
      ...fontStyles.normal,
    } as TextStyle,
    startSubText: {
      textAlign: 'center',
      fontSize: 11,
      marginTop: 12,
      color: colors.text.alternative,
      ...fontStyles.normal,
    } as TextStyle,
    remindLaterContainer: {
      marginBottom: 34,
    } as ViewStyle,
    remindLaterButton: {
      elevation: 10,
      zIndex: 10,
    } as ViewStyle,
    ctaContainer: {
      marginBottom: 30,
    } as ViewStyle,
    srpDesign: {
      width: 200,
      height: 225,
    } as ImageStyle,
    button: {} as ViewStyle,
  });

interface AccountBackupStep1OwnProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route?: any;
}

interface AccountBackupStep1DispatchProps {
  setOnboardingWizardStep: (step: number) => void;
}

type AccountBackupStep1Props = AccountBackupStep1OwnProps &
  AccountBackupStep1DispatchProps;

/**
 * View that's shown during the first step of
 * the backup seed phrase flow
 */
const AccountBackupStep1 = (props: AccountBackupStep1Props) => {
  const { navigation, route } = props;
  const [showRemindLaterModal, setRemindLaterModal] = useState(false);
  const [showWhatIsSeedphraseModal, setWhatIsSeedphraseModal] = useState(false);
  const [skipCheckbox, setToggleSkipCheckbox] = useState(false);
  const [hasFunds, setHasFunds] = useState(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const track = (event: any, properties?: Record<string, unknown>) => {
    const eventBuilder = MetricsEventBuilder.createEventBuilder(event);
    if (properties) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      eventBuilder.addProperties(properties as any);
    }
    trackOnboarding(eventBuilder.build());
  };

  useEffect(() => {
    navigation.setOptions({
      ...getOnboardingNavbarOptions(
        route,
        // eslint-disable-next-line react/display-name
        { headerLeft: () => <View /> },
        colors,
      ),
      gesturesEnabled: false,
    });
  }, [navigation, route, colors]);

  useEffect(
    () => {
      // Check if user has funds
      if (Engine.hasFunds()) setHasFunds(true);

      // Disable back press
      const hardwareBackPress = () => true;

      // Add event listener
      BackHandler.addEventListener('hardwareBackPress', hardwareBackPress);

      // Remove event listener on cleanup
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', hardwareBackPress);
      };
    },
    [], // Run only when component mounts
  );

  const goNext = () => {
    props.navigation.navigate('AccountBackupStep1B', { ...props.route.params });
    track(MetaMetricsEvents.WALLET_SECURITY_STARTED);
  };

  const showRemindLater = () => {
    if (hasFunds) return;

    setRemindLaterModal(true);
    track(MetaMetricsEvents.WALLET_SECURITY_SKIP_INITIATED);
  };

  const toggleSkipCheckbox = () =>
    skipCheckbox ? setToggleSkipCheckbox(false) : setToggleSkipCheckbox(true);

  const hideRemindLaterModal = () => {
    setToggleSkipCheckbox(false);
    setRemindLaterModal(false);
  };

  const secureNow = () => {
    hideRemindLaterModal();
    goNext();
  };

  const skip = async () => {
    hideRemindLaterModal();
    track(MetaMetricsEvents.WALLET_SECURITY_SKIP_CONFIRMED);
    // Get onboarding wizard state
    const onboardingWizard = await StorageWrapper.getItem(ONBOARDING_WIZARD);
    !onboardingWizard && props.setOnboardingWizardStep(1);
    props.navigation.reset({
      index: 1,
      routes: [{ name: Routes.ONBOARDING.SUCCESS }],
    });
  };

  const showWhatIsSeedphrase = () => setWhatIsSeedphraseModal(true);

  const hideWhatIsSeedphrase = () => setWhatIsSeedphraseModal(false);

  return (
    <SafeAreaView style={styles.mainWrapper}>
      <ScrollView
        contentContainerStyle={styles.scrollviewWrapper}
        style={styles.mainWrapper}
        testID={ManualBackUpStepsSelectorsIDs.PROTECT_CONTAINER}
      >
        <View style={styles.wrapper}>
          <OnboardingProgress steps={CHOOSE_PASSWORD_STEPS} currentStep={1} />
          <View style={styles.content}>
            <Text style={styles.title}>
              {strings('account_backup_step_1.title')}
            </Text>

            <Image source={SRPDesign} style={styles.srpDesign} />
            <View style={styles.text}>
              <Text style={styles.label}>
                {strings('account_backup_step_1.info_text_1_1')}{' '}
                <Text style={styles.blue} onPress={showWhatIsSeedphrase}>
                  {strings('account_backup_step_1.info_text_1_2')}
                </Text>{' '}
                {strings('account_backup_step_1.info_text_1_3')}{' '}
                <Text style={styles.bold}>
                  {strings('account_backup_step_1.info_text_1_4')}
                </Text>
              </Text>
            </View>
          </View>
          <View style={styles.buttonWrapper}>
            {!hasFunds && (
              <View style={styles.remindLaterContainer}>
                <TouchableOpacity
                  style={styles.remindLaterButton}
                  onPress={showRemindLater}
                  hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
                >
                  <Text
                    style={styles.remindLaterText}
                    testID={
                      ManualBackUpStepsSelectorsIDs.REMIND_ME_LATER_BUTTON
                    }
                  >
                    {strings('account_backup_step_1.remind_me_later')}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.remindLaterSubText}>
                  {strings('account_backup_step_1.remind_me_later_subtext')}
                </Text>
              </View>
            )}
            <View style={styles.ctaContainer}>
              <StyledButton
                containerStyle={styles.button}
                type={'confirm'}
                onPress={goNext}
              >
                {strings('account_backup_step_1.cta_text')}
              </StyledButton>
              <Text style={styles.startSubText}>
                {strings('account_backup_step_1.cta_subText')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      {Device.isAndroid() && (
        <AndroidBackHandler customBackPress={showRemindLater} />
      )}
      <SkipAccountSecurityModal
        modalVisible={showRemindLaterModal}
        onCancel={secureNow}
        onConfirm={skip}
        skipCheckbox={skipCheckbox}
        onPress={hideRemindLaterModal}
        toggleSkipCheckbox={toggleSkipCheckbox}
      />
      <SeedphraseModal
        showWhatIsSeedphraseModal={showWhatIsSeedphraseModal}
        hideWhatIsSeedphrase={hideWhatIsSeedphrase}
      />
    </SafeAreaView>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): AccountBackupStep1DispatchProps => ({
  setOnboardingWizardStep: (step: number) =>
    dispatch(setOnboardingWizardStep(step)),
});

export default connect(null, mapDispatchToProps)(AccountBackupStep1);
