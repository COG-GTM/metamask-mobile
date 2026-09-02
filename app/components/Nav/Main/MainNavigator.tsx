import React, { useRef, useState, useEffect } from 'react';
import { Image, StyleSheet, Keyboard, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { RouteProp, ParamListBase } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { RootState } from '../../../reducers';
import Browser from '../../Views/Browser';
import { ChainId } from '@metamask/controller-utils';
import AddBookmark from '../../Views/AddBookmark';
import SimpleWebview from '../../Views/SimpleWebview';
import Settings from '../../Views/Settings';
import GeneralSettings from '../../Views/Settings/GeneralSettings';
import AdvancedSettings from '../../Views/Settings/AdvancedSettings';
import BackupAndSyncSettings from '../../Views/Settings/Identity/BackupAndSyncSettings';
import SecuritySettings from '../../Views/Settings/SecuritySettings';
import ExperimentalSettings from '../../Views/Settings/ExperimentalSettings';
import NetworksSettings from '../../Views/Settings/NetworksSettings';
import NotificationsSettings from '../../Views/Settings/NotificationsSettings';
import NotificationsView from '../../Views/Notifications';
import NotificationsDetails from '../../Views/Notifications/Details';
import OptIn from '../../Views/Notifications/OptIn';
import AppInformation from '../../Views/Settings/AppInformation';
import DeveloperOptions from '../../Views/Settings/DeveloperOptions';
import Contacts from '../../Views/Settings/Contacts';
import Wallet from '../../Views/Wallet';
import Asset from '../../Views/Asset';
import AssetDetails from '../../Views/AssetDetails';
import AddAsset from '../../Views/AddAsset';
import Collectible from '../../Views/Collectible';
import Send from '../../Views/confirmations/legacy/Send';
import SendTo from '../../Views/confirmations/legacy/SendFlow/SendTo';
import { RevealPrivateCredential } from '../../Views/RevealPrivateCredential';
import WalletConnectSessions from '../../Views/WalletConnectSessions';
import OfflineMode from '../../Views/OfflineMode';
import QRTabSwitcher from '../../Views/QRTabSwitcher';
import EnterPasswordSimple from '../../Views/EnterPasswordSimple';
import ChoosePassword from '../../Views/ChoosePassword';
import ResetPassword from '../../Views/ResetPassword';
import AccountBackupStep1 from '../../Views/AccountBackupStep1';
import AccountBackupStep1B from '../../Views/AccountBackupStep1B';
import ManualBackupStep1 from '../../Views/ManualBackupStep1';
import ManualBackupStep2 from '../../Views/ManualBackupStep2';
import ManualBackupStep3 from '../../Views/ManualBackupStep3';
import PaymentRequest from '../../UI/PaymentRequest';
import PaymentRequestSuccess from '../../UI/PaymentRequestSuccess';
import Amount from '../../Views/confirmations/legacy/SendFlow/Amount';
import Confirm from '../../Views/confirmations/legacy/SendFlow/Confirm';
import { Confirm as RedesignedConfirm } from '../../Views/confirmations/components/confirm';
import ContactForm from '../../Views/Settings/Contacts/ContactForm';
import ActivityView from '../../Views/ActivityView';
import SwapsAmountView from '../../UI/Swaps';
import SwapsQuotesView from '../../UI/Swaps/QuotesView';
import CollectiblesDetails from '../../UI/CollectibleModal';
import OptinMetrics from '../../UI/OptinMetrics';
import Drawer from '../../UI/Drawer';

import RampRoutes from '../../UI/Ramp/routes';
import { RampType } from '../../UI/Ramp/types';
import RampSettings from '../../UI/Ramp/Views/Settings';
import RampActivationKeyForm from '../../UI/Ramp/Views/Settings/ActivationKeyForm';

import { colors as importedColors } from '../../../styles/common';
import OrderDetails from '../../UI/Ramp/Views/OrderDetails';
import SendTransaction from '../../UI/Ramp/Views/SendTransaction';
import TabBar from '../../../component-library/components/Navigation/TabBar';
///: BEGIN:ONLY_INCLUDE_IF(external-snaps)
import { SnapsSettingsList } from '../../Views/Snaps/SnapsSettingsList';
import { SnapSettings } from '../../Views/Snaps/SnapSettings';
///: END:ONLY_INCLUDE_IF
import Routes from '../../../constants/navigation/Routes';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { getActiveTabUrl } from '../../../util/transactions';
import { getPermittedAccountsByHostname } from '../../../core/Permissions';
import { TabBarIconKey } from '../../../component-library/components/Navigation/TabBar/TabBar.types';
import { isEqual } from 'lodash';
import { selectProviderConfig } from '../../../selectors/networkController';
import { selectAccountsLength } from '../../../selectors/accountTrackerController';
import isUrl from 'is-url';
import SDKSessionsManager from '../../Views/SDK/SDKSessionsManager/SDKSessionsManager';
import PermissionsManager from '../../Views/Settings/PermissionsSettings/PermissionsManager';
// eslint-disable-next-line @typescript-eslint/no-shadow
import URL from 'url-parse';
import Logger from '../../../util/Logger';
import { getDecimalChainId } from '../../../util/networks';
import { useMetrics } from '../../../components/hooks/useMetrics';
import DeprecatedNetworkDetails from '../../UI/DeprecatedNetworkModal';
import ConfirmAddAsset from '../../UI/ConfirmAddAsset';
import { AesCryptoTestForm } from '../../Views/AesCryptoTestForm';
import { isTest } from '../../../util/test/utils';
import { selectPermissionControllerState } from '../../../selectors/snaps/permissionController';
import NftDetails from '../../Views/NftDetails';
import NftDetailsFullImage from '../../Views/NftDetails/NFtDetailsFullImage';
import AccountPermissions from '../../../components/Views/AccountPermissions';
import { AccountPermissionsScreens } from '../../../components/Views/AccountPermissions/AccountPermissions.types';
import { StakeModalStack, StakeScreenStack } from '../../UI/Stake/routes';
import { AssetLoader } from '../../Views/AssetLoader';
import { BridgeTransactionDetails } from '../../UI/Bridge/components/TransactionDetails/TransactionDetails';
import { BridgeModalStack, BridgeScreenStack } from '../../UI/Bridge/routes';
import TurnOnBackupAndSync from '../../Views/Identity/TurnOnBackupAndSync/TurnOnBackupAndSync';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * The navigator tree mixes typed and untyped screens and relies on legacy
 * `mode` / static `navigationOptions` APIs, which the generated navigator
 * types cannot express, so the navigator primitives are aliased to loose
 * component types.
 */
type LooseNavigationProps = Record<string, unknown> & {
  children?: React.ReactNode | (() => React.ReactNode);
};

const StackNavigator =
  Stack.Navigator as unknown as React.ComponentType<LooseNavigationProps>;
const StackScreen =
  Stack.Screen as unknown as React.ComponentType<LooseNavigationProps>;
const TabNavigator =
  Tab.Navigator as unknown as React.ComponentType<LooseNavigationProps>;
const TabScreen =
  Tab.Screen as unknown as React.ComponentType<LooseNavigationProps>;

const navigationOptionsOf = (component: unknown) =>
  (component as { navigationOptions?: unknown }).navigationOptions;

const styles = StyleSheet.create({
  headerLogo: {
    width: 125,
    height: 50,
  },
});

const clearStackNavigatorOptions = {
  headerShown: false,
  cardStyle: {
    backgroundColor: 'transparent',
    cardStyleInterpolator: () => ({
      overlayStyle: {
        opacity: 0,
      },
    }),
  },
  animationEnabled: false,
};

const WalletModalFlow = () => (
  <StackNavigator mode={'modal'} screenOptions={clearStackNavigatorOptions}>
    <StackScreen
      name={'Wallet'}
      component={Wallet}
      options={{ headerShown: true, animationEnabled: false }}
    />
  </StackNavigator>
);

interface RouteParamsProps {
  route: RouteProp<ParamListBase, string> & {
    params?: Record<string, unknown>;
  };
}

const AssetStackFlow = (props: RouteParamsProps) => (
  <StackNavigator>
    <StackScreen
      name={'Asset'}
      component={Asset}
      initialParams={props.route.params}
    />
    <StackScreen
      name={'AssetDetails'}
      component={AssetDetails}
      initialParams={{ address: props.route.params?.address as string }}
    />
  </StackNavigator>
);

const AssetModalFlow = (props: RouteParamsProps) => (
  <StackNavigator
    mode={'modal'}
    initialRouteName={'AssetStackFlow'}
    screenOptions={clearStackNavigatorOptions}
  >
    <StackScreen
      name={'AssetStackFlow'}
      component={AssetStackFlow}
      initialParams={props.route.params}
    />
  </StackNavigator>
);

const WalletTabStackFlow = () => (
  <StackNavigator initialRouteName={'WalletView'}>
    <StackScreen
      name="WalletView"
      component={WalletModalFlow}
      options={{ headerShown: false }}
    />
    <StackScreen
      name="AddAsset"
      component={AddAsset}
      options={navigationOptionsOf(AddAsset)}
    />
    <StackScreen
      name="Collectible"
      component={Collectible}
      options={navigationOptionsOf(Collectible)}
    />
    <StackScreen
      name="ConfirmAddAsset"
      component={ConfirmAddAsset}
      options={navigationOptionsOf(ConfirmAddAsset)}
    />
    <StackScreen
      name="RevealPrivateCredentialView"
      component={RevealPrivateCredential}
    />
  </StackNavigator>
);

const WalletTabModalFlow = () => (
  <StackNavigator mode={'modal'} screenOptions={clearStackNavigatorOptions}>
    <StackScreen
      name={Routes.WALLET.TAB_STACK_FLOW}
      component={WalletTabStackFlow}
    />
  </StackNavigator>
);

const TransactionsHome = () => (
  <StackNavigator>
    <StackScreen
      name={Routes.TRANSACTIONS_VIEW}
      component={ActivityView}
      options={{ headerShown: false }}
    />
    <StackScreen name={Routes.RAMP.ORDER_DETAILS} component={OrderDetails} />
    <StackScreen
      name={Routes.RAMP.SEND_TRANSACTION}
      component={SendTransaction}
    />
    <StackScreen
      name={Routes.BRIDGE.BRIDGE_TRANSACTION_DETAILS}
      component={BridgeTransactionDetails}
    />
  </StackNavigator>
);

const BrowserFlow = (props: RouteParamsProps) => (
  <StackNavigator
    initialRouteName={Routes.BROWSER.VIEW}
    mode={'modal'}
    screenOptions={{
      cardStyle: { backgroundColor: importedColors.transparent },
    }}
  >
    <StackScreen
      name={Routes.BROWSER.VIEW}
      component={Browser}
      options={{ headerShown: false }}
    />
    <StackScreen
      name={Routes.BROWSER.ASSET_LOADER}
      component={AssetLoader}
      options={{ headerShown: false, animationEnabled: false }}
    />
    <StackScreen
      name={Routes.BROWSER.ASSET_VIEW}
      component={Asset}
      initialParams={props.route.params}
    />
    <StackScreen
      name="SwapsAmountView"
      component={SwapsAmountView}
      options={navigationOptionsOf(SwapsAmountView)}
    />
    <StackScreen
      name="SwapsQuotesView"
      component={SwapsQuotesView}
      options={navigationOptionsOf(SwapsQuotesView)}
    />
  </StackNavigator>
);

interface DrawerHandle {
  dismissDrawer: () => void;
  showDrawer: () => void;
}

export const DrawerContext = React.createContext<{
  drawerRef: React.RefObject<DrawerHandle> | null;
}>({ drawerRef: null });

///: BEGIN:ONLY_INCLUDE_IF(external-snaps)
const SnapsSettingsStack = () => (
  <StackNavigator>
    <StackScreen
      name={Routes.SNAPS.SNAPS_SETTINGS_LIST}
      component={SnapsSettingsList}
      options={navigationOptionsOf(SnapsSettingsList)}
    />
    <StackScreen
      name={Routes.SNAPS.SNAP_SETTINGS}
      component={SnapSettings}
      options={navigationOptionsOf(SnapSettings)}
    />
  </StackNavigator>
);
///: END:ONLY_INCLUDE_IF

const NotificationsOptInStack = () => (
  <StackNavigator initialRouteName={Routes.NOTIFICATIONS.OPT_IN}>
    <StackScreen
      mode={'modal'}
      name={Routes.NOTIFICATIONS.OPT_IN}
      component={OptIn}
      options={{ headerShown: false }}
    />
    <StackScreen
      name={Routes.SETTINGS.NOTIFICATIONS}
      component={NotificationsSettings}
      options={navigationOptionsOf(NotificationsSettings)}
    />
  </StackNavigator>
);

const SettingsFlow = () => (
  <StackNavigator initialRouteName={'Settings'}>
    <StackScreen
      name="Settings"
      component={Settings}
      options={navigationOptionsOf(Settings)}
    />
    <StackScreen
      name="GeneralSettings"
      component={GeneralSettings}
      options={navigationOptionsOf(GeneralSettings)}
    />
    <StackScreen
      name="AdvancedSettings"
      component={AdvancedSettings}
      options={navigationOptionsOf(AdvancedSettings)}
    />
    <StackScreen name="SDKSessionsManager" component={SDKSessionsManager} />
    <StackScreen name="PermissionsManager" component={PermissionsManager} />
    <StackScreen
      name="SecuritySettings"
      component={SecuritySettings}
      options={navigationOptionsOf(SecuritySettings)}
    />
    <StackScreen name={Routes.RAMP.SETTINGS} component={RampSettings} />
    <StackScreen
      name={Routes.RAMP.ACTIVATION_KEY_FORM}
      component={RampActivationKeyForm}
    />
    {
      /**
       * This screen should only accessed in test mode.
       * It is used to test the AES crypto functions.
       *
       * If this is in production, it is a bug.
       */
      isTest && (
        <StackScreen
          name="AesCryptoTestForm"
          component={AesCryptoTestForm}
          options={navigationOptionsOf(AesCryptoTestForm)}
        />
      )
    }
    <StackScreen
      name="ExperimentalSettings"
      component={ExperimentalSettings}
      options={navigationOptionsOf(ExperimentalSettings)}
    />
    <StackScreen
      name="NetworksSettings"
      component={NetworksSettings}
      options={navigationOptionsOf(NetworksSettings)}
    />
    <StackScreen
      name="CompanySettings"
      component={AppInformation}
      options={navigationOptionsOf(AppInformation)}
    />
    {process.env.MM_ENABLE_SETTINGS_PAGE_DEV_OPTIONS === 'true' && (
      <StackScreen
        name={Routes.SETTINGS.DEVELOPER_OPTIONS}
        component={DeveloperOptions}
        options={navigationOptionsOf(DeveloperOptions)}
      />
    )}

    <StackScreen
      name="ContactsSettings"
      component={Contacts}
      options={navigationOptionsOf(Contacts)}
    />
    <StackScreen
      name="ContactForm"
      component={ContactForm}
      options={navigationOptionsOf(ContactForm)}
    />
    <StackScreen
      name="AccountPermissionsAsFullScreen"
      component={AccountPermissions}
      options={{ headerShown: false }}
      initialParams={{
        initialScreen: AccountPermissionsScreens.PermissionsSummary,
      }}
    />
    <StackScreen
      name="RevealPrivateCredentialView"
      component={RevealPrivateCredential}
    />
    <StackScreen
      name={Routes.WALLET.WALLET_CONNECT_SESSIONS_VIEW}
      component={WalletConnectSessions}
      options={navigationOptionsOf(WalletConnectSessions)}
    />
    <StackScreen
      name="ResetPassword"
      component={ResetPassword}
      options={navigationOptionsOf(ResetPassword)}
    />
    <StackScreen
      name="AccountBackupStep1B"
      component={AccountBackupStep1B}
      options={navigationOptionsOf(AccountBackupStep1B)}
    />
    <StackScreen
      name="ManualBackupStep1"
      component={ManualBackupStep1}
      options={navigationOptionsOf(ManualBackupStep1)}
    />
    <StackScreen
      name="ManualBackupStep2"
      component={ManualBackupStep2}
      options={navigationOptionsOf(ManualBackupStep2)}
    />
    <StackScreen
      name="ManualBackupStep3"
      component={ManualBackupStep3}
      options={navigationOptionsOf(ManualBackupStep3)}
    />
    <StackScreen
      name="EnterPasswordSimple"
      component={EnterPasswordSimple}
      options={navigationOptionsOf(EnterPasswordSimple)}
    />
    <StackScreen
      name={Routes.SETTINGS.NOTIFICATIONS}
      component={NotificationsSettings}
      options={navigationOptionsOf(NotificationsSettings)}
    />
    <StackScreen
      name={Routes.SETTINGS.BACKUP_AND_SYNC}
      component={BackupAndSyncSettings}
      options={navigationOptionsOf(BackupAndSyncSettings)}
    />
    {
      ///: BEGIN:ONLY_INCLUDE_IF(external-snaps)
    }
    <StackScreen
      name={Routes.SNAPS.SNAPS_SETTINGS_LIST}
      component={SnapsSettingsStack}
      options={{ headerShown: false }}
    />
    {
      ///: END:ONLY_INCLUDE_IF
    }
  </StackNavigator>
);

const HomeTabs = () => {
  const { trackEvent, createEventBuilder } = useMetrics();
  const drawerRef = useRef<DrawerHandle>(null);
  const [isKeyboardHidden, setIsKeyboardHidden] = useState(true);

  const accountsLength = useSelector(selectAccountsLength);

  const chainId = useSelector((state: RootState) => {
    const providerConfig = selectProviderConfig(state);
    return ChainId[providerConfig.type as keyof typeof ChainId];
  });

  const amountOfBrowserOpenTabs = useSelector(
    (state: RootState) => state.browser.tabs.length,
  );

  /* tabs: state.browser.tabs, */
  /* activeTab: state.browser.activeTab, */
  const activeConnectedDapp = useSelector((state: RootState) => {
    const activeTabUrl = getActiveTabUrl(state);
    if (!isUrl(activeTabUrl)) return [];
    try {
      const permissionsControllerState = selectPermissionControllerState(state);
      const hostname = new URL(activeTabUrl).hostname;
      const permittedAcc = getPermittedAccountsByHostname(
        permissionsControllerState,
        hostname,
      );
      return permittedAcc;
    } catch (error) {
      Logger.error(error as Error, {
        message: 'ParseUrl::MainNavigator error while parsing URL',
      });
    }
  }, isEqual);

  const options = {
    home: {
      tabBarIconKey: TabBarIconKey.Wallet,
      callback: () => {
        trackEvent(
          createEventBuilder(MetaMetricsEvents.WALLET_OPENED)
            .addProperties({
              number_of_accounts: accountsLength,
              chain_id: getDecimalChainId(chainId),
            })
            .build(),
        );
      },
      rootScreenName: Routes.WALLET_VIEW,
    },
    actions: {
      tabBarIconKey: TabBarIconKey.Actions,
      rootScreenName: Routes.MODAL.WALLET_ACTIONS,
    },
    browser: {
      tabBarIconKey: TabBarIconKey.Browser,
      callback: () => {
        trackEvent(
          createEventBuilder(MetaMetricsEvents.BROWSER_OPENED)
            .addProperties({
              number_of_accounts: accountsLength,
              chain_id: getDecimalChainId(chainId),
              source: 'Navigation Tab',
              active_connected_dapp: activeConnectedDapp,
              number_of_open_tabs: amountOfBrowserOpenTabs,
            })
            .build(),
        );
      },
      rootScreenName: Routes.BROWSER_VIEW,
    },
    activity: {
      tabBarIconKey: TabBarIconKey.Activity,
      callback: () => {
        trackEvent(
          createEventBuilder(
            MetaMetricsEvents.NAVIGATION_TAPS_TRANSACTION_HISTORY,
          ).build(),
        );
      },
      rootScreenName: Routes.TRANSACTIONS_VIEW,
    },
    settings: {
      tabBarIconKey: TabBarIconKey.Setting,
      callback: () => {
        trackEvent(
          createEventBuilder(
            MetaMetricsEvents.NAVIGATION_TAPS_SETTINGS,
          ).build(),
        );
      },
      rootScreenName: Routes.SETTINGS_VIEW,
      unmountOnBlur: true,
    },
  };

  useEffect(() => {
    // Hide keyboard on Android when keyboard is visible.
    // Better solution would be to update android:windowSoftInputMode in the AndroidManifest and refactor pages to support it.
    if (Platform.OS === 'android') {
      const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
        setIsKeyboardHidden(false);
      });
      const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
        setIsKeyboardHidden(true);
      });

      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    }
  }, []);

  const renderTabBar = ({
    state,
    descriptors,
    navigation,
  }: BottomTabBarProps) => {
    if (isKeyboardHidden) {
      return (
        <TabBar
          state={state}
          descriptors={
            descriptors as React.ComponentProps<typeof TabBar>['descriptors']
          }
          navigation={navigation}
        />
      );
    }
    return null;
  };

  return (
    <DrawerContext.Provider value={{ drawerRef }}>
      <Drawer ref={drawerRef}>
        <TabNavigator
          initialRouteName={Routes.WALLET.HOME}
          tabBar={renderTabBar}
        >
          <TabScreen
            name={Routes.WALLET.HOME}
            options={options.home}
            component={WalletTabModalFlow}
          />
          <TabScreen
            name={Routes.TRANSACTIONS_VIEW}
            options={options.activity}
            component={TransactionsHome}
          />
          <TabScreen
            name={Routes.MODAL.WALLET_ACTIONS}
            options={options.actions}
            component={WalletTabModalFlow}
          />
          <TabScreen
            name={Routes.BROWSER.HOME}
            options={options.browser}
            component={BrowserFlow}
          />

          <TabScreen
            name={Routes.SETTINGS_VIEW}
            options={options.settings}
            component={SettingsFlow}
          />
        </TabNavigator>
      </Drawer>
    </DrawerContext.Provider>
  );
};

