import type { Theme } from '@metamask/design-tokens';
import { StyleSheet } from 'react-native';

export const CHART_SIZE = 200;

const styleSheet = (params: { theme: Theme }) => {
  const { theme } = params;
  const { colors } = theme;
  return StyleSheet.create({
    container: {
      width: '100%',
      paddingHorizontal: 16,
    },
    chartContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 16,
    },
    chart: {
      height: CHART_SIZE,
      width: CHART_SIZE,
    },
    centerLabel: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    legendContainer: {
      marginTop: 16,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.muted,
    },
    legendColorIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    legendTextContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    legendNameContainer: {
      flexDirection: 'column',
    },
    legendPercentage: {
      marginLeft: 8,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: CHART_SIZE,
    },
    noDataContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: CHART_SIZE,
      padding: 24,
    },
  });
};

export default styleSheet;
