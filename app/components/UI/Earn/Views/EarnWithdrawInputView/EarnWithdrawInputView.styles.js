import { StyleSheet } from 'react-native';


const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.default,
      flexDirection: 'column',
      justifyContent: 'center'
    },
    stakeButtonText: {
      fontSize: 18,
      color: colors.text.alternative
    },
    reviewButtonContainer: {
      padding: 16
    },
    keypad: {
      paddingHorizontal: 24
    },
    unstakeBanner: {
      marginHorizontal: 16
    }
  });
};

export default styleSheet;