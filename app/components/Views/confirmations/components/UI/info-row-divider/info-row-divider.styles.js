import { StyleSheet } from 'react-native';


const styleSheet = (params) => {
  const { theme } = params;

  return StyleSheet.create({
    infoRowDivider: {
      height: 1,
      backgroundColor: theme.colors.border.muted,
      marginVertical: 8,
      marginLeft: -8,
      marginRight: -8
    }
  });
};

export default styleSheet;