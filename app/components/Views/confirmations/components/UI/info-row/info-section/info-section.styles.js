import { StyleSheet } from 'react-native';



const styleSheet = (params) => {
  const { theme } = params;

  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.default,
      borderRadius: 8,
      paddingTop: 12,
      paddingBottom: 8,
      paddingHorizontal: 8,
      marginBottom: 8
    }
  });
};

export default styleSheet;