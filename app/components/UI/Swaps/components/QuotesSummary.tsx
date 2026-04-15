import React from 'react';
import { View, StyleSheet, Image, ViewStyle, ViewProps, TextProps } from 'react-native';
import Text from '../../../Base/Text';
import { useTheme } from '../../../../util/theme';
import type { Colors } from '../../../../util/theme/models';

// eslint-disable-next-line import/no-commonjs
const piggyBank = require('../../../../images/piggybank.png');

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    header: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: colors.primary.default,
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
      backgroundColor: colors.primary.muted,
    },
    headerWithPiggy: {
      paddingLeft: 15 + 32 + 10,
    },
    piggyBar: {
      position: 'absolute',
      top: -1,
      left: 21,
      height: 0,
      width: 19,
      borderTopWidth: 1,
      borderColor: colors.primary.muted,
    },
    piggyBank: {
      position: 'absolute',
      top: -12,
      left: 15,
      width: 32,
      height: 44,
    },
    headerText: {
      color: colors.primary.default,
    },
    body: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: colors.primary.default,
      borderBottomRightRadius: 10,
      borderBottomLeftRadius: 10,
    },
    separator: {
      height: 0,
      width: '100%',
      borderTopWidth: 1,
      marginVertical: 6,
      borderTopColor: colors.border.muted,
    },
  });

interface QuotesSummaryComponent extends React.FC<ViewProps> {
  Body: React.FC<{ style?: ViewStyle | ViewStyle[] } & ViewProps>;
  Header: React.FC<HeaderProps>;
  HeaderText: React.FC<{ style?: ViewStyle | ViewStyle[] } & TextProps>;
  Separator: React.FC<{ style?: ViewStyle | ViewStyle[] }>;
}

const QuotesSummary: QuotesSummaryComponent = (props) => <View {...props} />;

interface HeaderProps extends ViewProps {
  style?: ViewStyle | ViewStyle[];
  savings?: boolean;
  children?: React.ReactNode;
}

const Header = ({ style, savings, children, ...props }: HeaderProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View
      style={[styles.header, savings && styles.headerWithPiggy, style]}
      {...props}
    >
      {savings && (
        <>
          <View style={styles.piggyBar} />
          <Image style={styles.piggyBank} source={piggyBank} />
        </>
      )}
      {children}
    </View>
  );
};

const Body = ({ style, ...props }: { style?: ViewStyle | ViewStyle[] } & ViewProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.body, style]} {...props} />;
};
const HeaderText = ({ style, ...props }: { style?: ViewStyle | ViewStyle[] } & TextProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <Text style={[styles.headerText, style]} {...props} />;
};
const Separator = ({ style }: { style?: ViewStyle | ViewStyle[] }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.separator, style]} />;
};

QuotesSummary.Body = Body;
QuotesSummary.Header = Header;
QuotesSummary.HeaderText = HeaderText;
QuotesSummary.Separator = Separator;

export default QuotesSummary;
