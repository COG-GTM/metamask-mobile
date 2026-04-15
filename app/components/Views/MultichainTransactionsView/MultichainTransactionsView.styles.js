import { StyleSheet } from 'react-native';

import { fontStyles } from '../../../styles/common';

const createStyles = (colors) =>
StyleSheet.create({
  wrapper: {
    flex: 1
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    fontSize: 20,
    color: colors.text.muted,
    ...fontStyles.normal
  },
  viewMoreWrapper: {
    padding: 16
  },
  viewMoreButton: {
    width: '100%'
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default createStyles;