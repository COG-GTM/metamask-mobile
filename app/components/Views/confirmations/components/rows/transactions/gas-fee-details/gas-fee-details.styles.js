import { StyleSheet } from 'react-native';
import { fontStyles } from '../../../../../../../styles/common';


const styleSheet = (params) => {
  const { theme } = params;

  return StyleSheet.create({
    primaryValue: {
      color: theme.colors.text.default,
      ...fontStyles.normal
    },
    secondaryValue: {
      color: theme.colors.text.alternative,
      ...fontStyles.normal,
      marginRight: 8
    },
    valueContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center'
    }
  });
};

export default styleSheet;