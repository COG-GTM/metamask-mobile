/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
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
} from 'react-native';
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
// @ts-expect-error -- legacy JavaScript UI type boundary
import Button from '@metamask/react-native-button';
import { connect } from 'react-redux';
import FadeOutOverlay from '../../UI/FadeOutOverlay';
import {
  getTransparentBackOnboardingNavbarOptions,
  getTransparentOnboardingNavbarOptions,
} from '../../UI/Navbar';
import Device from '../../../util/device';
import BaseNotification from '../../UI/Notification/BaseNotification';
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

// @ts-expect-error -- legacy JavaScript UI type boundary
const createStyles = (colors) =>
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

/**
 * View that is displayed to first time (new) users
 */
class Onboarding extends PureComponent {

  notificationAnimated = new Animated.Value(100);
  detailsYAnimated = new Animated.Value(0);
  actionXAnimated = new Animated.Value(0);
  detailsAnimated = new Animated.Value(0);

  // @ts-expect-error -- legacy JavaScript UI type boundary
  animatedTimingStart = (animatedRef, toValue) => {
    Animated.timing(animatedRef, {
      toValue,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  state = {
    warningModalVisible: false,
    loading: false,
    existingUser: false,
  };

  seedwords = null;
  importedAccounts = null;
  channelName = null;
  incomingDataStr = '';
  dataToSync = null;
  mounted = false;

  warningCallback = () => true;

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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { route, navigation } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.disableNewPrivacyPolicyToast();

    InteractionManager.runAfterInteractions(() => {
      PreventScreenshot.forbid();
      // @ts-expect-error -- legacy JavaScript UI type boundary
      if (this.props.route.params?.delete) {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.setLoading(strings('onboarding.delete_current'));
        setTimeout(() => {
          this.showNotification();
          // @ts-expect-error -- legacy JavaScript UI type boundary
          this.props.unsetLoading();
        }, 2000);
      }
    });
  }

  componentWillUnmount() {
    this.mounted = false;
    // @ts-expect-error -- legacy JavaScript UI type boundary
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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { passwordSet } = this.props;
    if (!passwordSet) {
      await Authentication.resetVault();
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.navigation.replace(Routes.ONBOARDING.HOME_NAV);
    } else {
      await Authentication.lockApp();
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.navigation.replace(Routes.ONBOARDING.LOGIN);
    }
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  handleExistingUser = (action) => {
    if (this.state.existingUser) {
      this.alertExistingUser(action);
    } else {
      action();
    }
  };

  onPressCreate = () => {
    const action = () => {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      const { metrics } = this.props;
      if (metrics.isEnabled()) {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.navigation.navigate('ChoosePassword', {
          [PREVIOUS_SCREEN]: ONBOARDING,
        });
        this.track(MetaMetricsEvents.WALLET_SETUP_STARTED);
      } else {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.navigation.navigate('OptinMetrics', {
          onContinue: () => {
            // @ts-expect-error -- legacy JavaScript UI type boundary
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
      // @ts-expect-error -- legacy JavaScript UI type boundary
      const { metrics } = this.props;
      if (metrics.isEnabled()) {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.navigation.push(
          Routes.ONBOARDING.IMPORT_FROM_SECRET_RECOVERY_PHRASE,
        );
        this.track(MetaMetricsEvents.WALLET_IMPORT_STARTED);
      } else {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.navigation.navigate('OptinMetrics', {
          onContinue: () => {
            // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  track = (event) => {
    trackOnboarding(MetricsEventBuilder.createEventBuilder(event).build());
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  alertExistingUser = (callback) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.wrapper}>
        <View style={styles.loader}>
          <ActivityIndicator size="small" />
          {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
          <Text style={styles.loadingText}>{this.props.loadingMsg}</Text>
        </View>
      </View>
    );
  };

  renderContent() {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    // @ts-expect-error -- legacy JavaScript UI type boundary
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
            // @ts-expect-error -- legacy JavaScript UI type boundary
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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { loading } = this.props;
    const { existingUser } = this.state;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
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

Onboarding.contextType = ThemeContext;

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapStateToProps = (state) => ({
  accounts: selectAccounts(state),
  passwordSet: state.user.passwordSet,
  loading: state.user.loadingSet,
  loadingMsg: state.user.loadingMsg,
});

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapDispatchToProps = (dispatch) => ({
  // @ts-expect-error -- legacy JavaScript UI type boundary
  setLoading: (msg) => dispatch(loadingSet(msg)),
  unsetLoading: () => dispatch(loadingUnset()),
  disableNewPrivacyPolicyToast: () =>
    dispatch(storePrivacyPolicyClickedOrClosedAction()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
// @ts-expect-error -- legacy JavaScript UI type boundary
)(withMetricsAwareness(Onboarding));

interface OnboardingProps {
  disableNewPrivacyPolicyToast?: (...args: any[]) => any;
  loading?: boolean;
  loadingMsg?: string;
  metrics?: Record<string, any>;
  navigation?: Record<string, any>;
  passwordSet?: boolean;
  route?: Record<string, any>;
  setLoading?: (...args: any[]) => any;
  unsetLoading?: (...args: any[]) => any;
}
type Props = OnboardingProps;
