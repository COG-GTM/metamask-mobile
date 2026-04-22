import React, { useRef, useState, useEffect } from 'react';
import { Image, StyleSheet, Keyboard, Platform } from 'react-native';
import {
  createStackNavigator,
  StackNavigationOptions,
  StackScreenProps,
} from '@react-navigation/stack';
import {
  BottomTabBarProps,
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { ParamListBase } from '@react-navigation/native';
import { useSelector } from 'react-redux';
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
import UrlParse from 'url-parse';
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

/**
 * Params accepted by the Asset / AssetView / AssetStackFlow routes.
 */
export interface AssetParams {
  address?: string;
  symbol?: string;
  chainId?: string;
  [key: string]: unknown;
}

/**
 * Params accepted by the NFT details routes.
 */
export interface NftDetailsParams {
  // TODO: Replace `unknown` with the typed collectible shape once
  // NftDetails is migrated to TypeScript.
  collectible?: unknown;
}

/**
 * Param list for the root stack navigator exposed by this file.
 *
 * Routes that don't require params are typed as `undefined`. Routes that may
 * receive navigation params use flexible shapes so other files can start
 * adopting typed navigation (e.g. via
 * `useNavigation<StackNavigationProp<RootStackParamList>>()` or
 * `useRoute<RouteProp<RootStackParamList, 'ScreenName'>>()`) without
 * forcing a full migration of every screen in one pass.
 */
export interface RootStackParamList extends ParamListBase {
  Home: undefined;
  Asset: AssetParams | undefined;
  Webview: undefined;
  SendView: undefined;
  SendFlowView: undefined;
  AddBookmarkView: undefined;
  OfflineModeView: undefined;
  CollectiblesDetails: undefined;
  Swaps: undefined;
  StakeScreens: undefined;
  StakeModals: undefined;
  SetPasswordFlow: undefined;
  GeneralSettings: undefined;
  PaymentRequestView: undefined;
  NftDetails: NftDetailsParams | undefined;
  NftDetailsFullImage: NftDetailsParams | undefined;
  // Routes.* entries (e.g. QR_TAB_SWITCHER, RAMP.BUY, BRIDGE.ROOT, ...) resolve to
  // string literals at runtime but live in `Routes` as non-literal string values,
  // so they're reachable through the `[key: string]: unknown` index signature on
  // ParamListBase rather than enumerated explicitly here.
}

type AssetScreenProps = StackScreenProps<RootStackParamList, 'Asset'>;
type NftDetailsScreenProps = StackScreenProps<
  RootStackParamList,
  'NftDetails'
>;
type NftDetailsFullImageScreenProps = StackScreenProps<
  RootStackParamList,
  'NftDetailsFullImage'
>;
type BrowserScreenProps = StackScreenProps<RootStackParamList>;

const Stack = createStackNavigator();

// TODO: Many imported screen components still expose React Navigation v4-era
// static `navigationOptions` properties whose types aren't visible on the
// imported component type. This helper safely reads those options without
// forcing us to cast every call site.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navOptions = (component: any): StackNavigationOptions | undefined =>
  component?.navigationOptions;
const Tab = createBottomTabNavigator();

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
  <Stack.Navigator mode={'modal'} screenOptions={clearStackNavigatorOptions}>
    <Stack.Screen
      name={'Wallet'}
      component={Wallet}
      options={{ headerShown: true, animationEnabled: false }}
    />
  </Stack.Navigator>
);

const AssetStackFlow = (props: AssetScreenProps) => (
  <Stack.Navigator>
    <Stack.Screen
      name={'Asset'}
      component={Asset}
      initialParams={props.route.params}
    />
    <Stack.Screen
      name={'AssetDetails'}
      component={AssetDetails}
      initialParams={{ address: props.route.params?.address }}
    />
  </Stack.Navigator>
);

const AssetModalFlow = (props: AssetScreenProps) => (
  <Stack.Navigator
    mode={'modal'}
    initialRouteName={'AssetStackFlow'}
    screenOptions={clearStackNavigatorOptions}
  >
    <Stack.Screen
      name={'AssetStackFlow'}
      component={AssetStackFlow}
      initialParams={props.route.params}
    />
  </Stack.Navigator>
);

