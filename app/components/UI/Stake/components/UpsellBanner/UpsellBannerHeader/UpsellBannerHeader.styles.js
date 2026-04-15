import { StyleSheet } from 'react-native';


const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      backgroundColor: colors.background.alternative,
      borderRadius: 8,
      gap: 8,
      paddingVertical: 24,
      paddingHorizontal: 16,
      alignItems: 'center'
    }
  });
};

export default styleSheet;