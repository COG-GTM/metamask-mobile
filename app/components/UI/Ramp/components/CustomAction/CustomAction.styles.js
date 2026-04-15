import { StyleSheet } from 'react-native';


const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;
  return StyleSheet.create({
    tags: {
      display: 'flex',
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8
    },
    buyButton: {
      marginTop: 10
    },
    title: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    infoIcon: {
      marginLeft: 8,
      color: colors.icon.alternative
    },
    data: {
      marginTop: 4,
      overflow: 'hidden'
    }
  });
};
export default styleSheet;