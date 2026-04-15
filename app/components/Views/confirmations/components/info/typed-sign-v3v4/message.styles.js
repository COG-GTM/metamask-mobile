import { StyleSheet } from 'react-native';


import { fontStyles } from '../../../../../../styles/common';

const styleSheet = (params) => {
  const { theme } = params;

  return StyleSheet.create({
    collpasedInfoRow: {
      marginStart: -8,
      paddingBottom: 4
    },
    dataRow: {
      paddingHorizontal: 0,
      paddingBottom: 8
    },
    title: {
      color: theme.colors.text.default,
      ...fontStyles.bold,
      marginBottom: 16
    }
  });
};

export default styleSheet;