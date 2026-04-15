
import { StyleSheet } from 'react-native';

const styleSheet = (params) =>




{
  const {
    theme,
    vars: { priceDiff }
  } = params;
  const { colors } = theme;
  return StyleSheet.create({
    wrapper: {
      paddingHorizontal: 16
    },
    priceDiff: {
      color:
      priceDiff > 0 ?
      colors.success.default :
      priceDiff < 0 ?
      colors.error.default :
      colors.text.alternative
    },
    priceDiffIcon: {
      marginTop: 10
    },
    loadingPrice: {
      paddingTop: 8
    },
    loadingPriceDiff: {
      paddingTop: 2
    }
  });
};

export default styleSheet;