// Third party dependencies.
import { StyleSheet } from 'react-native';
import { typography } from '@metamask/design-tokens';
import {
  getFontFamily,
  TextVariant } from
'../../../../../component-library/components/Texts/Text';

/**
 * Style sheet function for AmbiguousAddressSheet component.
 *
 * @returns StyleSheet object.
 */

export default (colors) =>
StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    alignSelf: 'center'
  },
  heading: {
    ...typography.sHeadingMD,
    fontFamily: getFontFamily(TextVariant.HeadingMD),
    color: colors.text.default
  },
  body: {
    ...typography.sBodyMD,
    fontFamily: getFontFamily(TextVariant.BodyMD),
    color: colors.text.default
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingTop: 16
  },
  button: {
    flex: 1
  }
});