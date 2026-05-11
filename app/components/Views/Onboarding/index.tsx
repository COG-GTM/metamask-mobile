import React, { PureComponent, ComponentType } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  View,
  ScrollView,
  StyleSheet,
  Image,
  InteractionManager,
  Animated,
  Easing,
} from 'react-native';
import type { Dispatch } from 'redux';
import type { RootState } from '../../../reducers';
import type { IWithMetricsAwarenessProps } from '../../hooks/useMetrics/withMetricsAwareness.types';
import Text, {
  TextVariant,
} from '../../../component-library/components/Texts/Text';
import StorageWrapper from '../../../store/storage-wrapper';
import StyledButton from '../../UI/StyledButton';
import {
  fontStyles,
  baseStyles,
  colors as importedColors,
} from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
// @ts-expect-error - no types for @metamask/react-native-button
import Button from '@metamask/react-native-button';
import { connect } from 'react-redux';
import FadeOutOverlay from '../../UI/FadeOutOverlay';
import {
  getTransparentBackOnboardingNavbarOptions,
  getTransparentOnboardingNavbarOptions,
} from '../../UI/Navbar';
import Device from '../../../util/device';
import BaseNotificationImport from '../../UI/Notification/BaseNotification';
import ElevatedView from 'react-native-elevated-view';
import { loadingSet, loadingUnset } from '../../../actions/user';
import { storePrivacyPolicyClickedOrClosed as storePrivacyPolicyClickedOrClosedAction } from '../../../reducers/legalNotices';
import PreventScreenshot from '../../../core/PreventScreenshot';
import WarningExistingUserModal from '../../UI/WarningExistingUserModal';
import { PREVIOUS_SCREEN, ONBOARDING } from '../../../constants/navigation';
import { EXISTING_USER } from '../../../constants/storage';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { withMetricsAwareness } from '../../hooks/useMetrics';
import { Authentication } from '../../../core';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { OnboardingSelectorIDs } from '../../../../e2e/selectors/Onboarding/Onboarding.selectors';

import Routes from '../../../constants/navigation/Routes';
import { selectAccounts } from '../../../selectors/accountTrackerController';
import trackOnboarding from '../../../util/metrics/TrackOnboarding/trackOnboarding';
import { trace, TraceName, TraceOperation } from '../../../util/trace';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';

interface ThemeColors {
  primary: { default: string };
}

const BaseNotification =
  BaseNotificationImport as unknown as ComponentType<{
    closeButtonDisabled?: boolean;
    status?: string;
    data?: { title?: string; description?: string };
    onPress?: () => void;
    onHide?: () => void;
    autoDismiss?: boolean;
  }>;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    wrapper: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 30,
    },
    foxWrapper: {
      width: Device.isIos() ? 90 : 45,
      height: Device.isIos() ? 90 : 45,
      marginVertical: 20,
    },
    image: {
      alignSelf: 'center',
      width: Device.isIos() ? 90 : 45,
      height: Device.isIos() ? 90 : 45,
    },
    largeFoxWrapper: {
      alignItems: 'center',
      marginVertical: 24,
    },
    foxImage: {
      width: 125,
      height: 125,
      resizeMode: 'contain',
    },
    title: {
      textAlign: 'center',
    },
    ctas: {
      flex: 1,
      position: 'relative',
    },
    footer: {
      marginTop: -20,
      marginBottom: 20,
    },
    login: {
      fontSize: 18,
      color: colors.primary.default,
      ...fontStyles.normal,
    },
    buttonDescription: {
      textAlign: 'center',
      marginBottom: 16,
    },
    importWrapper: {
      marginVertical: 16,
    },
    createWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
      marginBottom: 24,
    },
    buttonWrapper: {
      marginBottom: 16,
    },
    loader: {
      marginTop: 180,
      justifyContent: 'center',
      textAlign: 'center',
    },
    loadingText: {
      marginTop: 30,
      textAlign: 'center',
    },
    modalTypeView: {
      position: 'absolute',
      bottom: 0,
      paddingBottom: Device.isIphoneX() ? 20 : 10,
      left: 0,
      right: 0,
      backgroundColor: importedColors.transparent,
    },
    notificationContainer: {
      flex: 0.1,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
  });

interface OnboardingNavigation {
  setOptions: (options: object) => void;
  navigate: (route: string, params?: object) => void;
  push: (route: string, params?: object) => void;
  replace: (route: string, params?: object) => void;
  goBack?: () => void;
}

interface OnboardingRoute {
  params?: {
    delete?: boolean;
    [key: string]: unknown;
  };
}

interface AccountState {
  [address: string]: { balance?: string };
}

