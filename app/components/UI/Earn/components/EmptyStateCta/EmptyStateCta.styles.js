import { StyleSheet } from 'react-native';


const styleSheet = (params) => {
  const { colors } = params.theme;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: colors.background.alternative,
      borderRadius: 12,
      padding: 16
    },
    iconContainer: {
      paddingBottom: 16
    },
    icon: {
      height: 36,
      width: 36,
      borderRadius: 100
    },
    heading: {
      paddingBottom: 8
    },
    body: {
      textAlign: 'center',
      paddingBottom: 16
    }
  });
};

export default styleSheet;