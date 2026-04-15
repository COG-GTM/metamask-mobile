import { StyleSheet } from 'react-native';


const createStyles = (colors) =>
StyleSheet.create({
  filters: {
    flexDirection: 'row',
    columnGap: 8,
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: 24
  },
  selectedFilter: {
    borderWidth: 1,
    borderColor: colors.primary.default
  },
  emptyMessage: {
    textAlign: 'center'
  },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.muted
  }
});

export default createStyles;