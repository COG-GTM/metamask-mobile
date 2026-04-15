
import { getJsxChildren } from '@metamask/snaps-utils';

import { mapTextToTemplate } from '../utils';


export const link = ({
  element: e,
  ...params
}) => {
  const linkColor = params.theme.colors.info.default;

  const processedChildren = getJsxChildren(e).map((child) => {
    if (typeof child === 'string') {
      return child;
    }

    if (child?.type === 'Icon') {
      return {
        ...child,
        props: {
          ...child.props,
          color: 'primary'
        }
      };
    }

    return child;
  });

  return {
    element: 'SnapUILink',
    children: mapTextToTemplate(
      processedChildren,
      { ...params, textColor: linkColor }
    ),
    props: {
      href: e.props.href
    }
  };
};