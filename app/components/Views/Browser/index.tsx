import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { View } from 'react-native';
import { captureScreen } from 'react-native-view-shot';
import { connect, useSelector } from 'react-redux';
import { strings } from '../../../../locales/i18n';
import { BrowserViewSelectorsIDs } from '../../../../e2e/selectors/Browser/BrowserView.selectors';
import {
  closeAllTabs,
  closeTab,
  createNewTab,
  setActiveTab,
  updateTab,
} from '../../../actions/browser';
import { AvatarAccountType } from '../../../component-library/components/Avatars/Avatar/variants/AvatarAccount';
import {
  ToastContext,
  ToastVariants,
} from '../../../component-library/components/Toast';
import { useAccounts } from '../../hooks/useAccounts';
import { MetaMetricsEvents } from '../../../core/Analytics';
import AppConstants from '../../../core/AppConstants';
import { getPermittedAccounts } from '../../../core/Permissions';
import Logger from '../../../util/Logger';
import getAccountNameWithENS from '../../../util/accounts';
import Tabs from '../../UI/Tabs';
import BrowserTabImport from '../BrowserTab/BrowserTab';
import URL from 'url-parse';
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
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { selectSelectedInternalAccount } from '../../../selectors/accountsController';
import { isSolanaAccount } from '../../../core/Multichain/utils';
import { useFocusEffect } from '@react-navigation/native';
///: END:ONLY_INCLUDE_IF
import type { Dispatch } from 'redux';
import type { RootState } from '../../../reducers';
import type { ToastOptions } from '../../../component-library/components/Toast/Toast.types';

interface BrowserTabOwnProps {
  id: number;
  initialUrl: string;
  linkType?: string;
  updateTabInfo: (tabID: number, info: Partial<BrowserTabData>) => void;
  showTabs: () => void | Promise<void>;
  newTab: (url?: string, linkType?: string) => void;
  isInTabsView: boolean;
  homePageUrl: string;
}

const BrowserTab =
  BrowserTabImport as unknown as ComponentType<BrowserTabOwnProps>;

const MAX_BROWSER_TABS = 5;

interface BrowserTabData {
  id: number;
  url: string;
  isArchived?: boolean;
  linkType?: string;
  image?: string;
}

interface RouteParams {
  url?: string;
  linkType?: string;
  newTabUrl?: string;
  existingTabId?: number;
  timestamp?: number;
  showTabs?: boolean;
}

interface BrowserRoute {
  params?: RouteParams;
}

interface BrowserNavigation {
  navigate: (route: string, params?: object) => void;
  setParams: (params: object) => void;
}

interface OwnProps {
  navigation: BrowserNavigation;
  route: BrowserRoute;
}

interface StateProps {
  tabs: BrowserTabData[];
  activeTab: number | null;
}

interface DispatchProps {
  createNewTab: (url: string, linkType?: string) => void;
  closeAllTabs: () => void;
  closeTab: (id: number) => void;
  setActiveTab: (id: number) => void;
  updateTab: (id: number, info: Partial<BrowserTabData>) => void;
}

type Props = OwnProps & StateProps & DispatchProps;

/**
 * Component that wraps all the browser
 * individual tabs and the tabs view
 */
