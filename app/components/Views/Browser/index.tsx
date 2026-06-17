import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { captureScreen, CaptureOptions } from 'react-native-view-shot';
import { connect, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import {
  NavigationProp,
  ParamListBase,
  RouteProp,
 useFocusEffect } from '@react-navigation/native';
import { strings } from '../../../../locales/i18n';
import { BrowserViewSelectorsIDs } from '../../../../e2e/selectors/Browser/BrowserView.selectors';
import {
  closeAllTabs as closeAllTabsAction,
  closeTab as closeTabAction,
  createNewTab as createNewTabAction,
  setActiveTab as setActiveTabAction,
  updateTab as updateTabAction,
} from '../../../actions/browser';
import { AvatarAccountType } from '../../../component-library/components/Avatars/Avatar/variants/AvatarAccount';
import {
  ToastContext,
  ToastVariants,
} from '../../../component-library/components/Toast';
import { ToastOptions } from '../../../component-library/components/Toast/Toast.types';
import { useAccounts } from '../../hooks/useAccounts';
import { MetaMetricsEvents } from '../../../core/Analytics';
import AppConstants from '../../../core/AppConstants';
import { getPermittedAccounts } from '../../../core/Permissions';
import Logger from '../../../util/Logger';
import getAccountNameWithENS from '../../../util/accounts';
import Tabs from '../../UI/Tabs';
import BrowserTab from '../BrowserTab/BrowserTab';
import URLParse from 'url-parse';
import { useMetrics } from '../../hooks/useMetrics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appendURLParams } from '../../../util/browser';
import {
  THUMB_WIDTH,
  THUMB_HEIGHT,
  IDLE_TIME_CALC_INTERVAL,
  IDLE_TIME_MAX,
} from './constants';
import { useStyles } from '../../hooks/useStyles';
import styleSheet from './styles';
import Routes from '../../../constants/navigation/Routes';
import { RootState } from '../../../reducers';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { selectSelectedInternalAccount } from '../../../selectors/accountsController';
import { isSolanaAccount } from '../../../core/Multichain/utils';
///: END:ONLY_INCLUDE_IF

const MAX_BROWSER_TABS = 5;

interface BrowserTabInfo {
  id: number;
  url: string;
  image?: string;
  isArchived?: boolean;
  linkType?: string;
}

interface BrowserRouteParams {
  url?: string;
  linkType?: string;
  showTabs?: boolean;
  newTabUrl?: string;
  existingTabId?: number;
  timestamp?: number;
  [key: string]: unknown;
}

interface BrowserProps {
  route: RouteProp<{ params?: BrowserRouteParams }, 'params'>;
  navigation: NavigationProp<ParamListBase>;
  createNewTab: (url?: string, linkType?: string) => void;
  closeAllTabs: () => void;
  closeTab: (id: number) => void;
  setActiveTab: (id: number) => void;
  updateTab: (id: number, info: Partial<BrowserTabInfo>) => void;
  activeTab: number;
  tabs: BrowserTabInfo[];
}

/**
 * Component that wraps all the browser
 * individual tabs and the tabs view
 */
export const Browser = (props: BrowserProps) => {
  const {
    route,
    navigation,
    createNewTab,
    closeAllTabs: triggerCloseAllTabs,
    closeTab: triggerCloseTab,
    setActiveTab,
    updateTab,
    activeTab: activeTabId,
    tabs,
  } = props;
  const previousTabs = useRef<BrowserTabInfo[] | null>(null);
  const { top: topInset } = useSafeAreaInsets();
  const { styles } = useStyles(styleSheet, { topInset });
  const { trackEvent, createEventBuilder, isEnabled } = useMetrics();
  const { toastRef } = useContext(ToastContext);
  const browserUrl = props.route?.params?.url;
  const linkType = props.route?.params?.linkType;
  const prevSiteHostname = useRef(browserUrl);
  const { evmAccounts: accounts, ensByAccountAddress } = useAccounts();
  const [, setTabIdleTimes] = useState<Record<number, number>>({});
  const accountAvatarType = useSelector((state: RootState) =>
    state.settings.useBlockieIcon
      ? AvatarAccountType.Blockies
      : AvatarAccountType.JazzIcon,
  );
  const isDataCollectionForMarketingEnabled = useSelector(
    (state: RootState) => state.security.dataCollectionForMarketing,
  );

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const currentSelectedAccount = useSelector(selectSelectedInternalAccount);
  ///: END:ONLY_INCLUDE_IF

  const homePageUrl = useCallback(
    () =>
      appendURLParams(AppConstants.HOMEPAGE_URL, {
        metricsEnabled: isEnabled(),
        marketingEnabled: isDataCollectionForMarketingEnabled ?? false,
      }).href,
    [isEnabled, isDataCollectionForMarketingEnabled],
  );

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  // TODO remove after we release Solana dapp connectivity
  useFocusEffect(
    useCallback(() => {
      if (currentSelectedAccount && isSolanaAccount(currentSelectedAccount)) {
        toastRef?.current?.showToast({
          variant: ToastVariants.Network,
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          networkImageSource: require('../../../images/solana-logo.png'),
          labelOptions: [
            {
              label: `${strings(
                'browser.toast.solana_dapp_connection_coming_soon.title',
              )} \n`,
              isBold: true,
            },
            {
              label: `${strings(
                'browser.toast.solana_dapp_connection_coming_soon.message',
              )}`,
            },
          ],
        } as ToastOptions);
      }
    }, [toastRef, currentSelectedAccount]),
  );
  ///: END:ONLY_INCLUDE_IF

  const newTab = useCallback(
    (url?: string, linkTypeParam?: string) => {
      // if tabs.length > MAX_BROWSER_TABS, show the max browser tabs modal
      if (tabs.length >= MAX_BROWSER_TABS) {
        navigation.navigate(Routes.MODAL.MAX_BROWSER_TABS_MODAL);
      } else {
        // When a new tab is created, a new tab is rendered, which automatically sets the url source on the webview
        createNewTab(url || homePageUrl(), linkTypeParam);
      }
    },
    [tabs, navigation, homePageUrl, createNewTab],
  );

  const updateTabInfo = useCallback(
    (tabID: number, info: Partial<BrowserTabInfo>) => {
      updateTab(tabID, info);
    },
    [updateTab],
  );

  const hideTabsAndUpdateUrl = (url: string | null | undefined) => {
    navigation.setParams({
      ...route.params,
      showTabs: false,
      url,
    });
  };

  const switchToTab = (tab: BrowserTabInfo) => {
    trackEvent(
      createEventBuilder(MetaMetricsEvents.BROWSER_SWITCH_TAB).build(),
    );
    setActiveTab(tab.id);
    hideTabsAndUpdateUrl(tab.url);
    updateTabInfo(tab.id, {
      url: tab.url,
      isArchived: false,
    });
  };

  const hasAccounts = useRef(Boolean(accounts.length));

  useEffect(() => {
    const interval = setInterval(() => {
      // every so often calc each tab's idle time
      setTabIdleTimes((prevIdleTimes) => {
        const newIdleTimes: Record<number, number> = { ...prevIdleTimes };
        // for each existing tab
        tabs.forEach((tab) => {
          // if it isn't the active tab
          if (tab.id !== activeTabId) {
            // add idle time for each non-active tab
            newIdleTimes[tab.id] =
              (newIdleTimes[tab.id] || 0) + IDLE_TIME_CALC_INTERVAL;
            // if the tab has surpassed the maximum
            if (newIdleTimes[tab.id] > IDLE_TIME_MAX) {
              // then "archive" it
              updateTab(tab.id, {
                isArchived: true,
              });
            }
          } else {
            // set any active tab as NOT "archived"
            // this can mean "unarchiving" a tab so that, for example,
            // the actual browser tab window is mounted again
            updateTab(tab.id, {
              isArchived: false,
            });
            // also set new tab idle time back to zero
            newIdleTimes[tab.id] = 0;
          }
        });
        return newIdleTimes;
      });
    }, IDLE_TIME_CALC_INTERVAL);

    return () => clearInterval(interval);
  }, [tabs, activeTabId, updateTab]);

  useEffect(() => {
    const checkIfActiveAccountChanged = () => {
      const hostname = new URLParse(browserUrl ?? '').hostname;
      const permittedAccounts = getPermittedAccounts(hostname);
      const activeAccountAddress = permittedAccounts?.[0];

      if (activeAccountAddress) {
        const accountName = getAccountNameWithENS({
          accountAddress: activeAccountAddress,
          accounts,
          ensByAccountAddress,
        });
        // Show active account toast
        toastRef?.current?.showToast({
          variant: ToastVariants.Account,
          labelOptions: [
            {
              label: `${accountName} `,
              isBold: true,
            },
            { label: strings('toast.now_active') },
          ],
          accountAddress: activeAccountAddress,
          accountAvatarType,
        } as ToastOptions);
      }
    };

    // Handle when the Browser initially mounts and when url changes.
    if (accounts.length && browserUrl) {
      const hostname = new URLParse(browserUrl ?? '').hostname;
      if (prevSiteHostname.current !== hostname || !hasAccounts.current) {
        checkIfActiveAccountChanged();
      }
      hasAccounts.current = true;
      prevSiteHostname.current = hostname;
    }
  }, [browserUrl, accounts, ensByAccountAddress, accountAvatarType, toastRef]);

  // componentDidMount
  useEffect(
    () => {
      const currentUrl = route.params?.newTabUrl;
      const existingTabId = route.params?.existingTabId;
      if (!currentUrl && !existingTabId) {
        // Nothing from deeplink, carry on.
        const activeTab = tabs.find((tab) => tab.id === activeTabId);
        if (activeTab) {
          // Resume where last left off.
          switchToTab(activeTab);
        } else {
          /* eslint-disable-next-line */
          if (tabs.length) {
            // Tabs exists but no active set. Show first tab.
            switchToTab(tabs[0]);
          } else {
            // No tabs. Create a new one.
            newTab();
          }
        }
      }
      // Initialize previous tabs. This prevents the next useEffect block from running the first time.
      previousTabs.current = tabs || [];
    },
    /* eslint-disable-next-line */
    [],
  );

  // Detect when new tab is added and switch to it.
  useEffect(
    () => {
      if (previousTabs.current && tabs.length > previousTabs.current.length) {
        // New tab was added.
        const tabToSwitch = tabs[tabs.length - 1];
        switchToTab(tabToSwitch);
      }
      previousTabs.current = tabs;
    },
    /* eslint-disable-next-line */
    [tabs],
  );

  // Handle links with associated timestamp.
  useEffect(
    () => {
      const newTabUrl = route.params?.newTabUrl;
      const deeplinkTimestamp = route.params?.timestamp;
      const existingTabId = route.params?.existingTabId;
      if (newTabUrl && deeplinkTimestamp) {
        // Open url from link.
        newTab(newTabUrl, linkType);
      } else if (existingTabId) {
        const existingTab = tabs.find((tab) => tab.id === existingTabId);
        if (existingTab) {
          switchToTab(existingTab);
        }
      }
    },
    /* eslint-disable-next-line */
    [
      route.params?.timestamp,
      route.params?.newTabUrl,
      route.params?.existingTabId,
    ],
  );

  const takeScreenshot = useCallback(
    (url: string, tabID: number) =>
      new Promise<boolean>((resolve, reject) => {
        captureScreen({
          format: 'jpg',
          quality: 0.2,
          THUMB_WIDTH,
          THUMB_HEIGHT,
        } as CaptureOptions).then(
          (uri: string) => {
            updateTab(tabID, {
              url,
              image: uri,
            });
            resolve(true);
          },
          (error: Error) => {
            Logger.error(error, `Error saving tab ${url}`);
            reject(error);
          },
        );
      }),
    [updateTab],
  );

  const showTabs = useCallback(async () => {
    try {
      const activeTab = tabs.find(
        (tab) => tab.id === activeTabId,
      ) as BrowserTabInfo;
      await takeScreenshot(activeTab.url, activeTab.id);
    } catch (e) {
      Logger.error(e as Error);
    }

    navigation.setParams({
      ...route.params,
      showTabs: true,
    });
  }, [tabs, activeTabId, route.params, navigation, takeScreenshot]);

  const closeAllTabs = () => {
    if (tabs.length) {
      triggerCloseAllTabs();
      navigation.setParams({
        ...route.params,
        url: null,
      });
    }
  };

  const closeTab = (tab: BrowserTabInfo) => {
    // If the tab was selected we have to select
    // the next one, and if there's no next one,
    // we select the previous one.
    if (tab.id === activeTabId) {
      if (tabs.length > 1) {
        tabs.forEach((t: BrowserTabInfo, i: number) => {
          if (t.id === tab.id) {
            let nextTab = tabs[i - 1];
            if (tabs[i + 1]) {
              nextTab = tabs[i + 1];
            }
            setActiveTab(nextTab.id);
            navigation.setParams({
              ...route.params,
              url: nextTab.url,
            });
          }
        });
      } else {
        navigation.setParams({
          ...route.params,
          url: null,
        });
      }
    }

    triggerCloseTab(tab.id);
  };

  const closeTabsView = () => {
    if (tabs.length) {
      navigation.setParams({
        ...route.params,
        showTabs: false,
      });
    }
  };

  const renderTabList = () => {
    const shouldShowTabs = route.params?.showTabs;
    if (shouldShowTabs) {
      return (
        <Tabs
          tabs={tabs}
          activeTab={activeTabId}
          switchToTab={switchToTab}
          newTab={newTab}
          closeTab={closeTab}
          closeTabsView={closeTabsView}
          closeAllTabs={closeAllTabs}
        />
      );
    }
    return null;
  };

  const renderBrowserTabWindows = useCallback(
    () =>
      tabs
        .filter((tab) => !tab.isArchived)
        .map((tab: BrowserTabInfo) => (
          <BrowserTab
            key={`tab_${tab.id}`}
            {...({
              id: tab.id,
              initialUrl: tab.url,
              linkType: tab.linkType,
              updateTabInfo,
              showTabs,
              newTab,
              isInTabsView: route.params?.showTabs ?? false,
              homePageUrl: homePageUrl(),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)}
          />
        )),
    [
      tabs,
      route.params?.showTabs,
      newTab,
      homePageUrl,
      updateTabInfo,
      showTabs,
    ],
  );

  return (
    <View
      style={styles.browserContainer}
      testID={BrowserViewSelectorsIDs.BROWSER_SCREEN_ID}
    >
      {renderBrowserTabWindows()}
      {renderTabList()}
    </View>
  );
};

const mapStateToProps = (state: RootState) => ({
  tabs: state.browser.tabs,
  activeTab: state.browser.activeTab,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  createNewTab: (url?: string, linkType?: string) =>
    dispatch(createNewTabAction(url as string, linkType as string)),
  closeAllTabs: () => dispatch(closeAllTabsAction()),
  closeTab: (id: number) => dispatch(closeTabAction(id)),
  setActiveTab: (id: number) => dispatch(setActiveTabAction(id)),
  updateTab: (id: number, url: Partial<BrowserTabInfo>) =>
    dispatch(updateTabAction(id, url)),
});

export { default as createBrowserNavDetails } from './Browser.types';

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Browser as unknown as React.ComponentType<Partial<BrowserProps>>);