const Webview = () => (
  <StackNavigator>
    <StackScreen
      name="SimpleWebview"
      component={SimpleWebview}
      mode={'modal'}
      options={navigationOptionsOf(SimpleWebview)}
    />
  </StackNavigator>
);

const SendView = () => (
  <StackNavigator>
    <StackScreen
      name="Send"
      component={Send}
      options={navigationOptionsOf(Send)}
    />
  </StackNavigator>
);

const NftDetailsModeView = (props: RouteParamsProps) => (
  <StackNavigator>
    <StackScreen
      name=" " // No name here because this title will be displayed in the header of the page
      component={NftDetails}
      initialParams={{
        collectible: props.route.params?.collectible,
      }}
    />
  </StackNavigator>
);

const NftDetailsFullImageModeView = (props: RouteParamsProps) => (
  <StackNavigator>
    <StackScreen
      name=" " // No name here because this title will be displayed in the header of the page
      component={NftDetailsFullImage}
      initialParams={{
        collectible: props.route.params?.collectible,
      }}
    />
  </StackNavigator>
);

const SendFlowView = () => (
  <StackNavigator>
    <StackScreen
      name="SendTo"
      component={SendTo}
      options={navigationOptionsOf(SendTo)}
    />
    <StackScreen
      name="Amount"
      component={Amount}
      options={navigationOptionsOf(Amount)}
    />
    <StackScreen
      name={Routes.SEND_FLOW.CONFIRM}
      component={Confirm}
      options={navigationOptionsOf(Confirm)}
    />
    <StackScreen
      name={Routes.STANDALONE_CONFIRMATIONS.TRANSFER}
      component={RedesignedConfirm}
    />
  </StackNavigator>
);

