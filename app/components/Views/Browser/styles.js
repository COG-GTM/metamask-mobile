import { StyleSheet } from 'react-native';

const styleSheet = ({ vars: { topInset } }) =>
StyleSheet.create({
  browserContainer: {
    flex: 1,
    paddingTop: topInset
  }
});

export default styleSheet;