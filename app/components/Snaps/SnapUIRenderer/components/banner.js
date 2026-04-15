
import { getJsxChildren } from '@metamask/snaps-utils';
import { mapToTemplate } from '../utils';


function transformSeverity(
severity)
{
  if (severity === 'danger') {
    return 'Error';
  }

  return severity?.charAt(0).toUpperCase() + severity?.slice(1);
}

export const banner = ({
  element: e,
  ...params
}) => ({
  element: 'SnapUIBanner',
  children: getJsxChildren(e).map((children) =>
  mapToTemplate({ element: children, ...params })
  ),
  props: {
    // The Banner component shows an empty title if we dont do this.
    title: e.props.title.length > 0 ? e.props.title : null,
    severity: transformSeverity(e.props.severity)
  }
});