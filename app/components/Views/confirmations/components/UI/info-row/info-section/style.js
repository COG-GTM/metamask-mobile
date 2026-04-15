import { StyleSheet } from 'react-native';



const createStyles = (colors) =>
StyleSheet.create({
  container: {
    backgroundColor: colors.background.default,
    borderColor: colors.border.muted,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    minWidth: '100%',
    marginVertical: 4
  }
});

export default createStyles;