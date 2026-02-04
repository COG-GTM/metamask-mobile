import type { Theme } from '@metamask/design-tokens';
import { Dimensions, StyleSheet, TextStyle } from 'react-native';
import {
  getFontFamily,
  TextVariant,
} from '../../../../../component-library/components/Texts/Text';

export const CHART_HEIGHT = 200;

const styleSheet = (params: { theme: Theme }) => {
  const { theme } = params;
  const { colors, typography } = theme;
  return StyleSheet.create({
    container: {
      width: '100%',
      paddingHorizontal: 16,
    },
    header: {
      marginBottom: 16,
    },
    valueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    changeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    positiveChange: {
      color: colors.success.default,
    },
    negativeChange: {
      color: colors.error.default,
    },
    chart: {
      height: CHART_HEIGHT,
      width: Dimensions.get('screen').width - 32,
    },
    chartArea: {
      flex: 1,
    },
    chartLoading: {
      width: Dimensions.get('screen').width - 32,
      height: CHART_HEIGHT,
    },
    noDataOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 48,
      zIndex: 1,
    },
    noDataOverlayTitle: {
      ...typography.sHeadingMD,
      fontFamily: getFontFamily(TextVariant.HeadingMD),
      textAlign: 'center',
    } as TextStyle,
    noDataOverlayText: {
      textAlign: 'center',
    } as TextStyle,
    tooltipLine: {
      color: colors.icon.alternative,
    },
    timePeriodContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginTop: 16,
    },
  });
};

export default styleSheet;
