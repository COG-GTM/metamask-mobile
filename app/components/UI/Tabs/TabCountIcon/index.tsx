import React, { PureComponent } from 'react';
import {
  View,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Theme } from '@metamask/design-tokens';
import { connect } from 'react-redux';
import { fontStyles } from '../../../../styles/common';
import { ThemeContext, mockTheme } from '../../../../util/theme';
import { BrowserViewSelectorsIDs } from '../../../../../e2e/selectors/Browser/BrowserView.selectors';
import { RootState } from '../../../../reducers';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    tabIcon: {
      borderWidth: 2,
      borderColor: colors.text.alternative,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabCount: {
      color: colors.text.alternative,
      flex: 0,
      fontSize: 15,
      textAlign: 'center',
      alignSelf: 'center',
      ...fontStyles.normal,
    },
  });

/**
 * PureComponent that renders an icon showing
 * the current number of open tabs
 */
interface TabCountIconProps {
  /**
   * Switches to a specific tab
   */
  tabCount?: number;
  /**
   * PureComponent styles
   */
  style?: StyleProp<ViewStyle>;
}

class TabCountIcon extends PureComponent<TabCountIconProps> {
  render() {
    const { tabCount, style } = this.props;
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={[styles.tabIcon, style]}>
        <Text
          style={styles.tabCount}
          testID={BrowserViewSelectorsIDs.TABS_NUMBER}
        >
          {tabCount}
        </Text>
      </View>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  tabCount: state.browser.tabs.length,
});

TabCountIcon.contextType = ThemeContext;

export default connect(mapStateToProps)(TabCountIcon);
