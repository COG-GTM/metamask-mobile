import { StyleSheet } from 'react-native';



const styleSheet = (params) => {
  const { theme } = params;

  return StyleSheet.create({
    modal: {
      height: 600,
      margin: 0,
      zIndex: 1000
    },
    contentWrapper: {
      zIndex: 1000,
      paddingHorizontal: 8,
      marginHorizontal: 8,
      paddingBottom: 32,
      borderRadius: 20,
      backgroundColor: theme.colors.background.default
    }
  });
};

export default styleSheet;