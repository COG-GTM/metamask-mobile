import React, { PureComponent } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { fontStyles } from '../../../../styles/common';
import { connect } from 'react-redux';
import { ThemeContext, mockTheme } from '../../../../util/theme';
import { BrowserViewSelectorsIDs } from '../../../../../e2e/selectors/Browser/BrowserView.selectors';

interface OwnProps {
  style?: Record<string, unknown>;
}

interface StateProps {
  tabCount: number;
}

type Props = OwnProps & StateProps;

const createStyles = (colors: Record<string, Record<string, string>>) =>
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
class TabCountIcon extends PureComponent<Props> {
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

const mapStateToProps = (state: { browser: { tabs: unknown[] } }): StateProps => ({
  tabCount: state.browser.tabs.length,
});

TabCountIcon.contextType = ThemeContext;

export default connect(mapStateToProps)(TabCountIcon);
