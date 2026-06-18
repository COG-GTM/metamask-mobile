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
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { connect, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { RootState } from '../../../reducers';
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

interface StateProps {
  showIncomingTransactionsNetworks: Record<string, boolean>;
  providerType: string;
  chainId: string;
  networkClientId: string;
  backUpSeedphraseVisible: boolean;
  networkConfigurations: Record<string, unknown>;
}

interface DispatchProps {
  showTransactionNotification: (args: Record<string, unknown>) => void;
  showSimpleNotification: (args: Record<string, unknown>) => void;
  hideCurrentNotification: () => void;
  removeNotificationById: (id: string) => void;
  setInfuraAvailabilityBlocked: () => void;
  setInfuraAvailabilityNotBlocked: () => void;
  removeNotVisibleNotifications: () => void;
}

interface OwnProps {
  navigation: Record<string, (...args: unknown[]) => unknown>;
  route: Record<string, unknown>;
}

type MainProps = OwnProps & StateProps & DispatchProps;

const createStyles = (colors: Record<string, Record<string, string>>) =>
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

const Main = (props: MainProps) => {
  const [forceReload, setForceReload] = useState(false);
  const [showRemindLaterModal, setShowRemindLaterModal] = useState(false);
  const [skipCheckbox, setSkipCheckbox] = useState(false);
  const [showDeprecatedAlert, setShowDeprecatedAlert] = useState(true);
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const backgroundMode = useRef(false);
  const locale = useRef(I18n.locale);
  const removeConnectionStatusListener = useRef<(() => void) | null>(null);

  const { connectionChangeHandler } = useConnectionHandler(props.navigation);

  const removeNotVisibleNotifications = props.removeNotVisibleNotifications;
  useNotificationHandler();
  useIdentityEffects();
  useEnableAutomaticSecurityChecks();
  useMinimumVersions();

  const { chainId, networkClientId, showIncomingTransactionsNetworks } = props;

  useEffect(() => {
    if (DEPRECATED_NETWORKS.includes(props.chainId as typeof DEPRECATED_NETWORKS[number])) {
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
        if ((e as Error).message === AppConstants.ERRORS.INFURA_BLOCKED_MESSAGE) {
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
    (appState: string) => {
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
      params: { ...(props.route.params as Record<string, unknown>) },
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
  const previousProviderConfig = useRef<Record<string, unknown> | undefined>(undefined);
  const previousNetworkConfigurations = useRef<Record<string, unknown> | undefined>(undefined);
  const { toastRef } = useContext(ToastContext);
  const networkImage = useSelector(selectNetworkImageSource);

  const isAllNetworks = useSelector(selectIsAllNetworks);
  const tokenNetworkFilter = useSelector(selectTokenNetworkFilter);

  const hasNetworkChanged = useCallback(
    (chainId: string, previousConfig: Record<string, unknown> | undefined, isEvmSelected: boolean) => {
      if (!previousConfig) return false;

      return isEvmSelected
        ? chainId !== previousConfig.chainId ||
            providerConfig.type !== previousConfig.type
        : chainId !== previousConfig.chainId;
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
        if (Object.keys(tokenNetworkFilter).length === 1) {
          PreferencesController.setTokenNetworkFilter({
            [chainId]: true,
          });
        } else {
          PreferencesController.setTokenNetworkFilter({
            ...tokenNetworkFilter,
            [chainId]: true,
          } as Record<string, boolean>);
        }
      }
      // @ts-expect-error toast options type mismatch with ToastContext
      toastRef?.current?.showToast({
        variant: ToastVariants.Network,
        labelOptions: [
          {
            label: `${networkName} `,
            isBold: true,
          },
          { label: strings('toast.now_active') },
        ],
        networkImageSource: networkImage,
      });
    }
    previousProviderConfig.current = !isEvmSelected
      ? { chainId }
      : providerConfig as unknown as Record<string, unknown>;
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
      const newNetwork = currentNetworkValues.find(
        (network) => !(previousNetworkValues as unknown[]).includes(network),
      ) as Record<string, unknown> | undefined;
      const deletedNetwork = previousNetworkValues.find(
        (network) => !(currentNetworkValues as unknown[]).includes(network),
      ) as Record<string, unknown> | undefined;

      const showToastFn = (toastRef?.current as unknown as { showToast?: (...args: unknown[]) => void })?.showToast;
      showToastFn?.({
        variant: ToastVariants.Plain,
        labelOptions: [
          {
            label: `${
              ((newNetwork?.name as string) || (deletedNetwork?.name as string)) ??
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
        networkImageSource: networkImage,
      });
    }
    previousNetworkConfigurations.current = networkConfigurations as unknown as Record<string, unknown>;
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
      } as unknown as Parameters<typeof NotificationManager.init>[0]);
      checkInfuraAvailability();
      removeConnectionStatusListener.current = NetInfo.addEventListener(
        connectionChangeHandler as Parameters<typeof NetInfo.addEventListener>[0],
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

  const renderDeprecatedNetworkAlert = (chainId: string, backUpSeedphraseVisible: boolean) => {
    if (DEPRECATED_NETWORKS.includes(chainId as typeof DEPRECATED_NETWORKS[number]) && showDeprecatedAlert) {
      if (NETWORKS_CHAIN_ID.MUMBAI === chainId) {
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
          <MainNavigator {...{ navigation: props.navigation } as Record<string, unknown>} />
        ) : (
          renderLoader()
        )}
        <GlobalAlert />
        <FadeOutOverlay />
        <Notification {...{ navigation: props.navigation } as Record<string, unknown>} />
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
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {React.createElement(RootRPCMethodsUI as unknown as React.ComponentType<Record<string, unknown>>, { navigation: props.navigation })}
      </View>
    </React.Fragment>
  );
};

(Main as unknown as Record<string, unknown>).router = (MainNavigator as unknown as Record<string, unknown>).router;



const mapStateToProps = (state: RootState) => ({
  showIncomingTransactionsNetworks:
    selectShowIncomingTransactionNetworks(state),
  providerType: selectProviderType(state),
  chainId: selectChainId(state),
  networkClientId: selectNetworkClientId(state),
  backUpSeedphraseVisible: state.user.backUpSeedphraseVisible,
  networkConfigurations: selectNetworkConfigurations(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  showTransactionNotification: (args: Record<string, unknown>) =>
    dispatch(showTransactionNotification(args as Parameters<typeof showTransactionNotification>[0])),
  showSimpleNotification: (args: Record<string, unknown>) => dispatch(showSimpleNotification(args as Parameters<typeof showSimpleNotification>[0])),
  hideCurrentNotification: () => dispatch(hideCurrentNotification()),
  removeNotificationById: (id: string) => dispatch(removeNotificationById(id)),
  setInfuraAvailabilityBlocked: () => dispatch(setInfuraAvailabilityBlocked()),
  setInfuraAvailabilityNotBlocked: () =>
    dispatch(setInfuraAvailabilityNotBlocked()),
  removeNotVisibleNotifications: () =>
    dispatch(removeNotVisibleNotifications()),
});

const ConnectedMain = connect(mapStateToProps, mapDispatchToProps)(Main);

const MainFlow = () => (
  <Stack.Navigator
    initialRouteName={'Main'}
    mode={'modal'}
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
