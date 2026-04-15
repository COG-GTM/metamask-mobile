




import { getJsxChildren } from '@metamask/snaps-utils';

import { mapToTemplate } from '../utils';


export const selector = ({
  element: e,
  form,
  ...params
}) => {
  const children = getJsxChildren(e);

  const options = children.map((child) => ({
    value: child.props.value,
    disabled: child.props.disabled
  }));

  const optionComponents = children.map((child) =>
  mapToTemplate({
    ...params,
    form,
    element: child.props.children
  })
  );

  return {
    element: 'SnapUISelector',
    props: {
      id: e.props.name,
      name: e.props.name,
      title: e.props.title,
      disabled: e.props.disabled,
      form,
      options
    },
    propComponents: {
      optionComponents
    }
  };
};