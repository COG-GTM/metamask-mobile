
import { getJsxChildren } from '@metamask/snaps-utils';

import { mapTextToTemplate } from '../utils';

import {
  TextColor,
  TextVariant } from
'../../../../component-library/components/Texts/Text/Text.types';
import { typography } from '@metamask/design-tokens';

function getTextColor(color) {
  switch (color) {
    case 'default':
      return TextColor.Default;
    case 'alternative':
      return TextColor.Alternative;
    case 'muted':
      return TextColor.Muted;
    case 'error':
      return TextColor.Error;
    case 'success':
      return TextColor.Success;
    case 'warning':
      return TextColor.Warning;
    default:
      return null;
  }
}

function getFontWeight(
color,
inheritedWeight)
{
  switch (color ?? inheritedWeight) {
    case 'bold':
      return typography.sBodyMDBold.fontWeight;
    case 'medium':
      return typography.sBodyMDMedium.fontWeight;
    case 'regular':
    default:
      return typography.sBodyMD.fontWeight;
  }
}

function getTextAlignment(
alignment,
inheritedAlignment)
{
  switch (alignment) {
    case 'start':
      return 'left';
    case 'center':
      return 'center';
    case 'end':
      return 'right';
    default:
      return inheritedAlignment ?? 'left';
  }
}

function getTextVariant(
size,
inheritedVariant)
{
  switch (size) {
    case 'md':
      return TextVariant.BodyMD;
    case 'sm':
      return TextVariant.BodySM;
    default:
      return inheritedVariant ?? TextVariant.BodyMD;
  }
}

export const text = ({
  element: e,
  ...params
}) => {
  const textColor = getTextColor(e.props.color) ?? params.textColor;
  const textVariant = getTextVariant(e.props.size, params.textVariant);
  const textFontWeight = getFontWeight(
    e.props.fontWeight,
    params.textFontWeight
  );
  const textAlignment = getTextAlignment(
    e.props.alignment,
    params.textAlignment
  );
  return {
    element: 'Text',
    children: mapTextToTemplate(
      getJsxChildren(e),
      {
        ...params,
        textSize: e.props.size,
        textColor,
        textVariant,
        textFontWeight,
        textAlignment
      }
    ),
    props: {
      variant: textVariant,
      color: textColor,
      style: {
        fontWeight: textFontWeight,
        textAlign: textAlignment
      }
    }
  };
};