export const Browser = (props: Props) => {
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
  const previousTabs = useRef<BrowserTabData[] | null>(null);
  const { top: topInset } = useSafeAreaInsets();
  const { styles } = useStyles(styleSheet, { topInset });
  const { trackEvent, createEventBuilder, isEnabled } = useMetrics();
  const { toastRef } = useContext(ToastContext);
  const browserUrl = props.route?.params?.url;
  const linkType = props.route?.params?.linkType;
  const prevSiteHostname = useRef<string | undefined>(browserUrl);
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
      if (
        currentSelectedAccount &&
        isSolanaAccount(currentSelectedAccount)
      ) {
        toastRef?.current?.showToast({
          variant: ToastVariants.Network,
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
        } as unknown as ToastOptions);
      }
    }, [toastRef, currentSelectedAccount]),
  );
  ///: END:ONLY_INCLUDE_IF

  const newTab = useCallback(
    (url?: string, linkTypeArg?: string) => {
      if (tabs.length >= MAX_BROWSER_TABS) {
        navigation.navigate(Routes.MODAL.MAX_BROWSER_TABS_MODAL);
      } else {
        createNewTab(url || homePageUrl(), linkTypeArg);
      }
    },
    [tabs, navigation, homePageUrl, createNewTab],
  );

  const updateTabInfo = useCallback(
    (tabID: number, info: Partial<BrowserTabData>) => {
      updateTab(tabID, info);
    },
    [updateTab],
  );

  const hideTabsAndUpdateUrl = (url: string) => {
    navigation.setParams({
      ...route.params,
      showTabs: false,
      url,
    });
  };

  const switchToTab: (tab: BrowserTabData) => void = (tab) => {
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
      setTabIdleTimes((prevIdleTimes) => {
        const newIdleTimes: Record<number, number> = { ...prevIdleTimes };
        tabs.forEach((tab) => {
          if (tab.id !== activeTabId) {
            newIdleTimes[tab.id] =
              (newIdleTimes[tab.id] || 0) + IDLE_TIME_CALC_INTERVAL;
            if (newIdleTimes[tab.id] > IDLE_TIME_MAX) {
              updateTab(tab.id, {
                isArchived: true,
              });
            }
          } else {
            updateTab(tab.id, {
              isArchived: false,
            });
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
      if (!browserUrl) return;
      const hostname = new URL(browserUrl).hostname;
      const permittedAccounts = getPermittedAccounts(hostname);
      const activeAccountAddress = permittedAccounts?.[0];

      if (activeAccountAddress) {
        const accountName = getAccountNameWithENS({
          accountAddress: activeAccountAddress,
          accounts,
          ensByAccountAddress,
        });
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
        } as unknown as ToastOptions);
      }
    };

    if (accounts.length && browserUrl) {
      const hostname = new URL(browserUrl).hostname;
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
        const activeTab = tabs.find((tab) => tab.id === activeTabId);
        if (activeTab) {
          switchToTab(activeTab);
        } else {
          /* eslint-disable-next-line */
          if (tabs.length) {
            switchToTab(tabs[0]);
          } else {
            newTab();
          }
        }
      }
      previousTabs.current = tabs || [];
    },
    /* eslint-disable-next-line */
    [],
  );

  useEffect(
    () => {
      if (previousTabs.current && tabs.length > previousTabs.current.length) {
        const tabToSwitch = tabs[tabs.length - 1];
        switchToTab(tabToSwitch);
      }
      previousTabs.current = tabs;
    },
    /* eslint-disable-next-line */
    [tabs],
  );

  useEffect(
    () => {
      const newTabUrl = route.params?.newTabUrl;
      const deeplinkTimestamp = route.params?.timestamp;
      const existingTabId = route.params?.existingTabId;
      if (newTabUrl && deeplinkTimestamp) {
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
          ...(THUMB_WIDTH && THUMB_HEIGHT ? { width: THUMB_WIDTH, height: THUMB_HEIGHT } : {}),
        }).then(
          (uri: string) => {
            updateTab(tabID, {
              url,
              image: uri,
            });
            resolve(true);
          },
          (error: unknown) => {
            Logger.error(error as Error, `Error saving tab ${url}`);
            reject(error);
          },
        );
      }),
    [updateTab],
  );

  const showTabs = useCallback(async () => {
    try {
      const activeTab = tabs.find((tab) => tab.id === activeTabId);
      if (activeTab) {
        await takeScreenshot(activeTab.url, activeTab.id);
      }
    } catch (e) {
      Logger.error(e as Error);
    }

    navigation.setParams({
      ...route.params,
      showTabs: true,
    });
  }, [tabs, activeTabId, route.params, navigation, takeScreenshot]);

  const handleCloseAllTabs = () => {
    if (tabs.length) {
      triggerCloseAllTabs();
      navigation.setParams({
        ...route.params,
        url: null,
      });
    }
  };

  const handleCloseTab = (tab: BrowserTabData) => {
    if (tab.id === activeTabId) {
      if (tabs.length > 1) {
        tabs.forEach((t, i) => {
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

  const TabsAny = Tabs as unknown as ComponentType<Record<string, unknown>>;
  const renderTabList = () => {
    const showTabsView = route.params?.showTabs;
    if (showTabsView) {
      return (
        <TabsAny
          tabs={tabs}
          activeTab={activeTabId}
          switchToTab={switchToTab}
          newTab={newTab}
          closeTab={handleCloseTab}
          closeTabsView={closeTabsView}
          closeAllTabs={handleCloseAllTabs}
        />
      );
    }
    return null;
  };

  const renderBrowserTabWindows = useCallback(
    () =>
      tabs
        .filter((tab) => !tab.isArchived)
        .map((tab) => (
          <BrowserTab
            id={tab.id}
            key={`tab_${tab.id}`}
            initialUrl={tab.url}
            linkType={tab.linkType}
            updateTabInfo={updateTabInfo}
            showTabs={showTabs}
            newTab={newTab}
            isInTabsView={Boolean(route.params?.showTabs)}
            homePageUrl={homePageUrl()}
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

const mapStateToProps = (state: RootState): StateProps => ({
  tabs: state.browser.tabs as BrowserTabData[],
  activeTab: state.browser.activeTab as number | null,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  createNewTab: (url: string, linkType?: string) =>
    dispatch(createNewTab(url, linkType ?? '')),
  closeAllTabs: () => dispatch(closeAllTabs()),
  closeTab: (id: number) => dispatch(closeTab(id)),
  setActiveTab: (id: number) => dispatch(setActiveTab(id)),
  updateTab: (id: number, info: Partial<BrowserTabData>) =>
    dispatch(updateTab(id, info)),
});

export { default as createBrowserNavDetails } from './Browser.types';

export default connect(mapStateToProps, mapDispatchToProps)(Browser);