const AddBookmarkView = () => (
  <StackNavigator>
    <StackScreen
      name="AddBookmark"
      component={AddBookmark}
      options={navigationOptionsOf(AddBookmark)}
    />
  </StackNavigator>
);

const OfflineModeView = () => (
  <StackNavigator>
    <StackScreen
      name="OfflineMode"
      component={OfflineMode}
      options={navigationOptionsOf(OfflineMode)}
    />
  </StackNavigator>
);

const PaymentRequestView = () => (
  <StackNavigator>
    <StackScreen
      name="PaymentRequest"
      component={PaymentRequest}
      options={navigationOptionsOf(PaymentRequest)}
    />
    <StackScreen
      name="PaymentRequestSuccess"
      component={PaymentRequestSuccess}
      options={navigationOptionsOf(PaymentRequestSuccess)}
    />
  </StackNavigator>
);

const NotificationsModeView = () => (
  <StackNavigator>
    <StackScreen
      name={Routes.NOTIFICATIONS.VIEW}
      component={NotificationsView}
      options={navigationOptionsOf(NotificationsView)}
    />
    <StackScreen
      name={Routes.SETTINGS.NOTIFICATIONS}
      component={NotificationsSettings}
      options={navigationOptionsOf(NotificationsSettings)}
    />
    <StackScreen
      mode={'modal'}
      name={Routes.NOTIFICATIONS.OPT_IN}
      component={OptIn}
      options={navigationOptionsOf(OptIn)}
    />
    <StackScreen
      name={Routes.NOTIFICATIONS.DETAILS}
      component={NotificationsDetails}
      options={navigationOptionsOf(NotificationsDetails)}
    />
    <StackScreen
      name="ContactForm"
      component={ContactForm}
      options={navigationOptionsOf(ContactForm)}
    />
  </StackNavigator>
);

