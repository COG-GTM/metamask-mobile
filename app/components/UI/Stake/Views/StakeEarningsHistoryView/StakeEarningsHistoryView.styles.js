
import { StyleSheet } from 'react-native';

const stylesSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;

  return StyleSheet.create({
    mainContainer: {
      flexGrow: 1,
      paddingTop: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.background.default,
      justifyContent: 'space-between'
    }
  });
};

export default stylesSheet;