/* eslint-disable import/no-commonjs */
import React, { PureComponent } from 'react';
import {
  StyleSheet,
  Dimensions,
  Animated,
  View,
  AppState,
  Appearance,
  NativeEventSubscription,
  ViewStyle,
} from 'react-native';
import { connect } from 'react-redux';
import LottieView from 'lottie-react-native';
import { Theme } from '@metamask/design-tokens';
import { CommonActions } from '@react-navigation/native';
import { baseStyles } from '../../../styles/common';
import Logger from '../../../util/Logger';
import { Authentication } from '../../../core';
import {
  getAssetFromTheme,
  mockTheme,
  ThemeContext,
} from '../../../util/theme';
import Routes from '../../../constants/navigation/Routes';
import trackErrorAsAnalytics from '../../../util/metrics/TrackError/trackErrorAsAnalytics';

const LOGO_SIZE = 175;
const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background.default,
      flex: 1,
    } as ViewStyle,
    metamaskName: {
      marginTop: 10,
      height: 25,
      width: 170,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    logoWrapper: {
      marginTop: Dimensions.get('window').height / 2 - LOGO_SIZE / 2,
      height: LOGO_SIZE,
    } as ViewStyle,
    foxAndName: {
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    animation: {
      width: 110,
      height: 110,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    fox: {
      width: 110,
      height: 110,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
  });

const wordmarkLight = require('../../../animations/wordmark-light.json');
const wordmarkDark = require('../../../animations/wordmark-dark.json');

interface LockScreenOwnProps {
  // The navigator object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
  // ID associated with each biometric session.
  // This is used by the biometric sagas to handle actions with the matching ID.
  bioStateMachineId?: string;
}

interface LockScreenStateProps {
  appTheme?: string;
}

type LockScreenProps = LockScreenOwnProps & LockScreenStateProps;

interface LockScreenState {
  ready: boolean;
}

/**
 * Main view component for the Lock screen
 */
class LockScreen extends PureComponent<LockScreenProps, LockScreenState> {
  state: LockScreenState = {
    ready: false,
  };

  locked = true;
  timedOut = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  firstAnimation: any = React.createRef();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  secondAnimation: any = React.createRef();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animationName: any = React.createRef();
  opacity = new Animated.Value(1);
  appStateListener: NativeEventSubscription | undefined;

  componentDidMount() {
    this.appStateListener = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );
  }

  handleAppStateChange = async (nextAppState: string) => {
    // Trigger biometrics
    if (nextAppState === 'active') {
      this.firstAnimation?.play?.();
      this.unlockKeychain();
      this.appStateListener?.remove();
    }
  };

  componentWillUnmount() {
    this.appStateListener?.remove();
  }

  lock = () => {
    // TODO: Consolidate navigation action for locking app
    // Reset action reverts the nav state back to original state prior to logging in.
    // Reset is used intentionally. Do not use navigate.
    const resetAction = CommonActions.reset({
      index: 0,
      routes: [{ name: Routes.ONBOARDING.LOGIN }],
    });
    this.props.navigation.dispatch(resetAction);
    // Do not need to await since it's the last action.
    Authentication.lockApp({ reset: false });
  };

  async unlockKeychain() {
    const { bioStateMachineId } = this.props;
    try {
      // Retrieve the credentials
      Logger.log('Lockscreen::unlockKeychain - getting credentials');

      await Authentication.appTriggeredAuth({
        bioStateMachineId,
        disableAutoLogout: true,
      });

      this.setState({ ready: true });
      Logger.log('Lockscreen::unlockKeychain - state: ready');
    } catch (error) {
      this.lock();
      trackErrorAsAnalytics(
        'Lockscreen: Authentication failed',
        (error as Error)?.message,
      );
    }
  }

  onAnimationFinished = () => {
    setTimeout(() => {
      Animated.timing(this.opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        isInteraction: false,
      }).start(() => {
        this.props.navigation.navigate(Routes.ONBOARDING.HOME_NAV, {
          screen: Routes.WALLET_VIEW,
        });
      });
    }, 100);
  };

  getStyles = () => {
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderAnimations() {
    const { appTheme } = this.props;
    const osColorScheme = Appearance.getColorScheme();
    const wordmark = getAssetFromTheme(
      appTheme as never,
      osColorScheme,
      wordmarkLight,
      wordmarkDark,
    );
    const styles = this.getStyles();

    if (!this.state.ready) {
      return (
        <LottieView
          // eslint-disable-next-line react/jsx-no-bind
          ref={(animation) => {
            this.firstAnimation = animation;
          }}
          style={styles.animation}
          source={require('../../../animations/bounce.json')}
        />
      );
    }

    return (
      <View style={styles.foxAndName}>
        <LottieView
          // eslint-disable-next-line react/jsx-no-bind
          ref={(animation) => {
            this.secondAnimation = animation;
          }}
          style={styles.animation}
          loop={false}
          source={require('../../../animations/fox-in.json')}
          onAnimationFinish={this.onAnimationFinished}
        />
        <LottieView
          // eslint-disable-next-line react/jsx-no-bind
          ref={(animation) => {
            this.animationName = animation;
          }}
          style={styles.metamaskName}
          loop={false}
          source={wordmark}
        />
      </View>
    );
  }

  render() {
    const styles = this.getStyles();

    return (
      <View style={[baseStyles.flexGrow, styles.container]}>
        <Animated.View style={[styles.logoWrapper, { opacity: this.opacity }]}>
          <View style={styles.fox}>{this.renderAnimations()}</View>
        </Animated.View>
      </View>
    );
  }
}

interface UserState {
  appTheme?: string;
}

interface RootStateLike {
  user: UserState;
  [key: string]: unknown;
}

const mapStateToProps = (state: RootStateLike): LockScreenStateProps => ({
  appTheme: state.user.appTheme,
});

(LockScreen as unknown as { contextType: typeof ThemeContext }).contextType =
  ThemeContext;

const ConnectedLockScreen = connect(mapStateToProps)(LockScreen);

interface LockScreenFCWrapperProps {
  // Navigation object that holds params including bioStateMachineId.
  route?: { params?: { bioStateMachineId?: string; [key: string]: unknown } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
}

// Wrapper that forces LockScreen to re-render when bioStateMachineId changes.
const LockScreenFCWrapper = (props: LockScreenFCWrapperProps) => {
  const bioStateMachineId = props.route?.params?.bioStateMachineId;
  return (
    <ConnectedLockScreen
      key={bioStateMachineId}
      bioStateMachineId={bioStateMachineId}
      {...(props as unknown as Record<string, unknown>)}
    />
  );
};

export default LockScreenFCWrapper;
