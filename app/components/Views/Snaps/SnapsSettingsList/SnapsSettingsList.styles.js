///: BEGIN:ONLY_INCLUDE_IF(external-snaps)
import { StyleSheet } from 'react-native';


/**
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.default
    },
    webviewContainer: {
      flex: 0.1
    },
    input: {
      height: 30,
      borderColor: colors.border.default,
      borderWidth: 1,
      margin: 10,
      padding: 5,
      borderRadius: 5
    },
    installBtn: {
      marginHorizontal: 10,
      width: '60%',
      alignSelf: 'center'
    }
  });
};

export default styleSheet;
///: END:ONLY_INCLUDE_IF