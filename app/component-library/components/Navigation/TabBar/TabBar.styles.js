// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.

import Device from '../../../../util/device';

// Internal dependencies.

import { TAB_BAR_HEIGHT } from './TabBar.constants';
/**
 * Style sheet function for TabBar component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const {
    vars: { bottomInset },
    theme: { colors }
  } = params;

  const borderStyle = Device.isAndroid() ?
  {
    borderWidth: 0.5,
    borderColor: colors.border.muted
  } :
  {
    shadowColor: colors.overlay.default,
    shadowOpacity: 1,
    shadowOffset: { height: 4, width: 0 },
    shadowRadius: 8,
    flexBasis: 1
  };

  return StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      height: TAB_BAR_HEIGHT,
      paddingHorizontal: 16,
      marginBottom: bottomInset,
      backgroundColor: colors.background.default
    },
    border: {
      ...borderStyle,
      backgroundColor: colors.background.default
    }
  });
};

export default styleSheet;