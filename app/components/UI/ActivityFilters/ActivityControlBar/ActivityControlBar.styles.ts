// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.
import { Theme } from '../../../../util/theme/models';

/**
 * Style sheet function for the activity control bar.
 *
 * @param params Style sheet params.
 * @returns StyleSheet object.
 */
const styleSheet = (params: { theme: Theme }) => {
  const { theme } = params;
  const { colors } = theme;

  return StyleSheet.create({
    base: {
      backgroundColor: colors.background.default,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    chipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    chip: {
      backgroundColor: colors.background.default,
      borderWidth: 1,
      borderColor: colors.border.muted,
      marginRight: 8,
      marginBottom: 4,
      minHeight: 44,
    },
    chipActive: {
      backgroundColor: colors.primary.muted,
      borderWidth: 1,
      borderColor: colors.primary.default,
      marginRight: 8,
      marginBottom: 4,
      minHeight: 44,
    },
    chipLabel: {
      color: colors.text.default,
      maxWidth: 160,
    },
    activeFilterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 4,
    },
    activeFilterToken: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.alternative,
      borderRadius: 16,
      paddingLeft: 12,
      paddingRight: 4,
      paddingVertical: 4,
      marginRight: 8,
      marginBottom: 4,
      minHeight: 32,
    },
    activeFilterTokenLabel: {
      color: colors.text.default,
      marginRight: 4,
    },
    clearAll: {
      marginBottom: 4,
    },
  });
};

export default styleSheet;
