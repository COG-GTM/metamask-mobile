import React, { ReactNode } from 'react';
import { View, StyleSheet, Image, StyleProp, ViewStyle, ImageStyle, TextStyle } from 'react-native';
import Text from '../../../Base/Text';
import { useTheme } from '../../../../util/theme';
import { Theme } from '../../../../util/theme/models';

// eslint-disable-next-line import/no-commonjs
const piggyBank = require('../../../../images/piggybank.png');

interface Styles {
  header: ViewStyle;
  headerWithPiggy: ViewStyle;
  piggyBar: ViewStyle;
  piggyBank: ImageStyle;
  headerText: TextStyle;
  body: ViewStyle;
  separator: ViewStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
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

interface QuotesSummaryProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface HeaderProps {
  style?: StyleProp<ViewStyle>;
  savings?: boolean;
  children?: ReactNode;
}

interface BodyProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

interface HeaderTextProps {
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}

interface SeparatorProps {
  style?: StyleProp<ViewStyle>;
}

const QuotesSummary: React.FC<QuotesSummaryProps> & {
  Header: React.FC<HeaderProps>;
  Body: React.FC<BodyProps>;
  HeaderText: React.FC<HeaderTextProps>;
  Separator: React.FC<SeparatorProps>;
} = (props) => <View {...props} />;

const Header: React.FC<HeaderProps> = ({ style, savings, children, ...props }) => {
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

const Body: React.FC<BodyProps> = ({ style, children, ...props }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.body, style]} {...props}>{children}</View>;
};

const HeaderText: React.FC<HeaderTextProps> = ({ style, children, ...props }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <Text style={[styles.headerText, style]} {...props}>{children}</Text>;
};

const Separator: React.FC<SeparatorProps> = ({ style }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.separator, style]} />;
};

QuotesSummary.Body = Body;
QuotesSummary.Header = Header;
QuotesSummary.HeaderText = HeaderText;
QuotesSummary.Separator = Separator;

export default QuotesSummary;