const WalletTabStackFlow = () => (
  <Stack.Navigator initialRouteName={'WalletView'}>
    <Stack.Screen
      name="WalletView"
      component={WalletModalFlow}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AddAsset"
      component={AddAsset}
      options={navOptions(AddAsset)}
    />
    <Stack.Screen
      name="Collectible"
      component={Collectible}
      options={navOptions(Collectible)}
    />
    <Stack.Screen
      name="ConfirmAddAsset"
      component={ConfirmAddAsset}
      options={navOptions(ConfirmAddAsset)}
    />
    <Stack.Screen
      name="RevealPrivateCredentialView"
      component={RevealPrivateCredential}
    />
  </Stack.Navigator>
);

const WalletTabModalFlow = () => (
  <Stack.Navigator mode={'modal'} screenOptions={clearStackNavigatorOptions}>
    <Stack.Screen
      name={Routes.WALLET.TAB_STACK_FLOW}
      component={WalletTabStackFlow}
    />
  </Stack.Navigator>
);

const TransactionsHome = () => (
  <Stack.Navigator>
    <Stack.Screen
      name={Routes.TRANSACTIONS_VIEW}
      component={ActivityView}
      options={{ headerShown: false }}
    />
    <Stack.Screen name={Routes.RAMP.ORDER_DETAILS} component={OrderDetails} />
    <Stack.Screen
      name={Routes.RAMP.SEND_TRANSACTION}
      component={SendTransaction}
    />
    <Stack.Screen
      name={Routes.BRIDGE.BRIDGE_TRANSACTION_DETAILS}
      component={BridgeTransactionDetails}
    />
  </Stack.Navigator>
);

const BrowserFlow = (props: BrowserScreenProps) => (
  <Stack.Navigator
    initialRouteName={Routes.BROWSER.VIEW}
    mode={'modal'}
    screenOptions={{
      cardStyle: { backgroundColor: importedColors.transparent },
    }}
  >
    <Stack.Screen
      name={Routes.BROWSER.VIEW}
      component={Browser}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name={Routes.BROWSER.ASSET_LOADER}
      component={AssetLoader}
      options={{ headerShown: false, animationEnabled: false }}
    />
    <Stack.Screen
      name={Routes.BROWSER.ASSET_VIEW}
      component={Asset}
      initialParams={props.route.params}
    />
    <Stack.Screen
      name="SwapsAmountView"
      component={SwapsAmountView}
      options={navOptions(SwapsAmountView)}
    />
    <Stack.Screen
      name="SwapsQuotesView"
      component={SwapsQuotesView}
      options={navOptions(SwapsQuotesView)}
    />
  </Stack.Navigator>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrawerRef = any;

interface DrawerContextValue {
  drawerRef: React.RefObject<DrawerRef> | null;
}

export const DrawerContext = React.createContext<DrawerContextValue>({
  drawerRef: null,
});

///: BEGIN:ONLY_INCLUDE_IF(external-snaps)
const SnapsSettingsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name={Routes.SNAPS.SNAPS_SETTINGS_LIST}
      component={SnapsSettingsList}
      options={navOptions(SnapsSettingsList)}
    />
    <Stack.Screen
      name={Routes.SNAPS.SNAP_SETTINGS}
      component={SnapSettings}
      options={navOptions(SnapSettings)}
    />
  </Stack.Navigator>
);
///: END:ONLY_INCLUDE_IF

const NotificationsOptInStack = () => (
  <Stack.Navigator initialRouteName={Routes.NOTIFICATIONS.OPT_IN}>
    {/* `mode` is a Stack.Navigator prop in @react-navigation/stack v5+; it was
        set on this Stack.Screen in the legacy JS where it was a runtime no-op,
        so it has been dropped during the TS migration to restore type safety. */}
    <Stack.Screen
      name={Routes.NOTIFICATIONS.OPT_IN}
      component={OptIn}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name={Routes.SETTINGS.NOTIFICATIONS}
      component={NotificationsSettings}
      options={navOptions(NotificationsSettings)}
    />
  </Stack.Navigator>
);

