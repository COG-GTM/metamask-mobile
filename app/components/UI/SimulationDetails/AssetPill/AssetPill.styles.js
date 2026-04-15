import { StyleSheet } from 'react-native';

import sharedStyles from '../shared.styles';

const styleSheet = (params) => {
  const { theme } = params;

  return StyleSheet.create({
    nativeAssetPill: {
      ...sharedStyles.pill,
      backgroundColor: theme.colors.background.alternative
    },
    assetPill: {
      flexShrink: 1,
      flexBasis: 'auto',
      minWidth: 0
    }
  });
};

export default styleSheet;