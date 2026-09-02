import { Insets, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Colors } from '../../../../../../../util/theme/models';

export interface TransactionReviewEIP1559UpdateStyles {
  overview: (noMargin: boolean) => ViewStyle;
  valuesContainer: ViewStyle;
  gasInfoContainer: ViewStyle;
  gasInfoIcon: (hasOrigin: boolean) => TextStyle;
  amountContainer: ViewStyle;
  gasRowContainer: ViewStyle;
  gasBottomRowContainer: ViewStyle;
  hitSlop: Insets;
  redInfo: TextStyle;
  timeEstimateContainer: ViewStyle;
  flex: ViewStyle;
}

const createStyles = (colors: Colors): TransactionReviewEIP1559UpdateStyles =>
  // `StyleSheet.create` does not accept dynamic (function) entries in its
  // types, while this stylesheet relies on them, so the shape is restored
  // afterwards.
  StyleSheet.create({
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
  } as unknown as StyleSheet.NamedStyles<TransactionReviewEIP1559UpdateStyles>) as unknown as TransactionReviewEIP1559UpdateStyles;

export default createStyles;
