import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

import { Colors } from '../../../../../../../util/theme/models';

const createStyles = (colors: Colors) => ({
  overview: (noMargin?: boolean): ViewStyle => ({
    marginHorizontal: noMargin ? 0 : 24,
    paddingTop: 10,
    paddingBottom: 10,
  }),
  gasInfoIcon: (hasOrigin?: string | boolean): TextStyle => ({
    color: hasOrigin ? colors.warning.default : colors.icon.muted,
  }),
  ...StyleSheet.create({
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
  }),
});

export default createStyles;
