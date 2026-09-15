import React from 'react';
import { StyleSheet } from 'react-native';
import DefaultTabBar from 'react-native-scrollable-tab-view/DefaultTabBar';
import {
  DefaultTabBarProps,
  TabBarProps as ScrollableTabBarProps,
} from 'react-native-scrollable-tab-view';
import { fontStyles } from '../../styles/common';
import { useTheme } from '../../util/theme';
import { Colors } from '../../util/theme/models';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    tabUnderlineStyle: {
      height: 2,
      backgroundColor: colors.primary.default,
    },
    tabStyle: {
      paddingVertical: 8,
    },
    textStyle: {
      ...fontStyles.normal,
      fontSize: 14,
    },
    tabBar: {
      borderColor: colors.border.muted,
    },
  });

type TabBarProps = Partial<ScrollableTabBarProps<DefaultTabBarProps>>;

function TabBar({ ...props }: TabBarProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <DefaultTabBar
      underlineStyle={styles.tabUnderlineStyle}
      activeTextColor={colors.primary.default}
      inactiveTextColor={colors.text.alternative}
      backgroundColor={colors.background.default}
      tabStyle={styles.tabStyle}
      textStyle={styles.textStyle}
      style={styles.tabBar}
      {...props}
    />
  );
}

export default TabBar;
