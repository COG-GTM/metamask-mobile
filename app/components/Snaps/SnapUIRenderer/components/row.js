
import { mapToTemplate } from '../utils';

import { getJsxChildren } from '@metamask/snaps-utils';


export let RowVariant = /*#__PURE__*/function (RowVariant) {RowVariant["Default"] = "default";RowVariant["Critical"] = "critical";RowVariant["Warning"] = "warning";return RowVariant;}({});





const getTextColorFromVariant = (variant) => {
  switch (variant) {
    case RowVariant.Critical:
      return 'error';
    case RowVariant.Warning:
      return 'warning';
    default:
      return 'default';
  }
};

export const row = ({
  element: e,
  ...params
}) => {
  const rowVariant = e.props.variant;
  const textColor = rowVariant ?
  getTextColorFromVariant(rowVariant) :
  undefined;

  const children = getJsxChildren(e);
  const processedChildren = children.map((child) => {
    if (typeof child === 'object' && child !== null && child.type === 'Text') {
      return mapToTemplate({
        ...params,
        element: {
          ...child,
          props: {
            ...child.props,
            color: child.props.color || textColor
          }
        }
      });
    }

    return mapToTemplate({ ...params, element: child });
  });

  return {
    element: 'SnapUIInfoRow',
    children: processedChildren,
    props: {
      label: e.props.label,
      variant: rowVariant,
      tooltip: e.props.tooltip,
      style: {
        paddingTop: 0,
        paddingBottom: 0,
        marginLeft: -8,
        marginRight: -8
      }
    }
  };
};