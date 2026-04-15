import { StyleSheet } from 'react-native';

/**
 * Style sheet function for BannerAlert component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (_params) =>
StyleSheet.create({
  attributionBase: {
    height: 40,
    marginTop: 8
  },
  attributionItem: {
    marginRight: 4
  },
  wrapper: {
    marginBottom: 10
  },
  details: {
    marginLeft: 10
  },
  detailsItem: {
    marginBottom: 4
  }
});

export default styleSheet;