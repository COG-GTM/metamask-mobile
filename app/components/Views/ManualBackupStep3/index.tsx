import React, { PureComponent } from 'react';
import { Alert, BackHandler, View, StyleSheet, Keyboard } from 'react-native';
import { connect } from 'react-redux';
import { fontStyles } from '../../../styles/common';
import StorageWrapper from '../../../store/storage-wrapper';
import OnboardingProgress from '../../UI/OnboardingProgress';
import { strings } from '../../../../locales/i18n';
import { showAlert } from '../../../actions/alert';
import AndroidBackHandler from '../AndroidBackHandler';
import Device from '../../../util/device';
import Confetti from '../../UI/Confetti';
import HintModal from '../../UI/HintModal';
import { getTransparentOnboardingNavbarOptions } from '../../UI/Navbar';
import setOnboardingWizardStep from '../../../actions/wizard';
import {
  ONBOARDING_WIZARD,
  SEED_PHRASE_HINTS,
} from '../../../constants/storage';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { ThemeContext, mockTheme } from '../../../util/theme';
import trackOnboarding from '../../../util/metrics/TrackOnboarding/trackOnboarding';
import OnboardingSuccess from '../OnboardingSuccess';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import type { Dispatch } from 'redux';

interface ThemeColors {
  background: { default: string };
  text: { default: string };
  primary: { default: string };
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    mainWrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      marginTop: 16,
    },
    actionView: {
      paddingTop: 40,
    },
    wrapper: {
      flex: 1,
      paddingHorizontal: 50,
    },
    onBoardingWrapper: {
      paddingHorizontal: 20,
    },
    congratulations: {
      fontSize: Device.isMediumDevice() ? 28 : 32,
      marginBottom: 12,
      color: colors.text.default,
      justifyContent: 'center',
      textAlign: 'center',
      ...fontStyles.bold,
    },
    baseText: {
      fontSize: 16,
      color: colors.text.default,
      textAlign: 'center',
      ...fontStyles.normal,
    },
    successText: {
      marginBottom: 32,
    },
    hintText: {
      marginBottom: 26,
      color: colors.primary.default,
    },
    learnText: {
      color: colors.primary.default,
    },
    recoverText: {
      marginBottom: 26,
    },
  });

const hardwareBackPress = (): boolean => true;
const HARDWARE_BACK_PRESS = 'hardwareBackPress';

interface ManualBackupNavigation {
  setOptions: (options: object) => void;
  navigate: (route: string, params?: object) => void;
  reset: (options: { routes: { name: string }[] }) => void;
  pop?: () => void;
}

interface OwnProps {
  navigation?: ManualBackupNavigation;
  route?: {
    params?: {
      steps?: string[];
      words?: string[];
    };
  };
}

interface DispatchProps {
  showAlert: (config: unknown) => void;
  setOnboardingWizardStep: (step: number) => void;
}

type Props = OwnProps & DispatchProps;

interface State {
  currentStep: number;
  showHint: boolean;
  hintText: string;
}

/**
 * View that's shown during the last step of
 * the backup seed phrase flow
 */
class ManualBackupStep3 extends PureComponent<Props, State> {
  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  steps: string[] | undefined;

  constructor(props: Props) {
    super(props);
    this.steps = props.route?.params?.steps;
  }

  state: State = {
    currentStep: 4,
    showHint: false,
    hintText: '',
  };

  updateNavBar = () => {
    const { navigation } = this.props;
    if (!navigation) return;
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    navigation.setOptions(getTransparentOnboardingNavbarOptions(colors));
  };

  componentWillUnmount = () => {
    BackHandler.removeEventListener(HARDWARE_BACK_PRESS, hardwareBackPress);
  };

  componentDidMount = async () => {
    this.updateNavBar();
    const currentSeedphraseHints = await StorageWrapper.getItem(
      SEED_PHRASE_HINTS,
    );
    const parsedHints =
      currentSeedphraseHints && JSON.parse(currentSeedphraseHints);
    const manualBackup = parsedHints?.manualBackup;
    this.setState({
      hintText: manualBackup,
    });
    trackOnboarding(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.WALLET_SECURITY_COMPLETED,
      ).build(),
    );
    BackHandler.addEventListener(HARDWARE_BACK_PRESS, hardwareBackPress);
  };

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  toggleHint = () => {
    this.setState((state) => ({ showHint: !state.showHint }));
  };

  learnMore = () =>
    this.props.navigation?.navigate('Webview', {
      screen: 'SimpleWebview',
      params: {
        url: 'https://support.metamask.io',
        title: strings('drawer.metamask_support'),
      },
    });

  isHintSeedPhrase = (hintText: string) => {
    const words = this.props.route?.params?.words;
    if (words) {
      const lower = (s: string) => String(s).toLowerCase();
      return lower(hintText) === lower(words.join(' '));
    }
    return false;
  };

  saveHint = async () => {
    const { hintText } = this.state;
    if (!hintText) return;
    if (this.isHintSeedPhrase(hintText)) {
      Alert.alert('Error!', strings('manual_backup_step_3.no_seedphrase'));
      return;
    }
    this.toggleHint();
    const currentSeedphraseHints = await StorageWrapper.getItem(
      SEED_PHRASE_HINTS,
    );
    const parsedHints = currentSeedphraseHints
      ? JSON.parse(currentSeedphraseHints)
      : {};
    await StorageWrapper.setItem(
      SEED_PHRASE_HINTS,
      JSON.stringify({ ...parsedHints, manualBackup: hintText }),
    );
    trackOnboarding(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.WALLET_SECURITY_RECOVERY_HINT_SAVED,
      ).build(),
    );
  };

  done = async () => {
    const onboardingWizard = await StorageWrapper.getItem(ONBOARDING_WIZARD);
    if (onboardingWizard) {
      this.props.navigation?.reset({ routes: [{ name: 'HomeNav' }] });
    } else {
      this.props.setOnboardingWizardStep(1);
      this.props.navigation?.reset({ routes: [{ name: 'HomeNav' }] });
    }
  };

  handleChangeText = (text: string) => this.setState({ hintText: text });

  renderHint = () => {
    const { showHint, hintText } = this.state;
    return (
      <HintModal
        onConfirm={this.saveHint}
        onCancel={this.toggleHint}
        modalVisible={showHint}
        onRequestClose={Keyboard.dismiss}
        value={hintText}
        onChangeText={this.handleChangeText}
      />
    );
  };

  render() {
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors as ThemeColors);

    return (
      <View style={styles.mainWrapper}>
        <Confetti />
        {this.steps ? (
          <View style={styles.onBoardingWrapper}>
            <OnboardingProgress
              currentStep={this.state.currentStep}
              steps={this.steps}
            />
          </View>
        ) : null}
        <OnboardingSuccess onDone={this.done} backedUpSRP />
        {Device.isAndroid() && this.props.navigation?.pop && (
          <AndroidBackHandler
            customBackPress={this.props.navigation.pop}
          />
        )}
        {this.renderHint()}
      </View>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  showAlert: (config: unknown) =>
    dispatch(
      showAlert(
        config as Parameters<typeof showAlert>[0],
      ),
    ),
  setOnboardingWizardStep: (step: number) =>
    dispatch(setOnboardingWizardStep(step)),
});

export default connect(null, mapDispatchToProps)(ManualBackupStep3);
