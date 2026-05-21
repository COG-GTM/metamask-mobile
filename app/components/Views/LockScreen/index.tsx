/* eslint-disable import/no-commonjs */
import React, { PureComponent } from 'react';
import {
  StyleSheet,
  Dimensions,
  Animated,
  View,
  AppState,
  Appearance,
} from 'react-native';
import { connect } from 'react-redux';
import LottieView from 'lottie-react-native';
import { baseStyles } from '../../../styles/common';
import Logger from '../../../util/Logger';
import { Authentication } from '../../../core';
import {
  getAssetFromTheme,
  mockTheme,
  ThemeContext,
} from '../../../util/theme';
import Routes from '../../../constants/navigation/Routes';
import { CommonActions } from '@react-navigation/native';
import trackErrorAsAnalytics from '../../../util/metrics/TrackError/trackErrorAsAnalytics';
import { RootState } from '../../../reducers';
import type { ThemeColors } from '@metamask/design-tokens';

const LOGO_SIZE = 175;
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    metamaskName: {
      marginTop: 10,
      height: 25,
      width: 170,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoWrapper: {
      marginTop: Dimensions.get('window').height / 2 - LOGO_SIZE / 2,
      height: LOGO_SIZE,
    },
    foxAndName: {
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    animation: {
      width: 110,
      height: 110,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fox: {
      width: 110,
      height: 110,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

const wordmarkLight = require('../../../animations/wordmark-light.json');
const wordmarkDark = require('../../../animations/wordmark-dark.json');

/**
 * Main view component for the Lock screen
 */
interface OwnProps {
  bioStateMachineId?: string;
  message?: unknown;
  play?: unknown;
}

interface StateProps {
  appTheme: string;
}

type Props = OwnProps & StateProps & {
  navigation: {
    navigate: (route: string, params?: Record<string, unknown>) => void;
    dispatch: (action: unknown) => void;
  };
};

interface State {
  ready: boolean;
}

class LockScreen extends PureComponent<Props, State> {

  state = {
    ready: false,
  };

  locked = true;
  timedOut = false;
  firstAnimation = React.createRef();
  secondAnimation = React.createRef();
  animationName = React.createRef();
  opacity = new Animated.Value(1);
  appStateListener;

  componentDidMount() {
    this.appStateListener = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );
  }

  handleAppStateChange = async (nextAppState: string) => {
    // Trigger biometrics
    if (nextAppState === 'active') {
      this.firstAnimation?.play();
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
        error?.message,
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
    const colors = this.context.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderAnimations() {
    const { appTheme } = this.props;
    const osColorScheme = Appearance.getColorScheme();
    const wordmark = getAssetFromTheme(
      appTheme,
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

const mapStateToProps = (state: RootState) => ({
  appTheme: state.user.appTheme,
});

LockScreen.contextType = ThemeContext;

const ConnectedLockScreen = connect(mapStateToProps)(LockScreen);

// Wrapper that forces LockScreen to re-render when bioStateMachineId changes.
const LockScreenFCWrapper = (props: { route: { params: { bioStateMachineId: string } } }) => {
  const { bioStateMachineId } = props.route.params;
  return (
    <ConnectedLockScreen
      key={bioStateMachineId}
      bioStateMachineId={bioStateMachineId}
      {...props}
    />
  );
};


export default LockScreenFCWrapper;
