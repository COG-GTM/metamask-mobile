import { StyleSheet } from 'react-native';


const styleSheet = ({ theme: { colors } }) =>
StyleSheet.create({
  bannerContainer: {
    backgroundColor: colors.background.default,
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 4
  }
});

export default styleSheet;