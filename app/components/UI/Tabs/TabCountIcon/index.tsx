import React, { PureComponent } from 'react';
import {
  View,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { fontStyles } from '../../../../styles/common';
import { connect } from 'react-redux';
import { ThemeContext, mockTheme } from '../../../../util/theme';
import { Colors } from '../../../../util/theme/models';
import { BrowserViewSelectorsIDs } from '../../../../../e2e/selectors/Browser/BrowserView.selectors';
import { RootState } from '../../../../reducers';

const createStyles = (colors: Colors) =>
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

interface OwnProps {
  /**
   * PureComponent styles
   */
  style?: StyleProp<ViewStyle>;
}

interface StateProps {
  /**
   * Number of open browser tabs
   */
  tabCount: number;
}

type TabCountIconProps = OwnProps & StateProps;

/**
 * PureComponent that renders an icon showing
 * the current number of open tabs
 */
class TabCountIcon extends PureComponent<TabCountIconProps> {
  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  render() {
    const { tabCount, style } = this.props;
    const colors: Colors = this.context?.colors || mockTheme.colors;
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
