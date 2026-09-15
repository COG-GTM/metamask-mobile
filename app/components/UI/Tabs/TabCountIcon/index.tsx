import React, { PureComponent } from 'react';
import {
  View,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { fontStyles } from '../../../../styles/common';
import { connect } from 'react-redux';
import { ThemeContext, mockTheme } from '../../../../util/theme';
import type { Theme } from '../../../../util/theme/models';
import type { RootState } from '../../../../reducers';
import { BrowserViewSelectorsIDs } from '../../../../../e2e/selectors/Browser/BrowserView.selectors';

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
  tabCount?: number;
  style?: StyleProp<ViewStyle>;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface TabCountIcon {
  context: React.ContextType<typeof ThemeContext>;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class TabCountIcon extends PureComponent<TabCountIconProps, Record<string, never>, React.ContextType<typeof ThemeContext>> {
  static contextType = ThemeContext;


  render() {
    const { tabCount, style } = this.props;
    const colors = this.context.colors || mockTheme.colors;
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

const mapStateToProps = (state: RootState): Pick<TabCountIconProps, 'tabCount'> => ({
  tabCount: state.browser.tabs.length,
});

export default connect(mapStateToProps)(TabCountIcon);