const Swaps = () => (
  <StackNavigator>
    <StackScreen
      name="SwapsAmountView"
      component={SwapsAmountView}
      options={navigationOptionsOf(SwapsAmountView)}
    />
    <StackScreen
      name="SwapsQuotesView"
      component={SwapsQuotesView}
      options={navigationOptionsOf(SwapsQuotesView)}
    />
  </StackNavigator>
);

const SetPasswordFlow = () => (
  <StackNavigator>
    <StackScreen
      name="ChoosePassword"
      component={ChoosePassword}
      options={navigationOptionsOf(ChoosePassword)}
    />
    <StackScreen
      name="AccountBackupStep1"
      component={AccountBackupStep1}
      options={navigationOptionsOf(AccountBackupStep1)}
    />
    <StackScreen
      name="AccountBackupStep1B"
      component={AccountBackupStep1B}
      options={navigationOptionsOf(AccountBackupStep1B)}
    />
    <StackScreen
      name="ManualBackupStep1"
      component={ManualBackupStep1}
      options={navigationOptionsOf(ManualBackupStep1)}
    />
    <StackScreen
      name="ManualBackupStep2"
      component={ManualBackupStep2}
      options={navigationOptionsOf(ManualBackupStep2)}
    />
    <StackScreen
      name="ManualBackupStep3"
      component={ManualBackupStep3}
      options={navigationOptionsOf(ManualBackupStep3)}
    />
    <StackScreen
      name="OptinMetrics"
      component={OptinMetrics}
      options={navigationOptionsOf(OptinMetrics)}
    />
  </StackNavigator>
);

