import { StyleSheet } from 'react-native';

import Device from '../../../util/device';
/**
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;
  return StyleSheet.create({
    modal: {
      backgroundColor: colors.background.default,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      minHeight: '50%',
      paddingBottom: Device.isIphoneX() ? 20 : 0,
      overflow: 'hidden'
    },
    content: {
      paddingHorizontal: 16
    }
  });
};

export default styleSheet;