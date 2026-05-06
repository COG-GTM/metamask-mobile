import React, { PureComponent } from 'react';
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
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { connect } from 'react-redux';
import Button from '@metamask/react-native-button';
import ElevatedView from 'react-native-elevated-view';
import { Theme } from '@metamask/design-tokens';
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
import FadeOutOverlay from '../../UI/FadeOutOverlay';
import {
  getTransparentBackOnboardingNavbarOptions,
  getTransparentOnboardingNavbarOptions,
} from '../../UI/Navbar';
import Device from '../../../util/device';
import BaseNotification from '../../UI/Notification/BaseNotification';
import { loadingSet, loadingUnset } from '../../../actions/user';
import { storePrivacyPolicyClickedOrClosed as storePrivacyPolicyClickedOrClosedAction } from '../../../reducers/legalNotices';
import PreventScreenshot from '../../../core/PreventScreenshot';
import WarningExistingUserModal from '../../UI/WarningExistingUserModal';
import { PREVIOUS_SCREEN, ONBOARDING } from '../../../constants/navigation';
import { EXISTING_USER } from '../../../constants/storage';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { withMetricsAwareness } from '../../hooks/useMetrics';
import { IWithMetricsAwarenessProps } from '../../hooks/useMetrics/withMetricsAwareness.types';
import { Authentication } from '../../../core';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { OnboardingSelectorIDs } from '../../../../e2e/selectors/Onboarding/Onboarding.selectors';

import Routes from '../../../constants/navigation/Routes';
import { selectAccounts } from '../../../selectors/accountTrackerController';
import trackOnboarding from '../../../util/metrics/TrackOnboarding/trackOnboarding';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    } as ViewStyle,
    wrapper: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 30,
    } as ViewStyle,
    foxWrapper: {
      width: Device.isIos() ? 90 : 45,
      height: Device.isIos() ? 90 : 45,
      marginVertical: 20,
    } as ViewStyle,
    image: {
      alignSelf: 'center',
      width: Device.isIos() ? 90 : 45,
      height: Device.isIos() ? 90 : 45,
    } as ImageStyle,
    largeFoxWrapper: {
      alignItems: 'center',
      marginVertical: 24,
    } as ViewStyle,
    foxImage: {
      width: 125,
      height: 125,
      resizeMode: 'contain',
    } as ImageStyle,
    title: {
      textAlign: 'center',
    } as TextStyle,
    ctas: {
      flex: 1,
      position: 'relative',
    } as ViewStyle,
    footer: {
      marginTop: -20,
      marginBottom: 20,
    } as ViewStyle,
    login: {
      fontSize: 18,
      color: colors.primary.default,
      ...fontStyles.normal,
    } as TextStyle,
    buttonDescription: {
      textAlign: 'center',
      marginBottom: 16,
    } as TextStyle,
    importWrapper: {
      marginVertical: 16,
    } as ViewStyle,
    createWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
      marginBottom: 24,
    } as ViewStyle,
    buttonWrapper: {
      marginBottom: 16,
    } as ViewStyle,
    loader: {
      marginTop: 180,
      justifyContent: 'center',
      textAlign: 'center',
    } as TextStyle,
    loadingText: {
      marginTop: 30,
      textAlign: 'center',
    } as TextStyle,
    modalTypeView: {
      position: 'absolute',
      bottom: 0,
      paddingBottom: Device.isIphoneX() ? 20 : 10,
      left: 0,
      right: 0,
      backgroundColor: importedColors.transparent,
    } as ViewStyle,
    notificationContainer: {
      flex: 0.1,
      flexDirection: 'row',
      alignItems: 'flex-end',
    } as ViewStyle,
  });

interface OnboardingOwnProps extends IWithMetricsAwarenessProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route?: any;
}

interface OnboardingStateProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts?: any;
  passwordSet?: boolean;
  loading?: boolean;
  loadingMsg?: string;
}

interface OnboardingDispatchProps {
  setLoading: (msg: string) => void;
  unsetLoading: () => void;
  disableNewPrivacyPolicyToast: () => void;
}

type OnboardingProps = OnboardingOwnProps &
  OnboardingStateProps &
  OnboardingDispatchProps;

interface OnboardingState {
  warningModalVisible: boolean;
  loading: boolean;
  existingUser: boolean;
}

/**
 * View that is displayed to first time (new) users
 */
class Onboarding extends PureComponent<OnboardingProps, OnboardingState> {
  notificationAnimated = new Animated.Value(100);
  detailsYAnimated = new Animated.Value(0);
  actionXAnimated = new Animated.Value(0);
  detailsAnimated = new Animated.Value(0);

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

  state: OnboardingState = {
    warningModalVisible: false,
    loading: false,
    existingUser: false,
  };

  seedwords: string | null = null;
  importedAccounts: string[] | null = null;
  channelName: string | null = null;
  incomingDataStr = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataToSync: any = null;
  mounted = false;

  warningCallback: () => void = () => {
    /* no-op */
  };

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
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    navigation.setOptions(
      route?.params?.delete
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
      if (this.props.route?.params?.delete) {
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
      if (metrics?.isEnabled?.()) {
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
      if (metrics?.isEnabled?.()) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  track = (event: any) => {
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
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
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
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
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
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (!this.props.route?.params?.delete) return;
    return (
      <Animated.View
        style={[
          styles.notificationContainer,
          { transform: [{ translateY: this.notificationAnimated }] },
        ]}
      >
        <ElevatedView style={styles.modalTypeView} elevation={100}>
          {React.createElement(
            BaseNotification as unknown as React.ComponentType<
              Record<string, unknown>
            >,
            {
              closeButtonDisabled: true,
              status: 'success',
              data: {
                title: strings('onboarding.success'),
                description: strings('onboarding.your_wallet'),
              },
            },
          )}
        </ElevatedView>
      </Animated.View>
    );
  };

  render() {
    const { loading } = this.props;
    const { existingUser } = this.state;
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
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

(Onboarding as unknown as { contextType: typeof ThemeContext }).contextType =
  ThemeContext;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: any) => ({
  accounts: selectAccounts(state),
  passwordSet: state.user.passwordSet,
  loading: state.user.loadingSet,
  loadingMsg: state.user.loadingMsg,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  setLoading: (msg: string) => dispatch(loadingSet(msg)),
  unsetLoading: () => dispatch(loadingUnset()),
  disableNewPrivacyPolicyToast: () =>
    dispatch(storePrivacyPolicyClickedOrClosedAction()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
)(withMetricsAwareness(Onboarding as any));
