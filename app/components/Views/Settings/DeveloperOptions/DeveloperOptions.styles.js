import { StyleSheet } from 'react-native';


const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;
  return StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      padding: 24,
      paddingBottom: 48
    },
    heading: {
      marginTop: 16
    },
    desc: {
      marginTop: 8
    },
    accessory: {
      marginTop: 16
    }
  });
};

export default styleSheet;