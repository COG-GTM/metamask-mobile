
import { StyleSheet } from 'react-native';
import {
  getFontFamily,
  TextVariant } from
'../../../../component-library/components/Texts/Text';

const styleSheet = (params) => {
  const { theme } = params;
  const { typography } = theme;
  return StyleSheet.create({
    wrapper: {
      marginTop: 20
    },
    text: {
      ...typography.sBodyMD,
      fontFamily: getFontFamily(TextVariant.BodyMD),
      marginVertical: 0
    },
    title: {
      ...typography.sHeadingSM,
      fontFamily: getFontFamily(TextVariant.HeadingSM),
      marginVertical: 0,
      marginBottom: 4
    }
  });
};

export default styleSheet;