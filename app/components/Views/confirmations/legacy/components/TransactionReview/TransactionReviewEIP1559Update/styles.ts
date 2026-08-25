import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { ThemeColors } from '@metamask/design-tokens';

const createStyles = (colors: ThemeColors) => {
  const staticStyles = StyleSheet.create({
    valuesContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    gasInfoContainer: {
      paddingLeft: 2,
    },
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

  return {
    ...staticStyles,
    overview: (noMargin?: boolean): ViewStyle => ({
      marginHorizontal: noMargin ? 0 : 24,
      paddingTop: 10,
      paddingBottom: 10,
    }),
    gasInfoIcon: (hasOrigin?: boolean | string): TextStyle => ({
      color: hasOrigin ? colors.warning.default : colors.icon.muted,
    }),
  };
};

export default createStyles;
