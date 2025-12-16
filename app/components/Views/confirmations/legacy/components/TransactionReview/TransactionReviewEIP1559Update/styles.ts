import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../../../../../../util/theme/models';

interface Styles {
  overview: (noMargin: boolean) => ViewStyle;
  valuesContainer: ViewStyle;
  gasInfoContainer: ViewStyle;
  gasInfoIcon: (hasOrigin: boolean) => TextStyle;
  amountContainer: ViewStyle;
  gasRowContainer: ViewStyle;
  gasBottomRowContainer: ViewStyle;
  hitSlop: { top: number; left: number; bottom: number; right: number };
  redInfo: TextStyle;
  timeEstimateContainer: ViewStyle;
  flex: ViewStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
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
  }) as unknown as Styles;

export default createStyles;