const MainNavigator = () => (
  <StackNavigator
    screenOptions={{
      headerShown: false,
    }}
    mode={'modal'}
    initialRouteName={'Home'}
  >
    <StackScreen
      name="CollectiblesDetails"
      component={CollectiblesDetails}
      options={{
        //Refer to - https://reactnavigation.org/docs/stack-navigator/#animations
        cardStyle: { backgroundColor: importedColors.transparent },
        cardStyleInterpolator: () => ({
          overlayStyle: {
            opacity: 0,
          },
        }),
      }}
    />
    <StackScreen
      name={Routes.DEPRECATED_NETWORK_DETAILS}
      component={DeprecatedNetworkDetails}
      options={{
        //Refer to - https://reactnavigation.org/docs/stack-navigator/#animations
        cardStyle: { backgroundColor: importedColors.transparent },
        cardStyleInterpolator: () => ({
          overlayStyle: {
            opacity: 0,
          },
        }),
      }}
    />
    <StackScreen name="Home" component={HomeTabs} />
    <StackScreen name="Asset" component={AssetModalFlow} />
    <StackScreen name="Webview" component={Webview} />
    <StackScreen name="SendView" component={SendView} />
    <StackScreen
      name="SendFlowView"
      component={SendFlowView}
      //Disabling swipe down on IOS
      options={{ gestureEnabled: false }}
    />
    <StackScreen name="AddBookmarkView" component={AddBookmarkView} />
    <StackScreen name="OfflineModeView" component={OfflineModeView} />
    <StackScreen
      name={Routes.NOTIFICATIONS.VIEW}
      component={NotificationsModeView}
    />
    <StackScreen name={Routes.QR_TAB_SWITCHER} component={QRTabSwitcher} />
    <StackScreen name="NftDetails" component={NftDetailsModeView} />
    <StackScreen
      name="NftDetailsFullImage"
      component={NftDetailsFullImageModeView}
    />
    <StackScreen name="PaymentRequestView" component={PaymentRequestView} />
    <StackScreen name={Routes.RAMP.BUY}>
      {() => <RampRoutes rampType={RampType.BUY} />}
    </StackScreen>
    <StackScreen name={Routes.RAMP.SELL}>
      {() => <RampRoutes rampType={RampType.SELL} />}
    </StackScreen>
    <StackScreen name="Swaps" component={Swaps} />
    <StackScreen name={Routes.BRIDGE.ROOT} component={BridgeScreenStack} />
    <StackScreen
      name={Routes.BRIDGE.MODALS.ROOT}
      component={BridgeModalStack}
      options={clearStackNavigatorOptions}
    />
    <StackScreen name="StakeScreens" component={StakeScreenStack} />
    <StackScreen
      name="StakeModals"
      component={StakeModalStack}
      options={clearStackNavigatorOptions}
    />
    <StackScreen
      name="SetPasswordFlow"
      component={SetPasswordFlow}
      headerTitle={() => (
        <Image
          style={styles.headerLogo}
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../../images/branding/metamask-name.png')}
          resizeMode={'contain'}
        />
      )}
      // eslint-disable-next-line react-native/no-inline-styles
      headerStyle={{ borderBottomWidth: 0 }}
    />
    {/* TODO: This is added to support slide 4 in the carousel - once changed this can be safely removed*/}
    <StackScreen
      name="GeneralSettings"
      component={GeneralSettings}
      options={{
        headerShown: true,
        ...(navigationOptionsOf(GeneralSettings) as object),
      }}
    />
    <StackScreen
      name={Routes.NOTIFICATIONS.OPT_IN_STACK}
      component={NotificationsOptInStack}
      options={navigationOptionsOf(NotificationsOptInStack)}
    />
    <StackScreen
      name={Routes.IDENTITY.TURN_ON_BACKUP_AND_SYNC}
      component={TurnOnBackupAndSync}
      options={navigationOptionsOf(TurnOnBackupAndSync)}
    />
  </StackNavigator>
);

export default MainNavigator;
