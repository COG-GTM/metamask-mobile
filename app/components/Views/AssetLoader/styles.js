
import { StyleSheet } from 'react-native';

const styleSheet = ({ theme: { colors } }) =>
StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default styleSheet;