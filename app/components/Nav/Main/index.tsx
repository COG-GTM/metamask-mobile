import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from 'react';

import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  View,
  Linking,
  type AppStateStatus,
} from 'react-native';
import NetInfo, {
  type NetInfoSubscription,
} from '@react-native-community/netinfo';
import { connect, useSelector } from 'react-redux';
import type { Dispatch } from 'redux';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import type { Theme } from '../../../util/theme/models';
import type { RootState } from '../../../reducers';
import GlobalAlert from '../../UI/GlobalAlert';
import BackgroundTimer from 'react-native-background-timer';
import NotificationManager from '../../../core/NotificationManager';
import Engine from '../../../core/Engine';
import AppConstants from '../../../core/AppConstants';
import I18n, { strings } from '../../../../locales/i18n';
import FadeOutOverlay from '../../UI/FadeOutOverlay';
import BackupAlert from '../../UI/BackupAlert';
import Notification from '../../UI/Notification';
import RampOrders from '../../UI/Ramp';
import {
  showTransactionNotification,
  hideCurrentNotification,
  showSimpleNotification,
  removeNotificationById,
  removeNotVisibleNotifications,
} from '../../../actions/notification';

import ProtectYourWalletModal from '../../UI/ProtectYourWalletModal';
import MainNavigator from './MainNavigator';
import SkipAccountSecurityModal from '../../UI/SkipAccountSecurityModal';
import { query } from '@metamask/controller-utils';
import SwapsLiveness from '../../UI/Swaps/SwapsLiveness';

import {
  setInfuraAvailabilityBlocked,
  setInfuraAvailabilityNotBlocked,
} from '../../../actions/infuraAvailability';

import { createStackNavigator } from '@react-navigation/stack';
import ReviewModal from '../../UI/ReviewModal';
import { useTheme } from '../../../util/theme';
import RootRPCMethodsUI from './RootRPCMethodsUI';
import {
  ToastContext,
  ToastVariants,
} from '../../../component-library/components/Toast';
import { useEnableAutomaticSecurityChecks } from '../../hooks/EnableAutomaticSecurityChecks';
import { useMinimumVersions } from '../../hooks/MinimumVersions';
import navigateTermsOfUse from '../../../util/termsOfUse/termsOfUse';
import {
  selectChainId,
  selectIsAllNetworks,
  selectNetworkClientId,
  selectNetworkConfigurations,
  selectProviderConfig,
  selectProviderType,
} from '../../../selectors/networkController';
import {
  selectNetworkName,
  selectNetworkImageSource,
} from '../../../selectors/networkInfos';
import {
  selectShowIncomingTransactionNetworks,
  selectTokenNetworkFilter,
} from '../../../selectors/preferencesController';

import useNotificationHandler from '../../../util/notifications/hooks';
import {
  DEPRECATED_NETWORKS,
  NETWORKS_CHAIN_ID,
} from '../../../constants/network';
import WarningAlert from '../../../components/UI/WarningAlert';
import { GOERLI_DEPRECATED_ARTICLE } from '../../../constants/urls';
import {
  updateIncomingTransactions,
  startIncomingTransactionPolling,
  stopIncomingTransactionPolling,
} from '../../../util/transaction-controller';
import isNetworkUiRedesignEnabled from '../../../util/networks/isNetworkUiRedesignEnabled';
import { useConnectionHandler } from '../../../util/navigation/useConnectionHandler';
import { getGlobalEthQuery } from '../../../util/networks/global-network';
import { selectIsEvmNetworkSelected } from '../../../selectors/multichainNetworkController';
import { isPortfolioViewEnabled } from '../../../util/networks';
import { useIdentityEffects } from '../../../util/identity/hooks/useIdentityEffects/useIdentityEffects';

