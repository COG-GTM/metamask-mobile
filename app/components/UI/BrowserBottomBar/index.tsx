import React, { PureComponent } from 'react';
import { Platform, TouchableOpacity, StyleSheet } from 'react-native';
import ElevatedView from 'react-native-elevated-view';
import { Theme } from '@metamask/design-tokens';
import TabCountIcon from '../Tabs/TabCountIcon';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import FeatherIcons from 'react-native-vector-icons/Feather';
import { MetaMetricsEvents } from '../../../core/Analytics';

import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { BrowserViewSelectorsIDs } from '../../../../e2e/selectors/Browser/BrowserView.selectors';
import {
  withMetricsAwareness,
  type IUseMetricsHook,
} from '../../../components/hooks/useMetrics';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    bottomBar: {
      backgroundColor: colors.background.default,
      flexDirection: 'row',
      flex: 0,
      borderTopWidth: Device.isAndroid() ? 0 : StyleSheet.hairlineWidth,
      borderColor: colors.border.muted,
      justifyContent: 'space-between',
    },
    iconButton: {
      height: 60,
      width: 24,
      justifyContent: 'space-around',
      alignItems: 'center',
      textAlign: 'center',
      flex: 1,
    },
    tabIcon: {
      marginTop: 0,
      width: 24,
      height: 24,
    },
    disabledIcon: {
      color: colors.icon.muted,
    },
    icon: {
      width: 24,
      height: 24,
      color: colors.icon.default,
      textAlign: 'center',
    },
  });

interface BrowserBottomBarProps {
  /**
   * Boolean that determines if you can navigate back
   */
  canGoBack?: boolean;
  /**
   * Boolean that determines if you can navigate forward
   */
  canGoForward?: boolean;
  /**
   * Function that allows you to navigate back
   */
  goBack?: () => void;
  /**
   * Function that allows you to navigate forward
   */
  goForward?: () => void;
  /**
   * Function that triggers the tabs view
   */
  showTabs?: () => void;
  /**
   * Function that triggers the change url modal view
   */
  showUrlModal?: () => void;
  /**
   * Function that redirects to the home screen
   */
  goHome?: () => void;
  /**
   * Function that toggles the options menu
   */
  toggleOptions?: () => void;
  /**
   * Metrics injected by withMetricsAwareness HOC
   */
  metrics: IUseMetricsHook;
}

/**
 * Browser bottom bar that contains icons for navigation
 * tab management, url change and other options
 */
class BrowserBottomBar extends PureComponent<BrowserBottomBarProps> {
  trackSearchEvent = () => {
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.BROWSER_SEARCH_USED)
        .addProperties({
          option_chosen: 'Browser Bottom Bar Menu',
          number_of_tabs: undefined,
        })
        .build(),
    );
  };

  trackNavigationEvent = (navigationOption: string) => {
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.BROWSER_NAVIGATION)
        .addProperties({
          option_chosen: navigationOption,
          os: Platform.OS,
        })
        .build(),
    );
  };

  render() {
    const {
      canGoBack,
      goBack,
      canGoForward,
      goForward,
      showTabs,
      goHome,
      showUrlModal,
      toggleOptions,
    } = this.props;
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    const onSearchPress = () => {
      showUrlModal?.();
      this.trackSearchEvent();
    };

    const onBackPress = () => {
      goBack?.();
      this.trackNavigationEvent('Go Back');
    };

    const onForwardPress = () => {
      goForward?.();
      this.trackNavigationEvent('Go Forward');
    };

    const onHomePress = () => {
      goHome?.();
      this.trackNavigationEvent('Go Home');
    };

    return (
      <ElevatedView elevation={11} style={styles.bottomBar}>
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.iconButton}
          testID={BrowserViewSelectorsIDs.BACK_BUTTON}
          disabled={!canGoBack}
        >
          <Icon
            name="angle-left"
            size={24}
            style={[styles.icon, !canGoBack ? styles.disabledIcon : {}]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onForwardPress}
          style={styles.iconButton}
          testID={BrowserViewSelectorsIDs.FORWARD_BUTTON}
          disabled={!canGoForward}
        >
          <Icon
            name="angle-right"
            size={24}
            style={[styles.icon, !canGoForward ? styles.disabledIcon : {}]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSearchPress}
          style={styles.iconButton}
          testID={BrowserViewSelectorsIDs.SEARCH_BUTTON}
        >
          <FeatherIcons name="search" size={24} style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={showTabs}
          style={styles.iconButton}
          testID={BrowserViewSelectorsIDs.TABS_BUTTON}
        >
          <TabCountIcon style={styles.tabIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onHomePress}
          style={styles.iconButton}
          testID={BrowserViewSelectorsIDs.HOME_BUTTON}
        >
          <SimpleLineIcons name="home" size={22} style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleOptions}
          style={styles.iconButton}
          testID={BrowserViewSelectorsIDs.OPTIONS_BUTTON}
        >
          <MaterialIcon name="more-horiz" size={22} style={styles.icon} />
        </TouchableOpacity>
      </ElevatedView>
    );
  }
}

BrowserBottomBar.contextType = ThemeContext;
export default withMetricsAwareness(BrowserBottomBar);
