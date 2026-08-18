import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import type { Theme } from '@metamask/design-tokens';

interface TransactionReviewStyles {
  overview: (noMargin: boolean) => ViewStyle;
  valuesContainer: ViewStyle;
  gasInfoContainer: ViewStyle;
  gasInfoIcon: (hasOrigin: boolean) => TextStyle;
  amountContainer: ViewStyle;
  gasRowContainer: ViewStyle;
  gasBottomRowContainer: ViewStyle;
  hitSlop: ViewStyle;
  redInfo: TextStyle;
  timeEstimateContainer: ViewStyle;
  flex: ViewStyle;
}

const createStyleSheet = StyleSheet.create as unknown as (
  styles: TransactionReviewStyles,
) => TransactionReviewStyles;

const createStyles = (colors: Theme['colors']): TransactionReviewStyles =>
  createStyleSheet({
    overview: (noMargin: boolean) => ({
      marginHorizontal: noMargin ? 0 : 24,
      paddingTop: 10,
      paddingBottom: 10,
    }),
    valuesContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    gasInfoContainer: {
      paddingLeft: 2,
    },
    gasInfoIcon: (hasOrigin: boolean) => ({
      color: hasOrigin ? colors.warning.default : colors.icon.muted,
    }),
    amountContainer: {
      flex: 1,
      paddingRight: 10,
    },
    gasRowContainer: {
      flexDirection: 'row',
      flex: 1,
      alignItems: 'center',
      marginBottom: 2,
    },
    gasBottomRowContainer: {
      marginTop: 4,
    },
    hitSlop: {
      top: 10,
      left: 10,
      bottom: 10,
      right: 10,
    },
    redInfo: {
      color: colors.error.default,
    },
    timeEstimateContainer: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    flex: {
      flex: 1,
    },
  });

export default createStyles;