interface OwnProps {
  navigation: OnboardingNavigation;
  route: OnboardingRoute;
}

interface StateProps {
  accounts: AccountState;
  passwordSet: boolean;
  loading: boolean;
  loadingMsg: string;
}

interface DispatchProps {
  setLoading: (msg: string) => void;
  unsetLoading: () => void;
  disableNewPrivacyPolicyToast: () => void;
}

type Props = OwnProps & StateProps & DispatchProps & IWithMetricsAwarenessProps;

interface State {
  warningModalVisible: boolean;
  loading: boolean;
  existingUser: boolean;
}

/**
 * View that is displayed to first time (new) users
 */
class Onboarding extends PureComponent<Props, State> {
  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  notificationAnimated: Animated.Value = new Animated.Value(100);
  detailsYAnimated: Animated.Value = new Animated.Value(0);
  actionXAnimated: Animated.Value = new Animated.Value(0);
  detailsAnimated: Animated.Value = new Animated.Value(0);

  animatedTimingStart = (
    animatedRef: Animated.Value,
    toValue: number,
  ) => {
    Animated.timing(animatedRef, {
      toValue,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  state: State = {
    warningModalVisible: false,
    loading: false,
    existingUser: false,
  };

  seedwords: string[] | null = null;
  importedAccounts: unknown[] | null = null;
  channelName: string | null = null;
  incomingDataStr = '';
  dataToSync: unknown = null;
  mounted = false;

  warningCallback: () => void = () => undefined;

  showNotification = () => {
    // show notification
    this.animatedTimingStart(this.notificationAnimated, 0);
    // hide notification
    setTimeout(() => {
      this.animatedTimingStart(this.notificationAnimated, 200);
    }, 4000);
    this.disableBackPress();
  };

  disableBackPress = () => {
    // Disable back press
    const hardwareBackPress = () => true;
    BackHandler.addEventListener('hardwareBackPress', hardwareBackPress);
  };

  updateNavBar = () => {
    const { route, navigation } = this.props;
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    navigation.setOptions(
      route.params?.delete
        ? getTransparentOnboardingNavbarOptions(colors)
        : getTransparentBackOnboardingNavbarOptions(colors),
    );
  };

  componentDidMount() {
    this.updateNavBar();
    this.mounted = true;
    this.checkIfExistingUser();
    this.props.disableNewPrivacyPolicyToast();

    InteractionManager.runAfterInteractions(() => {
      PreventScreenshot.forbid();
      if (this.props.route.params?.delete) {
        this.props.setLoading(strings('onboarding.delete_current'));
        setTimeout(() => {
          this.showNotification();
          this.props.unsetLoading();
        }, 2000);
      }
    });
  }

  componentWillUnmount() {
    this.mounted = false;
    this.props.unsetLoading();
    InteractionManager.runAfterInteractions(PreventScreenshot.allow);
  }

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  async checkIfExistingUser() {
    const existingUser = await StorageWrapper.getItem(EXISTING_USER);
    if (existingUser !== null) {
      this.setState({ existingUser: true });
    }
  }

  onLogin = async () => {
    const { passwordSet } = this.props;
    if (!passwordSet) {
      await Authentication.resetVault();
      this.props.navigation.replace(Routes.ONBOARDING.HOME_NAV);
    } else {
      await Authentication.lockApp();
      this.props.navigation.replace(Routes.ONBOARDING.LOGIN);
    }
  };

  handleExistingUser = (action: () => void) => {
    if (this.state.existingUser) {
      this.alertExistingUser(action);
    } else {
      action();
    }
  };

  onPressCreate = () => {
    const action = () => {
      const { metrics } = this.props;
      if (metrics.isEnabled()) {
        this.props.navigation.navigate('ChoosePassword', {
          [PREVIOUS_SCREEN]: ONBOARDING,
        });
        this.track(MetaMetricsEvents.WALLET_SETUP_STARTED);
      } else {
        this.props.navigation.navigate('OptinMetrics', {
          onContinue: () => {
            this.props.navigation.replace('ChoosePassword', {
              [PREVIOUS_SCREEN]: ONBOARDING,
            });
            this.track(MetaMetricsEvents.WALLET_SETUP_STARTED);
          },
        });
      }
    };

    this.handleExistingUser(action);
  };

  onPressImport = () => {
    const action = async () => {
      const { metrics } = this.props;
      if (metrics.isEnabled()) {
        this.props.navigation.push(
          Routes.ONBOARDING.IMPORT_FROM_SECRET_RECOVERY_PHRASE,
        );
        this.track(MetaMetricsEvents.WALLET_IMPORT_STARTED);
      } else {
        this.props.navigation.navigate('OptinMetrics', {
          onContinue: () => {
            this.props.navigation.replace(
              Routes.ONBOARDING.IMPORT_FROM_SECRET_RECOVERY_PHRASE,
            );
            this.track(MetaMetricsEvents.WALLET_IMPORT_STARTED);
          },
        });
      }
    };
    this.handleExistingUser(action);
  };

  track = (event: Parameters<typeof MetricsEventBuilder.createEventBuilder>[0]) => {
    trackOnboarding(MetricsEventBuilder.createEventBuilder(event).build());
  };

  alertExistingUser = (callback: () => void) => {
    this.warningCallback = () => {
      callback();
      this.toggleWarningModal();
    };
    this.toggleWarningModal();
  };

  toggleWarningModal = () => {
    const warningModalVisible = this.state.warningModalVisible;
    this.setState({ warningModalVisible: !warningModalVisible });
  };

  renderLoader = () => {
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.wrapper}>
        <View style={styles.loader}>
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}>{this.props.loadingMsg}</Text>
        </View>
      </View>
    );
  };

