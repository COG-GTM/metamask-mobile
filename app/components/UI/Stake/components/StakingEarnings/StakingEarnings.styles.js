import { StyleSheet } from 'react-native';


const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;

  return StyleSheet.create({
    stakingEarningsContainer: {
      paddingTop: 16
    },
    title: {
      paddingBottom: 8
    },
    keyValueRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8
    },
    keyValuePrimaryTextWrapper: {
      flexDirection: 'row'
    },
    keyValuePrimaryTextWrapperCentered: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    keyValuePrimaryText: {
      color: colors.text.alternative
    },
    keyValueSecondaryText: {
      alignItems: 'flex-end'
    }
  });
};

export default styleSheet;