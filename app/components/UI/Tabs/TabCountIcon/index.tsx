import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { connect } from 'react-redux';
import { fontStyles } from '../../../../styles/common';
import { useTheme } from '../../../../util/theme';
import { Colors } from '../../../../util/theme/models';
import { RootState } from '../../../../reducers';
import { BrowserViewSelectorsIDs } from '../../../../../e2e/selectors/Browser/BrowserView.selectors';

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
   * The current number of open tabs
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