  renderContent() {
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.ctas}>
        <View style={styles.largeFoxWrapper}>
          <Image
            source={require('../../../images/branding/fox.png')}
            style={styles.foxImage}
            resizeMethod={'auto'}
          />
        </View>
        <Text
          variant={TextVariant.HeadingLG}
          style={styles.title}
          testID={OnboardingSelectorIDs.SCREEN_TITLE}
        >
          {strings('onboarding.title')}
        </Text>
        <View style={styles.importWrapper}>
          <Text
            style={styles.buttonDescription}
            testID={OnboardingSelectorIDs.SCREEN_DESCRIPTION}
          >
            {strings('onboarding.import')}
          </Text>
        </View>
        <View style={styles.createWrapper}>
          <View style={styles.buttonWrapper}>
            <StyledButton
              type={'normal'}
              onPress={this.onPressImport}
              testID={OnboardingSelectorIDs.IMPORT_SEED_BUTTON}
            >
              {strings('import_wallet.import_from_seed_button')}
            </StyledButton>
          </View>
          <View style={styles.buttonWrapper}>
            <StyledButton
              type={'blue'}
              onPress={this.onPressCreate}
              testID={OnboardingSelectorIDs.NEW_WALLET_BUTTON}
            >
              {strings('onboarding.start_exploring_now')}
            </StyledButton>
          </View>
        </View>
      </View>
    );
  }

  handleSimpleNotification = () => {
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors);

    if (!this.props.route.params?.delete) return;
    return (
      <Animated.View
        style={[
          styles.notificationContainer,
          { transform: [{ translateY: this.notificationAnimated }] },
        ]}
      >
        <ElevatedView style={styles.modalTypeView} elevation={100}>
          <BaseNotification
            closeButtonDisabled
            status="success"
            data={{
              title: strings('onboarding.success'),
              description: strings('onboarding.your_wallet'),
            }}
          />
        </ElevatedView>
      </Animated.View>
    );
  };

  render() {
    const { loading } = this.props;
    const { existingUser } = this.state;
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View
        style={baseStyles.flexGrow}
        testID={OnboardingSelectorIDs.CONTAINER_ID}
      >
        <ScrollView
          style={baseStyles.flexGrow}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.wrapper}>
            {loading && (
              <View style={styles.foxWrapper}>
                <Image
                  source={require('../../../images/branding/fox.png')}
                  style={styles.image}
                  resizeMethod={'auto'}
                />
              </View>
            )}
            {loading ? this.renderLoader() : this.renderContent()}
          </View>
          {existingUser && !loading && (
            <View style={styles.footer}>
              <Button style={styles.login} onPress={this.onLogin}>
                {strings('onboarding.unlock')}
              </Button>
            </View>
          )}
        </ScrollView>

        <FadeOutOverlay />

        <View>{this.handleSimpleNotification()}</View>

        <WarningExistingUserModal
          warningModalVisible={this.state.warningModalVisible}
          onCancelPress={this.warningCallback}
          onRequestClose={this.toggleWarningModal}
          onConfirmPress={this.toggleWarningModal}
        />
      </View>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => ({
  accounts: selectAccounts(state) as unknown as AccountState,
  passwordSet: state.user.passwordSet,
  loading: state.user.loadingSet,
  loadingMsg: state.user.loadingMsg,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setLoading: (msg: string) => dispatch(loadingSet(msg)),
  unsetLoading: () => dispatch(loadingUnset()),
  disableNewPrivacyPolicyToast: () =>
    dispatch(storePrivacyPolicyClickedOrClosedAction()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withMetricsAwareness(
    Onboarding as unknown as ComponentType<IWithMetricsAwarenessProps>,
  ),
);
