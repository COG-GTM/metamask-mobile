import { Text } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { mapToTemplate } from '../utils';


export const tooltip = ({
  element: e,
  ...params
}) => ({
  element: 'SnapUITooltip',
  children: getJsxChildren(e).map((children) =>
  mapToTemplate({ element: children, ...params })
  ),
  propComponents: {
    content: mapToTemplate({
      element:
      typeof e.props.content === 'string' ?
      Text({ children: e.props.content }) :
      e.props.content,
      ...params
    })
  }
});