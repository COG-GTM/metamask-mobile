import { StyleSheet } from 'react-native';


import { fontStyles } from '../../../../../../styles/common';

const styleSheet = (params) => {
  const { theme } = params;

  return StyleSheet.create({
    container: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      paddingBottom: 8,
      paddingHorizontal: 8
    },
    labelContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignSelf: 'flex-start',
      alignItems: 'center',
      minHeight: 38,
      paddingEnd: 4
    },
    value: {
      color: theme.colors.text.default,
      ...fontStyles.normal
    },
    valueOnNewLineContainer: {
      paddingBottom: 8,
      paddingHorizontal: 8
    }
  });
};

export default styleSheet;