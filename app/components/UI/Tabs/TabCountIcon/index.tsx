import React, { PureComponent } from 'react';
import { View, StyleSheet, Text, StyleProp, ViewStyle } from 'react-native';
import { fontStyles } from '../../../../styles/common';
import { connect } from 'react-redux';
import { ThemeContext, mockTheme } from '../../../../util/theme';
import { BrowserViewSelectorsIDs } from '../../../../../e2e/selectors/Browser/BrowserView.selectors';
import { Theme } from '../../../../util/theme/models';
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

interface StateProps {
  tabCount: number;
}

interface OwnProps {
  style?: StyleProp<ViewStyle>;
}

type Props = StateProps & OwnProps;

/**
 * PureComponent that renders an icon showing
 * the current number of open tabs
 */
class TabCountIcon extends PureComponent<Props> {
  static contextType = ThemeContext;

  render() {
    const { tabCount, style } = this.props;
    const colors = (this.context as Theme | undefined)?.colors || mockTheme.colors;
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

const mapStateToProps = (state: RootState): StateProps => ({
  tabCount: state.browser.tabs.length,
});

export default connect(mapStateToProps)(TabCountIcon);
