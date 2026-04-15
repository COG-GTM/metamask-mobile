
import { getJsxChildren } from '@metamask/snaps-utils';

import { mapTextToTemplate } from '../utils';

import { TextVariant } from '../../../../component-library/components/Texts/Text';


function getTextColor(theme, props) {
  if (props.disabled) {
    return theme.colors.text.muted;
  }

  switch (props.variant) {
    case 'destructive':
      return theme.colors.error.default;
    default:
    case 'primary':
      return theme.colors.info.default;
  }
}

export const button = ({
  element: e,
  ...params
}) => ({
  element: 'SnapUIButton',
  props: {
    type: e.props.type,
    // This differs from the extension implementation because we don't have proper form support on RN
    form: e.props.form ?? params.form,
    variant: e.props.variant,
    name: e.props.name,
    disabled: e.props.disabled,
    loading: e.props.loading ?? false
  },
  children: mapTextToTemplate(
    getJsxChildren(e),
    {
      ...params,
      textColor: getTextColor(params.theme, e.props),
      textVariant:
      e.props.size === 'sm' ?
      TextVariant.BodySMMedium :
      TextVariant.BodyMDMedium
    }
  )
});