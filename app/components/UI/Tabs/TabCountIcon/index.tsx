import React, { PureComponent } from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import { connect } from 'react-redux';
import { fontStyles } from '../../../../styles/common';
import { ThemeContext, mockTheme } from '../../../../util/theme';
import { BrowserViewSelectorsIDs } from '../../../../../e2e/selectors/Browser/BrowserView.selectors';
import { RootState } from '../../../../reducers';
import { Theme } from '../../../../util/theme/models';

interface Styles {
  tabIcon: ViewStyle;
  tabCount: ViewStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
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

interface TabCountIconProps {
  tabCount?: number;
  style?: ViewStyle;
}

class TabCountIcon extends PureComponent<TabCountIconProps> {
  declare context: React.ContextType<typeof ThemeContext>;

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

const mapStateToProps = (state: RootState) => ({
  tabCount: state.browser.tabs.length,
});

TabCountIcon.contextType = ThemeContext;

export default connect(mapStateToProps)(TabCountIcon);
