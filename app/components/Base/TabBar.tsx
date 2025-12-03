import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import DefaultTabBar from 'react-native-scrollable-tab-view/DefaultTabBar';
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
    } as TextStyle,
    tabBar: {
      borderColor: colors.border.muted,
    },
  });

/**
 * Props interface for TabBar component
 * Based on react-native-scrollable-tab-view DefaultTabBar props
 */
interface TabBarProps {
  backgroundColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  textStyle?: TextStyle;
  tabStyle?: ViewStyle;
  underlineStyle?: ViewStyle;
  style?: ViewStyle;
}

const TabBar: React.FC<TabBarProps> = ({ ...props }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <DefaultTabBar
      underlineStyle={styles.tabUnderlineStyle as ViewStyle}
      activeTextColor={colors.primary.default}
      inactiveTextColor={colors.text.alternative}
      backgroundColor={colors.background.default}
      tabStyle={styles.tabStyle as ViewStyle}
      textStyle={styles.textStyle}
      style={styles.tabBar as ViewStyle}
      {...props}
    />
  );
};

export default TabBar;
