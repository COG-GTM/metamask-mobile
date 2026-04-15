import { StyleSheet } from 'react-native';


import { fontStyles } from '../../../../../../../../styles/common';

const styleSheet = (params) => {
  const { theme } = params;

  return StyleSheet.create({
    container: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center'
    },
    value: {
      color: theme.colors.text.default,
      ...fontStyles.normal,
      marginLeft: 8
    }
  });
};

export default styleSheet;