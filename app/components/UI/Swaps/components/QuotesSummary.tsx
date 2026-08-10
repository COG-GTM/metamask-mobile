import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  StyleProp,
  TextStyle,
  ViewProps,
  ViewStyle,
} from 'react-native';
import Text from '../../../Base/Text';
import { useTheme } from '../../../../util/theme';
import { Colors } from '../../../../util/theme/models';

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-commonjs
const piggyBank = require('../../../../images/piggybank.png');
/* eslint-enable @typescript-eslint/no-var-requires */
/* eslint-enable @typescript-eslint/no-require-imports */

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

const QuotesSummaryBase = (props: ViewProps) => <View {...props} />;

interface HeaderProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  /** Wether the piggybank is shown or not */
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

const Body = ({ style, ...props }: ViewProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.body, style]} {...props} />;
};
const HeaderText = ({
  style,
  ...props
}: React.ComponentProps<typeof Text> & { style?: StyleProp<TextStyle> }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <Text style={[styles.headerText, style]} {...props} />;
};
const Separator = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.separator, style]} />;
};

const QuotesSummary = Object.assign(QuotesSummaryBase, {
  Body,
  Header,
  HeaderText,
  Separator,
});

export default QuotesSummary;
