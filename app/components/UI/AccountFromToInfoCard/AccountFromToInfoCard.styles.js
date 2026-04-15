import { StyleSheet } from 'react-native';



const createStyles = (colors) =>
StyleSheet.create({
  container: {
    marginHorizontal: 16
  },
  text: {
    lineHeight: 20,
    color: colors.text.default
  }
});

export default createStyles;