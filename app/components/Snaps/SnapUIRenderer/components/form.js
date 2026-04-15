
import { getJsxChildren } from '@metamask/snaps-utils';

import { mapToTemplate } from '../utils';

import { FlexDirection } from '../../../UI/Box/box.types';

export const form = ({
  element: e,
  ...params
}) => ({
  // The Form is just a Box that does nothing on mobile.
  element: 'Box',
  children: getJsxChildren(e).map((children) =>
  mapToTemplate({
    element: children,
    form: e.props.name,
    ...params
  })
  ),
  props: {
    flexDirection: FlexDirection.Column,
    gap: 8
  }
});