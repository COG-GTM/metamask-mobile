

import { TextVariant } from '../../../../component-library/components/Texts/Text';

export const generateSize = (size) => {
  switch (size) {
    case 'sm':
      return TextVariant.HeadingSM;
    case 'md':
      return TextVariant.HeadingMD;
    case 'lg':
      return TextVariant.HeadingLG;
    default:
      return TextVariant.HeadingSM;
  }
};

export const heading = ({
  element: e
}) => ({
  element: 'Text',
  children: e.props.children,
  props: {
    variant: generateSize(e.props.size),
    numberOfLines: 0,
    flexWrap: 'wrap'
  }
});