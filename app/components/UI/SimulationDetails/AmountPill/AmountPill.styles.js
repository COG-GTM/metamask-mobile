import { StyleSheet } from 'react-native';

import sharedStyles from '../shared.styles';

const styleSheet = (params) =>


{
  const { theme, vars } = params;
  const { colors } = theme;
  const { isNegative } = vars;

  const backgroundColor = isNegative ?
  colors.error.muted :
  colors.success.muted;

  const textColor = isNegative ?
  colors.error.alternative :
  colors.success.default;

  return StyleSheet.create({
    base: {
      ...sharedStyles.pill,
      backgroundColor
    },
    label: {
      color: textColor,
      flexShrink: 1
    }
  });
};

export default styleSheet;