import React from 'react';
import { StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
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
    },
    tabBar: {
      borderColor: colors.border.muted,
    },
  });

interface TabBarProps {
  goToPage?: (page: number) => void;
  activeTab?: number;
  tabs?: string[];
  backgroundColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  textStyle?: StyleProp<TextStyle>;
  tabStyle?: StyleProp<ViewStyle>;
  renderTab?: (
    name: string,
    page: number,
    isTabActive: boolean,
    onPressHandler: (page: number) => void,
  ) => React.ReactNode;
  underlineStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

function TabBar(props: TabBarProps) {
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
