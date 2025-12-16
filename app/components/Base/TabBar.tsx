import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import DefaultTabBar from 'react-native-scrollable-tab-view/DefaultTabBar';
import { TabBarProps, DefaultTabBarProps } from 'react-native-scrollable-tab-view';
import { fontStyles } from '../../styles/common';
import { useTheme } from '../../util/theme';
import { Theme } from '@metamask/design-tokens';

const createStyles = (colors: Theme['colors']) =>
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

type TabBarComponentProps = TabBarProps<DefaultTabBarProps>;

function TabBar({ ...props }: TabBarComponentProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <DefaultTabBar
      underlineStyle={styles.tabUnderlineStyle as ViewStyle}
      activeTextColor={colors.primary.default}
      inactiveTextColor={colors.text.alternative}
      backgroundColor={colors.background.default}
      tabStyle={styles.tabStyle as ViewStyle}
      textStyle={styles.textStyle as TextStyle}
      style={styles.tabBar as ViewStyle}
      {...props}
    />
  );
}

export default TabBar;