const SettingsFlow = () => (
  <Stack.Navigator initialRouteName={'Settings'}>
    <Stack.Screen
      name="Settings"
      component={Settings}
      options={navOptions(Settings)}
    />
    <Stack.Screen
      name="GeneralSettings"
      component={GeneralSettings}
      options={navOptions(GeneralSettings)}
    />
    <Stack.Screen
      name="AdvancedSettings"
      component={AdvancedSettings}
      options={navOptions(AdvancedSettings)}
    />
    <Stack.Screen name="SDKSessionsManager" component={SDKSessionsManager} />
    <Stack.Screen name="PermissionsManager" component={PermissionsManager} />
    <Stack.Screen
      name="SecuritySettings"
      component={SecuritySettings}
      options={navOptions(SecuritySettings)}
    />
    <Stack.Screen name={Routes.RAMP.SETTINGS} component={RampSettings} />
    <Stack.Screen
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
        <Stack.Screen
          name="AesCryptoTestForm"
          component={AesCryptoTestForm}
          options={navOptions(AesCryptoTestForm)}
        />
      )
    }
    <Stack.Screen
      name="ExperimentalSettings"
      component={ExperimentalSettings}
      options={navOptions(ExperimentalSettings)}
    />
    <Stack.Screen
      name="NetworksSettings"
      component={NetworksSettings}
      options={navOptions(NetworksSettings)}
    />
    <Stack.Screen
      name="CompanySettings"
      component={AppInformation}
      options={navOptions(AppInformation)}
    />
    {process.env.MM_ENABLE_SETTINGS_PAGE_DEV_OPTIONS === 'true' && (
      <Stack.Screen
        name={Routes.SETTINGS.DEVELOPER_OPTIONS}
        component={DeveloperOptions}
        options={navOptions(DeveloperOptions)}
      />
    )}

    <Stack.Screen
      name="ContactsSettings"
      component={Contacts}
      options={navOptions(Contacts)}
    />
    <Stack.Screen
      name="ContactForm"
      component={ContactForm}
      options={navOptions(ContactForm)}
    />
    <Stack.Screen
      name="AccountPermissionsAsFullScreen"
      component={AccountPermissions}
      options={{ headerShown: false }}
      initialParams={{
        initialScreen: AccountPermissionsScreens.PermissionsSummary,
      }}
    />
    <Stack.Screen
      name="RevealPrivateCredentialView"
      component={RevealPrivateCredential}
    />
    <Stack.Screen
      name={Routes.WALLET.WALLET_CONNECT_SESSIONS_VIEW}
      component={WalletConnectSessions}
      options={navOptions(WalletConnectSessions)}
    />
    <Stack.Screen
      name="ResetPassword"
      component={ResetPassword}
      options={navOptions(ResetPassword)}
    />
    <Stack.Screen
      name="AccountBackupStep1B"
      component={AccountBackupStep1B}
      options={navOptions(AccountBackupStep1B)}
    />
    <Stack.Screen
      name="ManualBackupStep1"
      component={ManualBackupStep1}
      options={navOptions(ManualBackupStep1)}
    />
    <Stack.Screen
      name="ManualBackupStep2"
      component={ManualBackupStep2}
      options={navOptions(ManualBackupStep2)}
    />
    <Stack.Screen
      name="ManualBackupStep3"
      component={ManualBackupStep3}
      options={navOptions(ManualBackupStep3)}
    />
    <Stack.Screen
      name="EnterPasswordSimple"
      component={EnterPasswordSimple}
      options={navOptions(EnterPasswordSimple)}
    />
    <Stack.Screen
      name={Routes.SETTINGS.NOTIFICATIONS}
      component={NotificationsSettings}
      options={navOptions(NotificationsSettings)}
    />
    <Stack.Screen
      name={Routes.SETTINGS.BACKUP_AND_SYNC}
      component={BackupAndSyncSettings}
      options={navOptions(BackupAndSyncSettings)}
    />
    {
      ///: BEGIN:ONLY_INCLUDE_IF(external-snaps)
    }
    <Stack.Screen
      name={Routes.SNAPS.SNAPS_SETTINGS_LIST}
      component={SnapsSettingsStack}
      options={{ headerShown: false }}
    />
    {
      ///: END:ONLY_INCLUDE_IF
    }
  </Stack.Navigator>
);

