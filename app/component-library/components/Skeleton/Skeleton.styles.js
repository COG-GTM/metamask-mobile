// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


// Internal dependencies.


/**
 * Style sheet function for Skeleton component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { vars, theme } = params;
  const { height, width, style } = vars;

  return StyleSheet.create({
    base: Object.assign(
      {
        borderRadius: 4,
        overflow: 'hidden',
        // Only apply explicit height/width if provided
        ...(height !== undefined && { height }),
        ...(width !== undefined && { width })
      },
      style
    ),
    background: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.icon.alternative,
      borderRadius: 4
    },
    hideChildren: {
      opacity: 0
    },
    childrenContainer: {
      position: 'relative',
      zIndex: 1
    }
  });
};

export default styleSheet;