
import { StyleSheet } from 'react-native';

const styleSheet = (params) =>




{
  const {
    theme,
    vars: { selected }
  } = params;
  const { colors } = theme;
  return StyleSheet.create({
    button: {
      backgroundColor: selected ?
      colors.background.pressed :
      colors.background.default,
      borderRadius: 40,
      paddingVertical: 2,
      paddingHorizontal: 8,
      // compensates for letter spacing
      paddingLeft: 10,
      alignItems: 'center',
      justifyContent: 'center'
    },
    label: {
      letterSpacing: 3,
      textAlign: 'center'
    }
  });
};

export default styleSheet;