const Stack = createStackNavigator();

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    loader: {
      backgroundColor: colors.background.default,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

interface NavigationParams {
  [key: string]: unknown;
}

interface MainProps {
  navigation: NavigationProp<Record<string, object | undefined>>;
  route: RouteProp<Record<string, NavigationParams | undefined>, string>;
  chainId: string;
  networkClientId: string;
  providerType?: string;
  backUpSeedphraseVisible?: boolean;
  networkConfigurations: Record<string, unknown>;
  showIncomingTransactionsNetworks: Record<string, boolean>;
  showTransactionNotification: (args: unknown) => void;
  showSimpleNotification: (args: unknown) => void;
  hideCurrentNotification: () => void;
  removeNotificationById: (id: string) => void;
  setInfuraAvailabilityBlocked: () => void;
  setInfuraAvailabilityNotBlocked: () => void;
  removeNotVisibleNotifications: () => void;
}

const Main = (props: MainProps) => {
  const [forceReload, setForceReload] = useState(false);
  const [showRemindLaterModal, setShowRemindLaterModal] = useState(false);
  const [skipCheckbox, setSkipCheckbox] = useState(false);
  const [showDeprecatedAlert, setShowDeprecatedAlert] = useState(true);
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const backgroundMode = useRef<boolean>(false);
  const locale = useRef<string>(I18n.locale);
  const removeConnectionStatusListener = useRef<
    NetInfoSubscription | undefined
  >(undefined);

  const { connectionChangeHandler } = useConnectionHandler(props.navigation);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const removeNotVisibleNotifications = props.removeNotVisibleNotifications;
  useNotificationHandler();
  useIdentityEffects();
  useEnableAutomaticSecurityChecks();
  useMinimumVersions();

  const { chainId, networkClientId, showIncomingTransactionsNetworks } = props;

  useEffect(() => {
    if (
      (DEPRECATED_NETWORKS as readonly string[]).includes(props.chainId)
    ) {
      setShowDeprecatedAlert(true);
    } else {
      setShowDeprecatedAlert(false);
    }
  }, [props.chainId]);

  useEffect(() => {
    stopIncomingTransactionPolling();
    startIncomingTransactionPolling();
  }, [
    chainId,
    networkClientId,
    showIncomingTransactionsNetworks,
    props.networkConfigurations,
  ]);

  const checkInfuraAvailability = useCallback(async () => {
    if (props.providerType !== 'rpc') {
      try {
        const ethQuery = getGlobalEthQuery();
        await query(ethQuery, 'blockNumber', []);
        props.setInfuraAvailabilityNotBlocked();
      } catch (e) {
        if (
          (e as Error)?.message ===
          AppConstants.ERRORS.INFURA_BLOCKED_MESSAGE
        ) {
          props.navigation.navigate('OfflineModeView');
          props.setInfuraAvailabilityBlocked();
        }
      }
    } else {
      props.setInfuraAvailabilityNotBlocked();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.navigation,
    props.providerType,
    props.setInfuraAvailabilityBlocked,
    props.setInfuraAvailabilityNotBlocked,
  ]);

  const handleAppStateChange = useCallback(
    (appState: AppStateStatus) => {
      const newModeIsBackground = appState === 'background';

      // If it was in background and it's not anymore
      // we need to stop the Background timer
      if (backgroundMode.current && !newModeIsBackground) {
        BackgroundTimer.stop();
      }

      backgroundMode.current = newModeIsBackground;

      // If the app is now in background, we need to start
      // the background timer, which is less intense
      if (backgroundMode.current) {
        removeNotVisibleNotifications();

        BackgroundTimer.runBackgroundTimer(async () => {
          await updateIncomingTransactions();
        }, AppConstants.TX_CHECK_BACKGROUND_FREQUENCY);
      }
    },
    [backgroundMode, removeNotVisibleNotifications],
  );

  const initForceReload = () => {
    // Force unmount the webview to avoid caching problems
    setForceReload(true);
    setTimeout(() => {
      setForceReload(false);
    }, 1000);
  };

  const renderLoader = () => (
    <View style={styles.loader}>
      <ActivityIndicator size="small" />
    </View>
  );

  const toggleRemindLater = () => {
    setShowRemindLaterModal(!showRemindLaterModal);
  };

  const toggleSkipCheckbox = () => {
    setSkipCheckbox(!skipCheckbox);
  };

  const skipAccountModalSecureNow = () => {
    toggleRemindLater();
    props.navigation.navigate('SetPasswordFlow', {
      screen: 'AccountBackupStep1B',
      params: { ...props.route.params },
    });
  };

  const skipAccountModalSkip = () => {
    if (skipCheckbox) toggleRemindLater();
  };

  /**
   * Current network
   */
  const providerConfig = useSelector(selectProviderConfig);
  const networkConfigurations = useSelector(selectNetworkConfigurations);
  const networkName = useSelector(selectNetworkName);
  const isEvmSelected = useSelector(selectIsEvmNetworkSelected);
  const previousProviderConfig = useRef<
    { chainId: string; type?: string } | undefined
  >(undefined);
  const previousNetworkConfigurations = useRef<
    Record<string, unknown> | undefined
  >(undefined);
  const { toastRef } = useContext(ToastContext);
  const networkImage = useSelector(selectNetworkImageSource);

  const isAllNetworks = useSelector(selectIsAllNetworks);
  const tokenNetworkFilter = useSelector(selectTokenNetworkFilter);

  const hasNetworkChanged = useCallback(
    (
      currentChainId: string,
      previousConfig: { chainId: string; type?: string } | undefined,
      currentIsEvmSelected: boolean,
    ) => {
      if (!previousConfig) return false;

      return currentIsEvmSelected
        ? currentChainId !== previousConfig.chainId ||
            providerConfig.type !== previousConfig.type
        : currentChainId !== previousConfig.chainId;
    },
    [providerConfig.type],
  );

  // Show network switch confirmation.
  useEffect(() => {
    if (
      hasNetworkChanged(chainId, previousProviderConfig.current, isEvmSelected)
    ) {
      //set here token network filter if portfolio view is enabled
      if (isPortfolioViewEnabled()) {
        const { PreferencesController } = Engine.context;
        const preferencesControllerLoose =
          PreferencesController as unknown as {
            setTokenNetworkFilter: (
              filter: Record<string, boolean>,
            ) => void;
          };
        if (Object.keys(tokenNetworkFilter).length === 1) {
          preferencesControllerLoose.setTokenNetworkFilter({
            [chainId]: true,
          });
        } else {
          preferencesControllerLoose.setTokenNetworkFilter({
            ...tokenNetworkFilter,
            [chainId]: true,
          });
        }
      }
      toastRef?.current?.showToast({
        variant: ToastVariants.Network,
        labelOptions: [
          {
            label: `${networkName} `,
            isBold: true,
          },
          { label: strings('toast.now_active') },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        networkImageSource: networkImage as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }
    previousProviderConfig.current = !isEvmSelected
      ? { chainId }
      : (providerConfig as { chainId: string; type?: string });
  }, [
    providerConfig,
    networkName,
    networkImage,
    toastRef,
    chainId,
    isEvmSelected,
    hasNetworkChanged,
    isAllNetworks,
    tokenNetworkFilter,
  ]);

  // Show add network confirmation.
  useEffect(() => {
    if (!isNetworkUiRedesignEnabled()) return;

    // Memoized values to avoid recalculations
    const currentNetworkValues = Object.values(networkConfigurations);
    const previousNetworkValues = Object.values(
      previousNetworkConfigurations.current ?? {},
    );

    if (
      previousNetworkValues.length &&
      currentNetworkValues.length !== previousNetworkValues.length
    ) {
      // Find the newly added network
      const newNetwork = (
        currentNetworkValues as unknown[]
      ).find(
        (network) => !(previousNetworkValues as unknown[]).includes(network),
      ) as { name?: string } | undefined;
      const deletedNetwork = (
        previousNetworkValues as unknown[]
      ).find(
        (network) => !(currentNetworkValues as unknown[]).includes(network),
      ) as { name?: string } | undefined;

      toastRef?.current?.showToast({
        variant: ToastVariants.Plain,
        labelOptions: [
          {
            label: `${
              (newNetwork?.name || deletedNetwork?.name) ??
              strings('asset_details.network')
            } `,
            isBold: true,
          },
          {
            label: deletedNetwork
              ? strings('toast.network_removed')
              : strings('toast.network_added'),
          },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        networkImageSource: networkImage as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }
    previousNetworkConfigurations.current = networkConfigurations;
  }, [networkConfigurations, networkName, networkImage, toastRef]);

  useEffect(() => {
    if (locale.current !== I18n.locale) {
      locale.current = I18n.locale;
      initForceReload();
      return;
    }
  });

  // Remove all notifications that aren't visible
  useEffect(() => {
    removeNotVisibleNotifications();
  }, [removeNotVisibleNotifications]);

  useEffect(() => {
    const appStateListener = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    setTimeout(() => {
      NotificationManager.init({
        navigation: props.navigation,
        showTransactionNotification: props.showTransactionNotification,
        hideCurrentNotification: props.hideCurrentNotification,
        showSimpleNotification: props.showSimpleNotification,
        removeNotificationById: props.removeNotificationById,
      });
      checkInfuraAvailability();
      removeConnectionStatusListener.current = NetInfo.addEventListener(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connectionChangeHandler as any,
      );
    }, 1000);

    return function cleanup() {
      appStateListener.remove();
      removeConnectionStatusListener.current &&
        removeConnectionStatusListener.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionChangeHandler]);

  const termsOfUse = useCallback(async () => {
    if (props.navigation) {
      await navigateTermsOfUse(props.navigation.navigate);
    }
  }, [props.navigation]);

  useEffect(() => {
    termsOfUse();
  }, [termsOfUse]);

  const openDeprecatedNetworksArticle = () => {
    Linking.openURL(GOERLI_DEPRECATED_ARTICLE);
  };

  const renderDeprecatedNetworkAlert = (
    currentChainId: string,
    backUpSeedphraseVisible?: boolean,
  ) => {
    if (
      (DEPRECATED_NETWORKS as readonly string[]).includes(currentChainId) &&
      showDeprecatedAlert
    ) {
      if (NETWORKS_CHAIN_ID.MUMBAI === currentChainId) {
        return (
          <WarningAlert
            text={strings('networks.network_deprecated_title')}
            dismissAlert={() => setShowDeprecatedAlert(false)}
            precedentAlert={backUpSeedphraseVisible}
          />
        );
      }
      return (
        <WarningAlert
          text={strings('networks.deprecated_goerli')}
          dismissAlert={() => setShowDeprecatedAlert(false)}
          onPressLearnMore={openDeprecatedNetworksArticle}
          precedentAlert={backUpSeedphraseVisible}
        />
      );
    }
  };

  return (
    <React.Fragment>
      <View style={styles.flex}>
        {!forceReload ? (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - legacy navigation prop typing
          <MainNavigator navigation={props.navigation} />
        ) : (
          renderLoader()
        )}
        <GlobalAlert />
        <FadeOutOverlay />
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore - legacy connect HOC strips prop typing */}
        <Notification navigation={props.navigation} />
        <RampOrders />
        <SwapsLiveness />
        <BackupAlert
          onDismiss={toggleRemindLater}
          navigation={props.navigation}
        />
        {renderDeprecatedNetworkAlert(
          props.chainId,
          props.backUpSeedphraseVisible,
        )}
        <SkipAccountSecurityModal
          modalVisible={showRemindLaterModal}
          onCancel={skipAccountModalSecureNow}
          onConfirm={skipAccountModalSkip}
          skipCheckbox={skipCheckbox}
          toggleSkipCheckbox={toggleSkipCheckbox}
        />
        <ProtectYourWalletModal navigation={props.navigation} />
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore - legacy connect HOC strips prop typing */}
        <RootRPCMethodsUI navigation={props.navigation} />
      </View>
    </React.Fragment>
  );
};

(Main as unknown as { router: unknown }).router = (
  MainNavigator as unknown as { router: unknown }
).router;

const mapStateToProps = (state: RootState) => ({
  showIncomingTransactionsNetworks:
    selectShowIncomingTransactionNetworks(state),
  providerType: selectProviderType(state),
  chainId: selectChainId(state),
  networkClientId: selectNetworkClientId(state),
  backUpSeedphraseVisible: (
    state as unknown as { user: { backUpSeedphraseVisible: boolean } }
  ).user.backUpSeedphraseVisible,
  networkConfigurations: selectNetworkConfigurations(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  showTransactionNotification: (args: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dispatch(showTransactionNotification(args as any)),
  showSimpleNotification: (args: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dispatch(showSimpleNotification(args as any)),
  hideCurrentNotification: () => dispatch(hideCurrentNotification()),
  removeNotificationById: (id: string) => dispatch(removeNotificationById(id)),
  setInfuraAvailabilityBlocked: () => dispatch(setInfuraAvailabilityBlocked()),
  setInfuraAvailabilityNotBlocked: () =>
    dispatch(setInfuraAvailabilityNotBlocked()),
  removeNotVisibleNotifications: () =>
    dispatch(removeNotVisibleNotifications()),
});

const ConnectedMain = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Main as unknown as React.ComponentType<unknown>);

const MainFlow = () => (
  <Stack.Navigator
    initialRouteName={'Main'}
    // `mode` is a legacy React Navigation prop that is silently ignored at
    // runtime by the current version; preserved to avoid behaviour changes
    // during the JS → TS migration.
    {...({ mode: 'modal' } as object)}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name={'Main'} component={ConnectedMain} />
    <Stack.Screen
      name={'ReviewModal'}
      component={ReviewModal}
      options={{ animationEnabled: false }}
    />
  </Stack.Navigator>
);

export default MainFlow;
