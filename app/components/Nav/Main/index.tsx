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
  AppStateStatus,
  StyleSheet,
  View,
  Linking,
  ViewStyle,
} from 'react-native';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { connect, useSelector } from 'react-redux';
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
import { RootState } from '../../../reducers';
import { Dispatch, AnyAction } from 'redux';
import { Hex } from '@metamask/utils';
import {
  MultichainNetworkConfiguration,
  SupportedCaipChainId,
} from '@metamask/multichain-network-controller';

interface MainNavigatorType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router?: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Stack = createStackNavigator<any>();

interface Colors {
  background: {
    default: string;
  };
}

interface Styles {
  flex: ViewStyle;
  loader: ViewStyle;
}

const createStyles = (colors: Colors): Styles =>
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

interface TransactionNotificationArgs {
  autodismiss?: number;
  transaction: {
    id?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  status: string;
}

interface SimpleNotificationArgs {
  autodismiss?: number;
  title: string;
  description: string;
  status: string;
  id?: string;
}

interface RouteParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface MainProps {
  navigation: {
    navigate: (route: string, params?: RouteParams) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  route?: {
    params?: RouteParams;
  };
  showTransactionNotification: (args: TransactionNotificationArgs) => void;
  showSimpleNotification: (args: SimpleNotificationArgs) => void;
  hideCurrentNotification: () => void;
  removeNotificationById: (id: string) => void;
  showIncomingTransactionsNetworks: Record<string, boolean>;
  providerType: string;
  setInfuraAvailabilityBlocked: () => void;
  setInfuraAvailabilityNotBlocked: () => void;
  removeNotVisibleNotifications: () => void;
  chainId: Hex | SupportedCaipChainId;
  backUpSeedphraseVisible: boolean;
  networkClientId: string;
  networkConfigurations: Record<string, MultichainNetworkConfiguration>;
}

interface PreviousProviderConfig {
  chainId: Hex | SupportedCaipChainId;
  type?: string;
}

const Main: React.FC<MainProps> & MainNavigatorType = (props) => {
  const [forceReload, setForceReload] = useState<boolean>(false);
  const [showRemindLaterModal, setShowRemindLaterModal] =
    useState<boolean>(false);
  const [skipCheckbox, setSkipCheckbox] = useState<boolean>(false);
  const [showDeprecatedAlert, setShowDeprecatedAlert] = useState<boolean>(true);
  const { colors } = useTheme();
  const styles = createStyles(colors as Colors);
  const backgroundMode = useRef<boolean>(false);
  const locale = useRef<string>(I18n.locale);
  const removeConnectionStatusListener = useRef<
    NetInfoSubscription | undefined
  >();

  const { connectionChangeHandler } = useConnectionHandler(props.navigation);

  const removeNotVisibleNotificationsCallback = props.removeNotVisibleNotifications;
  useNotificationHandler();
  useIdentityEffects();
  useEnableAutomaticSecurityChecks();
  useMinimumVersions();

  const { chainId, networkClientId, showIncomingTransactionsNetworks } = props;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (DEPRECATED_NETWORKS.includes(props.chainId as any)) {
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
          (e as Error).message === AppConstants.ERRORS.INFURA_BLOCKED_MESSAGE
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
        removeNotVisibleNotificationsCallback();

        BackgroundTimer.runBackgroundTimer(async () => {
          await updateIncomingTransactions();
        }, AppConstants.TX_CHECK_BACKGROUND_FREQUENCY);
      }
    },
    [backgroundMode, removeNotVisibleNotificationsCallback],
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
      params: { ...props.route?.params },
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
  const previousProviderConfig = useRef<PreviousProviderConfig | undefined>(
    undefined,
  );
  const previousNetworkConfigurations = useRef<
    Record<string, MultichainNetworkConfiguration> | undefined
  >(undefined);
  const { toastRef } = useContext(ToastContext);
  const networkImage = useSelector(selectNetworkImageSource);

  const isAllNetworks = useSelector(selectIsAllNetworks);
  const tokenNetworkFilter = useSelector(selectTokenNetworkFilter);

  const hasNetworkChanged = useCallback(
    (
      currentChainId: Hex | SupportedCaipChainId,
      previousConfig: PreviousProviderConfig | undefined,
      isEvmNetworkSelected: boolean,
    ) => {
      if (!previousConfig) return false;

      return isEvmNetworkSelected
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
        if (Object.keys(tokenNetworkFilter).length === 1) {
          PreferencesController.setTokenNetworkFilter({
            [chainId]: true,
          });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          PreferencesController.setTokenNetworkFilter({
            ...tokenNetworkFilter,
            [chainId]: true,
          } as any);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      } as any);
    }
    previousProviderConfig.current = !isEvmSelected
      ? { chainId }
      : providerConfig;
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
        (network) => !previousNetworkValues.includes(network),
      );
      const deletedNetwork = previousNetworkValues.find(
        (network) => !currentNetworkValues.includes(network),
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        networkImageSource: networkImage,
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
    removeNotVisibleNotificationsCallback();
  }, [removeNotVisibleNotificationsCallback]);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      removeConnectionStatusListener.current = NetInfo.addEventListener(
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
    currentChainId: Hex | SupportedCaipChainId,
    backUpSeedphraseVisible: boolean,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (DEPRECATED_NETWORKS.includes(currentChainId as any) && showDeprecatedAlert) {
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
    return null;
  };

  return (
    <React.Fragment>
      <View style={styles.flex}>
        {!forceReload ? (
          // @ts-expect-error MainNavigator is a JS file without proper types
          <MainNavigator navigation={props.navigation} />
        ) : (
          renderLoader()
        )}
        <GlobalAlert />
        <FadeOutOverlay />
        {/* @ts-expect-error Notification component doesn't have proper navigation types */}
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
        <RootRPCMethodsUI navigation={props.navigation} />
      </View>
    </React.Fragment>
  );
};

// @ts-expect-error MainNavigator is a JS file without proper types
(Main as any).router = MainNavigator.router;

interface StateFromProps {
  showIncomingTransactionsNetworks: Record<string, boolean>;
  providerType: string;
  chainId: Hex | SupportedCaipChainId;
  networkClientId: string;
  backUpSeedphraseVisible: boolean;
  networkConfigurations: Record<string, MultichainNetworkConfiguration>;
}

interface DispatchFromProps {
  showTransactionNotification: (args: TransactionNotificationArgs) => void;
  showSimpleNotification: (args: SimpleNotificationArgs) => void;
  hideCurrentNotification: () => void;
  removeNotificationById: (id: string) => void;
  setInfuraAvailabilityBlocked: () => void;
  setInfuraAvailabilityNotBlocked: () => void;
  removeNotVisibleNotifications: () => void;
}

const mapStateToProps = (state: RootState): StateFromProps => ({
  showIncomingTransactionsNetworks:
    selectShowIncomingTransactionNetworks(state),
  providerType: selectProviderType(state),
  chainId: selectChainId(state),
  networkClientId: selectNetworkClientId(state),
  backUpSeedphraseVisible: state.user.backUpSeedphraseVisible,
  networkConfigurations: selectNetworkConfigurations(state),
});

const mapDispatchToProps = (
  dispatch: Dispatch<AnyAction>,
): DispatchFromProps => ({
  showTransactionNotification: (args: TransactionNotificationArgs) =>
    // @ts-expect-error notification action creators are JS files without proper types
    dispatch(showTransactionNotification(args)),
  showSimpleNotification: (args: SimpleNotificationArgs) =>
    // @ts-expect-error notification action creators are JS files without proper types
    dispatch(showSimpleNotification(args)),
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
