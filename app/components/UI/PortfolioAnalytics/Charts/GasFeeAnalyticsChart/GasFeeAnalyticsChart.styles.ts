import type { Theme } from '@metamask/design-tokens';
import { StyleSheet } from 'react-native';

export const CHART_HEIGHT = 180;

const styleSheet = (params: { theme: Theme }) => {
  const { theme } = params;
  const { colors } = theme;
  return StyleSheet.create({
    container: {
      width: '100%',
      paddingHorizontal: 16,
    },
    header: {
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalContainer: {
      flexDirection: 'column',
    },
    chartContainer: {
      height: CHART_HEIGHT,
      marginVertical: 8,
    },
    chart: {
      flex: 1,
    },
    timePeriodContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginTop: 16,
    },
    loadingContainer: {
      height: CHART_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noDataContainer: {
      height: CHART_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    selectedBarInfo: {
      alignItems: 'center',
      marginTop: 8,
    },
    barGradientStart: {
      color: colors.warning.muted,
    },
    barGradientEnd: {
      color: colors.warning.default,
    },
    barStroke: {
      color: colors.warning.default,
    },
  });
};

export default styleSheet;
