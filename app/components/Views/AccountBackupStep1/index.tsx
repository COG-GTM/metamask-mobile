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
import { Theme } from '../../../util/theme/models';

const SRPDesign = require('../../../images/srp-lock-design.png');

interface Styles {
  mainWrapper: ViewStyle;
  scrollviewWrapper: ViewStyle;
  wrapper: ViewStyle;
  content: ViewStyle;
  title: TextStyle;
  text: ViewStyle;
  label: TextStyle;
  buttonWrapper: ViewStyle;
  bold: TextStyle;
  blue: TextStyle;
  remindLaterText: TextStyle;
  remindLaterSubText: TextStyle;
  startSubText: TextStyle;
  remindLaterContainer: ViewStyle;
  remindLaterButton: ViewStyle;
  ctaContainer: ViewStyle;
  srpDesign: ImageStyle;
  button?: ViewStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
  StyleSheet.create({
    mainWrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    scrollviewWrapper: {
      flexGrow: 1,
    },
    wrapper: {
      flex: 1,
      padding: 20,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 16,
    },
    content: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      flex: 1,
      marginBottom: 10,
    },
    title: {
      fontSize: 24,
      marginBottom: 24,
      marginTop: 24,
      color: colors.text.default,
      textAlign: 'center',
      ...fontStyles.bold,
    },
    text: {
      marginTop: 32,
      justifyContent: 'center',
    },
    label: {
      lineHeight: scaling.scale(20),
      fontSize: scaling.scale(14),
      color: colors.text.default,
      textAlign: 'left',
      ...fontStyles.normal,
    },
    buttonWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    bold: {
      ...fontStyles.bold,
    },
    blue: {
      color: colors.primary.default,
    },
    remindLaterText: {
      textAlign: 'center',
      fontSize: 15,
      lineHeight: 20,
      color: colors.primary.default,
      ...fontStyles.normal,
    },
    remindLaterSubText: {
      textAlign: 'center',
      fontSize: 11,
      lineHeight: 20,
      color: colors.text.alternative,
      ...fontStyles.normal,
    },
    startSubText: {
      textAlign: 'center',
      fontSize: 11,
      marginTop: 12,
      color: colors.text.alternative,
      ...fontStyles.normal,
    },
    remindLaterContainer: {
      marginBottom: 34,
    },
    remindLaterButton: {
      elevation: 10,
      zIndex: 10,
    },
    ctaContainer: {
      marginBottom: 30,
    },
    srpDesign: {
      width: 200,
      height: 225,
    },
  });

interface AccountBackupStep1Props {
  navigation: {
    navigate: (route: string, params?: object) => void;
    setOptions: (options: object) => void;
    reset: (state: { index: number; routes: Array<{ name: string }> }) => void;
  };
  route: {
    params?: object;
  };
  setOnboardingWizardStep: (step: number) => void;
}

const AccountBackupStep1: React.FC<AccountBackupStep1Props> = (props) => {
  const { navigation, route } = props;
  const [showRemindLaterModal, setRemindLaterModal] = useState(false);
  const [showWhatIsSeedphraseModal, setWhatIsSeedphraseModal] = useState(false);
  const [skipCheckbox, setToggleSkipCheckbox] = useState(false);
  const [hasFunds, setHasFunds] = useState(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const track = (event: unknown, properties?: object): void => {
    const eventBuilder = MetricsEventBuilder.createEventBuilder(event);
    if (properties) {
      eventBuilder.addProperties(properties);
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
      if (Engine.hasFunds()) setHasFunds(true);

      const hardwareBackPress = (): boolean => true;

      BackHandler.addEventListener('hardwareBackPress', hardwareBackPress);

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', hardwareBackPress);
      };
    },
    [],
  );

  const goNext = (): void => {
    props.navigation.navigate('AccountBackupStep1B', { ...props.route.params });
    track(MetaMetricsEvents.WALLET_SECURITY_STARTED);
  };

  const showRemindLater = (): void => {
    if (hasFunds) return;

    setRemindLaterModal(true);
    track(MetaMetricsEvents.WALLET_SECURITY_SKIP_INITIATED);
  };

  const toggleSkipCheckbox = (): void =>
    skipCheckbox ? setToggleSkipCheckbox(false) : setToggleSkipCheckbox(true);

  const hideRemindLaterModal = (): void => {
    setToggleSkipCheckbox(false);
    setRemindLaterModal(false);
  };

  const secureNow = (): void => {
    hideRemindLaterModal();
    goNext();
  };

  const skip = async (): Promise<void> => {
    hideRemindLaterModal();
    track(MetaMetricsEvents.WALLET_SECURITY_SKIP_CONFIRMED);
    const onboardingWizard = await StorageWrapper.getItem(ONBOARDING_WIZARD);
    !onboardingWizard && props.setOnboardingWizardStep(1);
    props.navigation.reset({
      index: 1,
      routes: [{ name: Routes.ONBOARDING.SUCCESS }],
    });
  };

  const showWhatIsSeedphrase = (): void => setWhatIsSeedphraseModal(true);

  const hideWhatIsSeedphrase = (): void => setWhatIsSeedphraseModal(false);

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

const mapDispatchToProps = (
  dispatch: (action: unknown) => void,
): {
  setOnboardingWizardStep: (step: number) => void;
} => ({
  setOnboardingWizardStep: (step) => dispatch(setOnboardingWizardStep(step)),
});

export default connect(null, mapDispatchToProps)(AccountBackupStep1);
