import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { fontStyles } from '../../../../styles/common';
import { connect } from 'react-redux';
import { useTheme } from '../../../../util/theme';
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
   * Component styles
   */
  style?: StyleProp<ViewStyle>;
}

interface StateProps {
  /**
   * Switches to a specific tab
   */
  tabCount: number;
}

type Props = OwnProps & StateProps;

/**
 * Component that renders an icon showing
 * the current number of open tabs
 */
const TabCountIcon = ({ tabCount, style }: Props) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.tabIcon, style]}>
      <Text style={styles.tabCount} testID={BrowserViewSelectorsIDs.TABS_NUMBER}>
        {tabCount}
      </Text>
    </View>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  tabCount: state.browser.tabs.length,
});

export default connect(mapStateToProps)(TabCountIcon);
