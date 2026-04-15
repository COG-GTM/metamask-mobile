
import { getJsxChildren } from '@metamask/snaps-utils';

import { mapTextToTemplate } from '../utils';

import { TextVariant } from '../../../../component-library/components/Texts/Text';

export const bold = ({
  element: e,
  ...params
}) => ({
  element: 'Text',
  children: mapTextToTemplate(
    getJsxChildren(e),
    params
  ),
  props: {
    variant: TextVariant.BodyMDBold,
    color: params.textColor,
    numberOfLines: 0,
    flexWrap: 'wrap'
  }
});