const HomeTabs = () => {
  const { trackEvent, createEventBuilder } = useMetrics();
  const drawerRef = useRef<DrawerRef>(null);
  const [isKeyboardHidden, setIsKeyboardHidden] = useState<boolean>(true);

  const accountsLength = useSelector(selectAccountsLength);

  const chainId = useSelector((state: unknown) => {
    // TODO: Replace `any` with RootState once selectors are fully typed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const providerConfig = selectProviderConfig(state as any);
    return ChainId[providerConfig.type as keyof typeof ChainId];
  });

  const amountOfBrowserOpenTabs = useSelector(
    // TODO: Replace `any` with RootState once the root reducer is typed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => state.browser.tabs.length,
  );

  /* tabs: state.browser.tabs, */
  /* activeTab: state.browser.activeTab, */
  const activeConnectedDapp = useSelector((state: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeTabUrl = getActiveTabUrl(state as any);
    if (!isUrl(activeTabUrl)) return [];
    try {
      const permissionsControllerState =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selectPermissionControllerState(state as any);
      const hostname = new UrlParse(activeTabUrl).hostname;
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
  }: BottomTabBarProps): React.ReactElement | null => {
    if (isKeyboardHidden) {
      return (
        <TabBar
          state={state}
          // TabBar expects an ExtendedBottomTabDescriptor map that carries the
          // custom option keys (tabBarIconKey, callback, rootScreenName) we set
          // below. The navigator's descriptors satisfy that shape at runtime
          // but TypeScript only sees the base BottomTabDescriptorMap here.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          descriptors={descriptors as any}
          navigation={navigation}
        />
      );
    }
    return null;
  };

  return (
    <DrawerContext.Provider value={{ drawerRef }}>
      <Drawer ref={drawerRef}>
        <Tab.Navigator
          initialRouteName={Routes.WALLET.HOME}
          tabBar={renderTabBar}
        >
          <Tab.Screen
            name={Routes.WALLET.HOME}
            options={options.home as BottomTabNavigationOptions}
            component={WalletTabModalFlow}
          />
          <Tab.Screen
            name={Routes.TRANSACTIONS_VIEW}
            options={options.activity as BottomTabNavigationOptions}
            component={TransactionsHome}
          />
          <Tab.Screen
            name={Routes.MODAL.WALLET_ACTIONS}
            options={options.actions as BottomTabNavigationOptions}
            component={WalletTabModalFlow}
          />
          <Tab.Screen
            name={Routes.BROWSER.HOME}
            options={options.browser as BottomTabNavigationOptions}
            component={BrowserFlow}
          />

          <Tab.Screen
            name={Routes.SETTINGS_VIEW}
            options={options.settings as BottomTabNavigationOptions}
            component={SettingsFlow}
          />
        </Tab.Navigator>
      </Drawer>
    </DrawerContext.Provider>
  );
};

const Webview = () => (
  <Stack.Navigator>
    {/* See note on NotificationsOptInStack above: stray `mode` prop on
        Stack.Screen from the legacy JS was a no-op and has been dropped. */}
    <Stack.Screen
      name="SimpleWebview"
      component={SimpleWebview}
      options={navOptions(SimpleWebview)}
    />
  </Stack.Navigator>
);

const SendView = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Send"
      component={Send}
      options={navOptions(Send)}
    />
  </Stack.Navigator>
);

