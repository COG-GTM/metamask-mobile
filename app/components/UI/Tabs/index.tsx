import React, { PureComponent } from 'react';
import {
  Dimensions,
  InteractionManager,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Text from '../../../component-library/components/Texts/Text';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { strings } from '../../../../locales/i18n';
import { BrowserViewSelectorsIDs } from '../../../../e2e/selectors/Browser/BrowserView.selectors';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { fontStyles, colors as importedColors } from '../../../styles/common';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';
import withMetricsAwareness from '../../hooks/useMetrics/withMetricsAwareness';
import TabThumbnail from './TabThumbnail';
import type { Theme } from '../../../util/theme/models';
import type { IUseMetricsHook } from '../../hooks/useMetrics/useMetrics.types';
import type { TabThumbnailProps } from './TabThumbnail/TabThumbnail.types';

const THUMB_VERTICAL_MARGIN = 15;
const NAVBAR_SIZE = Device.isIphoneX() ? 88 : 64;
const THUMB_HEIGHT =
  Dimensions.get('window').height / (Device.isIphone5S() ? 4 : 5) +
  THUMB_VERTICAL_MARGIN;
const ROWS_VISIBLE = Math.floor(
  (Dimensions.get('window').height - NAVBAR_SIZE - THUMB_VERTICAL_MARGIN) /
  THUMB_HEIGHT,
);
const TABS_VISIBLE = ROWS_VISIBLE;

const createStyles = (colors: Theme['colors'], shadows: Theme['shadows']) =>
  StyleSheet.create({
    noTabs: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background.alternative,
    },
    noTabsTitle: {
      ...fontStyles.normal,
      color: colors.text.default,
      fontSize: 18,
      marginBottom: 10,
    },
    noTabsDesc: {
      ...fontStyles.normal,
      color: colors.text.alternative,
      fontSize: 14,
    },
    tabAction: {
      flex: 1,
      alignContent: 'center',
      alignSelf: 'flex-start',
      justifyContent: 'center',
    },

    tabActionleft: {
      justifyContent: 'center',
    },
    tabActionRight: {
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    tabActionDone: {
      ...fontStyles.bold,
    },
    tabActionText: {
      color: colors.primary.default,
      ...fontStyles.normal,
      fontSize: 16,
    },
    actionDisabled: {
      color: colors.text.alternative,
    },
    tabsView: {
      flex: 1,
      backgroundColor: colors.background.default,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    tabActions: {
      paddingHorizontal: 20,
      flexDirection: 'row',
      paddingTop: 17,
      ...shadows.size.md,
      backgroundColor: colors.background.default,
      height: 50,
    },
    tabs: {
      flex: 1,
      backgroundColor: colors.background.alternative,
    },
    tabsContent: {
      padding: 15,
      backgroundColor: importedColors.transparent,
    },
    newTabIcon: {
      marginTop: Device.isIos() ? 3 : 2.5,
      color: colors.primary.inverse,
      fontSize: 24,
      textAlign: 'center',
      justifyContent: 'center',
      alignContent: 'center',
    },
    newTabIconButton: {
      alignSelf: 'center',
      justifyContent: 'flex-start',
      alignContent: 'flex-start',
      backgroundColor: colors.primary.default,
      borderRadius: 100,
      width: 30,
      height: 30,
      marginTop: -7,
    }
  });

/**
 * PureComponent that wraps all the thumbnails
 * representing all the open tabs
 */
type BrowserTab = TabThumbnailProps['tab'];

interface TabsProps {
  tabs: BrowserTab[];
  activeTab?: number;
  newTab?: () => void;
  closeTab?: (tab: BrowserTab) => void;
  closeAllTabs?: () => void;
  closeTabsView?: () => void;
  switchToTab?: (tab: BrowserTab) => void;
  animateCurrentTab?: () => void;
  metrics?: IUseMetricsHook;
}

interface TabsState {
  currentTab: number | null;
}

const TypedTabThumbnail = TabThumbnail as React.ComponentType<
  TabThumbnailProps & { ref?: React.RefObject<unknown> }
>;

class Tabs extends PureComponent<TabsProps, TabsState> {
  thumbnails: Record<number, React.RefObject<unknown>> = {};

  state: TabsState = {
    currentTab: null,
  };

  scrollview = React.createRef<ScrollView>();

  constructor(props: TabsProps) {
    super(props);
    this.createTabsRef(props.tabs);
  }

  componentDidMount() {
    if (this.props.tabs.length > TABS_VISIBLE) {
      // Find the selected index
      let index = 0;
      this.props.tabs.forEach((tab, i) => {
        if (tab.id === this.props.activeTab) {
          index = i;
        }
      });

      // Calculate the row

      const row = index + 1;

      // Scroll if needed
      const pos = (row - 1) * THUMB_HEIGHT;

      InteractionManager.runAfterInteractions(() => {
        this.scrollview.current &&
          this.scrollview.current.scrollTo({ x: 0, y: pos, animated: true });
      });
    }
  }

  createTabsRef(tabs: BrowserTab[]) {
    tabs.forEach((tab) => {
      this.thumbnails[tab.id] = React.createRef();
    });
  }

  componentDidUpdate(prevProps: TabsProps) {
    if (prevProps.tabs.length !== Object.keys(this.thumbnails).length) {
      this.createTabsRef(this.props.tabs);
    }
  }

  onSwitch = async (tab: BrowserTab) => {
    this.props.switchToTab?.(tab);
  };

  getStyles = () => {
    const theme = this.context as { colors?: Theme['colors']; shadows?: Theme['shadows'] };
    const colors = theme.colors || mockTheme.colors;
    const shadows = theme.shadows || mockTheme.shadows;
    return createStyles(colors, shadows);
  };

  renderNoTabs() {
    const styles = this.getStyles();

    return (
      <View style={styles.noTabs}>
        <Text
          style={styles.noTabsTitle}
          testID={BrowserViewSelectorsIDs.NO_TABS_MESSAGE}
        >
          {strings('browser.no_tabs_title')}
        </Text>
        <Text style={styles.noTabsDesc}>{strings('browser.no_tabs_desc')}</Text>
      </View>
    );
  }
  renderTabs(tabs: BrowserTab[], activeTab?: number) {
    const styles = this.getStyles();

    return (
      <ScrollView
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
        ref={this.scrollview}
      >
        {tabs.map((tab) => (
          // eslint-disable-next-line react/jsx-key
          <TypedTabThumbnail
            ref={this.thumbnails[tab.id]}
            key={tab.id}
            tab={tab}
            isActiveTab={activeTab === tab.id}
            onClose={this.props.closeTab ?? (() => undefined)}
            onSwitch={this.onSwitch}
          />
        ))}
      </ScrollView>
    );
  }

  onNewTabPress = () => {
    const { tabs } = this.props;
    this.props.newTab?.();
    this.trackNewTabEvent(tabs.length);
  };

  trackNewTabEvent = (tabsNumber: number) => {
    if (!this.props.metrics) {
      return;
    }
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.BROWSER_NEW_TAB)
        .addProperties({
          option_chosen: 'Browser Bottom Bar Menu',
          number_of_tabs: tabsNumber,
        })
        .build(),
    );
  };

  renderTabActions() {
    const { tabs, closeAllTabs, closeTabsView } = this.props;
    const styles = this.getStyles();

    return (
      <View style={styles.tabActions}>
        <TouchableOpacity
          style={[styles.tabAction, styles.tabActionleft]}
          onPress={closeAllTabs}
          testID={BrowserViewSelectorsIDs.CLOSE_ALL_TABS}
        >
          <Text
            style={[
              styles.tabActionText,
              tabs.length === 0 ? styles.actionDisabled : null,
            ]}
          >
            {strings('browser.tabs_close_all')}
          </Text>
        </TouchableOpacity>
        <View style={styles.tabAction}>
          <TouchableOpacity
            style={styles.newTabIconButton}
            onPress={this.onNewTabPress}
            testID={BrowserViewSelectorsIDs.ADD_NEW_TAB}
          >
            <MaterialCommunityIcon
              name="plus"
              size={15}
              style={styles.newTabIcon}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.tabAction, styles.tabActionRight]}
          onPress={closeTabsView}
          testID={BrowserViewSelectorsIDs.DONE_BUTTON}
        >
          <Text
            style={[
              styles.tabActionText,
              styles.tabActionDone,
              tabs.length === 0 ? styles.actionDisabled : null,
            ]}
          >
            {strings('browser.tabs_done')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  render() {
    const { tabs, activeTab } = this.props;
    const styles = this.getStyles();

    return (
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View style={{ ...styles.tabsView, paddingTop: insets?.top ?? 0 }}>
            {tabs.length === 0
              ? this.renderNoTabs()
              : this.renderTabs(tabs, activeTab)}
            {this.renderTabActions()}
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>
    );
  }
}

Tabs.contextType = ThemeContext;

export default withMetricsAwareness(
  Tabs as unknown as React.ComponentType<{ metrics: IUseMetricsHook }>,
);
