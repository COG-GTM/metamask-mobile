import type { Theme } from '@metamask/design-tokens';
import { StyleSheet } from 'react-native';

export const PORTFOLIO_CHART_HEIGHT = 140;

const styleSheet = (params: { theme: Theme; vars: { diff: number } }) => {
  const {
    theme: { colors },
    vars: { diff },
  } = params;

  return StyleSheet.create({
    wrapper: {
      paddingTop: 8,
      paddingBottom: 8,
    },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 4,
    },
    diff: {
      color:
        diff > 0
          ? colors.success.default
          : diff < 0
          ? colors.error.default
          : colors.text.alternative,
    },
    timePeriods: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
  });
};

export default styleSheet;
