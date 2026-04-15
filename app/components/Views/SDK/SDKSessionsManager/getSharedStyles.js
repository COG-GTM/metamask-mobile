


import {
  getFontFamily,
  TextVariant } from
'../../../../component-library/components/Texts/Text';

const getSharedStyles = (
colors,
typography,
_safeAreaInsets) => (

{
  icon: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 1
  },
  iconText: {
    ...typography.sHeadingSMRegular,
    fontFamily: getFontFamily(TextVariant.HeadingSMRegular),
    textAlign: 'center'
  },
  dappName: {
    flexShrink: 1,
    flexGrow: 1,
    marginLeft: 5,
    marginRight: 5,
    flexWrap: 'wrap'
  },
  disconnectContainer: {
    borderColor: colors.error.default,
    alignItems: 'center',
    height: 24,
    width: 120,
    paddingLeft: 10,
    paddingRight: 10
  },
  disconnectFont: {
    ...typography.sHeadingSMRegular,
    fontFamily: getFontFamily(TextVariant.HeadingSMRegular),
    color: colors.error.default
  }
});

export default getSharedStyles;