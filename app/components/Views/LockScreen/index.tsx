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
  ImageStyle,
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
import { Theme } from '../../../util/theme/models';

interface Styles {
  container: ViewStyle;
  metamaskName: ViewStyle;
  logoWrapper: ViewStyle;
  foxAndName: ViewStyle;
  animation: ViewStyle;
  fox: ViewStyle;
}

const LOGO_SIZE = 175;
const createStyles = (colors: Theme['colors']): Styles =>
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

interface LockScreenProps {
  navigation: {
    navigate: (route: string, params?: object) => void;
    dispatch: (action: unknown) => void;
  };
  appTheme: string;
  bioStateMachineId: string;
}

interface LockScreenState {
  ready: boolean;
}

class LockScreen extends PureComponent<LockScreenProps, LockScreenState> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  state: LockScreenState = {
    ready: false,
  };

  locked = true;
  timedOut = false;
  firstAnimation: LottieView | null = null;
  secondAnimation: LottieView | null = null;
  animationName: LottieView | null = null;
  opacity = new Animated.Value(1);
  appStateListener: NativeEventSubscription | undefined;

  componentDidMount(): void {
    this.appStateListener = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );
  }

  handleAppStateChange = async (nextAppState: string): Promise<void> => {
    if (nextAppState === 'active') {
      this.firstAnimation?.play();
      this.unlockKeychain();
      this.appStateListener?.remove();
    }
  };

  componentWillUnmount(): void {
    this.appStateListener?.remove();
  }

  lock = (): void => {
    const resetAction = CommonActions.reset({
      index: 0,
      routes: [{ name: Routes.ONBOARDING.LOGIN }],
    });
    this.props.navigation.dispatch(resetAction);
    Authentication.lockApp({ reset: false });
  };

  async unlockKeychain(): Promise<void> {
    const { bioStateMachineId } = this.props;
    try {
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

  onAnimationFinished = (): void => {
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

  getStyles = (): Styles => {
    const colors = this.context?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderAnimations(): React.ReactElement {
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

  render(): React.ReactElement {
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

const mapStateToProps = (
  state: RootState,
): {
  appTheme: string;
} => ({
  appTheme: state.user.appTheme,
});

const ConnectedLockScreen = connect(mapStateToProps)(LockScreen);

interface LockScreenFCWrapperProps {
  route: {
    params: {
      bioStateMachineId: string;
    };
  };
  navigation: {
    navigate: (route: string, params?: object) => void;
    dispatch: (action: unknown) => void;
  };
}

const LockScreenFCWrapper: React.FC<LockScreenFCWrapperProps> = (props) => {
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
