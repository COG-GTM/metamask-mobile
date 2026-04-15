// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for SegmentedControl component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) =>


{
  const { vars } = params;
  const { style, isButtonWidthFlexible } = vars;

  return StyleSheet.create({
    base: Object.assign(
      {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
      },
      style
    ),

    buttonContainer: {
      // Only use flex: 1 when buttons should have fixed equal widths (not the default)
      ...(isButtonWidthFlexible ? {} : { flex: 1 }),
      alignItems: 'center',
      justifyContent: 'center'
    },

    scrollContentContainer: {
      alignItems: 'center'
    }
  });
};

export default styleSheet;