import { StyleSheet } from 'react-native';
import { fontStyles } from '../../../styles/common';


const createStyles = (colors) =>
StyleSheet.create({
  text: {
    fontSize: 18,
    marginVertical: 3,
    color: colors.text.default,
    ...fontStyles.bold
  },
  hero: {
    fontSize: 22
  },
  centered: {
    textAlign: 'center'
  }
});

export default createStyles;