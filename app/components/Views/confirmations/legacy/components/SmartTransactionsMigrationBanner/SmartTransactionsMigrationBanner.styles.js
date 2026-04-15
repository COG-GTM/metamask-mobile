import { StyleSheet } from 'react-native';


const styleSheet = (params) =>
StyleSheet.create({
  banner: {
    marginVertical: 16,
    ...params.vars.style
  },
  textContainer: {
    flexWrap: 'wrap'
  },
  link: {
    color: params.theme.colors.primary.default
  },
  description: {
    color: params.theme.colors.text.default
  }
});

export default styleSheet;