import { StyleSheet } from 'react-native';


export const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;

  return StyleSheet.create({
    setting: {
      marginTop: 32
    },
    desc: {
      marginTop: 8
    },
    picker: {
      borderColor: colors.border.default,
      borderRadius: 5,
      borderWidth: 2,
      marginTop: 16
    }
  });
};

export default styleSheet;