const NftDetailsModeView = (props: NftDetailsScreenProps) => (
  <Stack.Navigator>
    <Stack.Screen
      name=" " // No name here because this title will be displayed in the header of the page
      component={NftDetails}
      initialParams={{
        collectible: props.route.params?.collectible,
      }}
    />
  </Stack.Navigator>
);

const NftDetailsFullImageModeView = (props: NftDetailsFullImageScreenProps) => (
  <Stack.Navigator>
    <Stack.Screen
      name=" " // No name here because this title will be displayed in the header of the page
      component={NftDetailsFullImage}
      initialParams={{
        collectible: props.route.params?.collectible,
      }}
    />
  </Stack.Navigator>
);

const SendFlowView = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="SendTo"
      component={SendTo}
      options={navOptions(SendTo)}
    />
    <Stack.Screen
      name="Amount"
      component={Amount}
      options={navOptions(Amount)}
    />
    <Stack.Screen
      name={Routes.SEND_FLOW.CONFIRM}
      component={Confirm}
      options={navOptions(Confirm)}
    />
    <Stack.Screen
      name={Routes.STANDALONE_CONFIRMATIONS.TRANSFER}
      component={RedesignedConfirm}
    />
  </Stack.Navigator>
);

const AddBookmarkView = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="AddBookmark"
      component={AddBookmark}
      options={navOptions(AddBookmark)}
    />
  </Stack.Navigator>
);

const OfflineModeView = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="OfflineMode"
      component={OfflineMode}
      options={navOptions(OfflineMode)}
    />
  </Stack.Navigator>
);

const PaymentRequestView = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="PaymentRequest"
      component={PaymentRequest}
      options={navOptions(PaymentRequest)}
    />
    <Stack.Screen
      name="PaymentRequestSuccess"
      component={PaymentRequestSuccess}
      options={navOptions(PaymentRequestSuccess)}
    />
  </Stack.Navigator>
);

const NotificationsModeView = () => (
  <Stack.Navigator>
    <Stack.Screen
      name={Routes.NOTIFICATIONS.VIEW}
      component={NotificationsView}
      options={navOptions(NotificationsView)}
    />
    <Stack.Screen
      name={Routes.SETTINGS.NOTIFICATIONS}
      component={NotificationsSettings}
      options={navOptions(NotificationsSettings)}
    />
    {/* See note on NotificationsOptInStack above: stray `mode` prop on
        Stack.Screen from the legacy JS was a no-op and has been dropped. */}
    <Stack.Screen
      name={Routes.NOTIFICATIONS.OPT_IN}
      component={OptIn}
      options={navOptions(OptIn)}
    />
    <Stack.Screen
      name={Routes.NOTIFICATIONS.DETAILS}
      component={NotificationsDetails}
      options={navOptions(NotificationsDetails)}
    />
    <Stack.Screen
      name="ContactForm"
      component={ContactForm}
      options={navOptions(ContactForm)}
    />
  </Stack.Navigator>
);

const Swaps = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="SwapsAmountView"
      component={SwapsAmountView}
      options={navOptions(SwapsAmountView)}
    />
    <Stack.Screen
      name="SwapsQuotesView"
      component={SwapsQuotesView}
      options={navOptions(SwapsQuotesView)}
    />
  </Stack.Navigator>
);

const SetPasswordFlow = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ChoosePassword"
      component={ChoosePassword}
      options={navOptions(ChoosePassword)}
    />
    <Stack.Screen
      name="AccountBackupStep1"
      component={AccountBackupStep1}
      options={navOptions(AccountBackupStep1)}
    />
    <Stack.Screen
      name="AccountBackupStep1B"
      component={AccountBackupStep1B}
      options={navOptions(AccountBackupStep1B)}
    />
    <Stack.Screen
      name="ManualBackupStep1"
      component={ManualBackupStep1}
      options={navOptions(ManualBackupStep1)}
    />
    <Stack.Screen
      name="ManualBackupStep2"
      component={ManualBackupStep2}
      options={navOptions(ManualBackupStep2)}
    />
    <Stack.Screen
      name="ManualBackupStep3"
      component={ManualBackupStep3}
      options={navOptions(ManualBackupStep3)}
    />
    <Stack.Screen
      name="OptinMetrics"
      component={OptinMetrics}
      options={navOptions(OptinMetrics)}
    />
  </Stack.Navigator>
);

const MainNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
    mode={'modal'}
    initialRouteName={'Home'}
  >
    <Stack.Screen
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
    <Stack.Screen
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
    <Stack.Screen name="Home" component={HomeTabs} />
    <Stack.Screen name="Asset" component={AssetModalFlow} />
    <Stack.Screen name="Webview" component={Webview} />
    <Stack.Screen name="SendView" component={SendView} />
    <Stack.Screen
      name="SendFlowView"
      component={SendFlowView}
      //Disabling swipe down on IOS
      options={{ gestureEnabled: false }}
    />
    <Stack.Screen name="AddBookmarkView" component={AddBookmarkView} />
    <Stack.Screen name="OfflineModeView" component={OfflineModeView} />
    <Stack.Screen
      name={Routes.NOTIFICATIONS.VIEW}
      component={NotificationsModeView}
    />
    <Stack.Screen name={Routes.QR_TAB_SWITCHER} component={QRTabSwitcher} />
    <Stack.Screen name="NftDetails" component={NftDetailsModeView} />
    <Stack.Screen
      name="NftDetailsFullImage"
      component={NftDetailsFullImageModeView}
    />
    <Stack.Screen name="PaymentRequestView" component={PaymentRequestView} />
    <Stack.Screen name={Routes.RAMP.BUY}>
      {() => <RampRoutes rampType={RampType.BUY} />}
    </Stack.Screen>
    <Stack.Screen name={Routes.RAMP.SELL}>
      {() => <RampRoutes rampType={RampType.SELL} />}
    </Stack.Screen>
    <Stack.Screen name="Swaps" component={Swaps} />
    <Stack.Screen name={Routes.BRIDGE.ROOT} component={BridgeScreenStack} />
    <Stack.Screen
      name={Routes.BRIDGE.MODALS.ROOT}
      component={BridgeModalStack}
      options={clearStackNavigatorOptions}
    />
    <Stack.Screen name="StakeScreens" component={StakeScreenStack} />
    <Stack.Screen
      name="StakeModals"
      component={StakeModalStack}
      options={clearStackNavigatorOptions}
    />
    {/* `headerTitle` / `headerStyle` live under `options` on Stack.Screen in
        react-navigation v5+. The legacy JS set them directly on Stack.Screen,
        where they were silently ignored; they have been folded into `options`
        here for type correctness. The parent navigator's
        `screenOptions={{ headerShown: false }}` still hides the header, so
        this preserves the existing runtime behavior — fixing that would be
        an intentional UI change out of scope for this JS→TS migration. */}
    <Stack.Screen
      name="SetPasswordFlow"
      component={SetPasswordFlow}
      options={{
        headerTitle: () => (
          <Image
            style={styles.headerLogo}
            // eslint-disable-next-line @typescript-eslint/no-require-imports, import/no-commonjs
            source={require('../../../images/branding/metamask-name.png')}
            resizeMode={'contain'}
          />
        ),
        // eslint-disable-next-line react-native/no-inline-styles
        headerStyle: { borderBottomWidth: 0 },
      }}
    />
    {/* TODO: This is added to support slide 4 in the carousel - once changed this can be safely removed*/}
    <Stack.Screen
      name="GeneralSettings"
      component={GeneralSettings}
      options={{
        headerShown: true,
        ...navOptions(GeneralSettings),
      }}
    />
    <Stack.Screen
      name={Routes.NOTIFICATIONS.OPT_IN_STACK}
      component={NotificationsOptInStack}
      options={navOptions(NotificationsOptInStack)}
    />
    <Stack.Screen
      name={Routes.IDENTITY.TURN_ON_BACKUP_AND_SYNC}
      component={TurnOnBackupAndSync}
      options={navOptions(TurnOnBackupAndSync)}
    />
  </Stack.Navigator>
);

export default MainNavigator;
