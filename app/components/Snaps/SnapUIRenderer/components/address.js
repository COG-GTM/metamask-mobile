


export const address = ({
  element: e,
  textColor
}) => ({
  element: 'SnapUIAddress',
  props: {
    address: e.props.address,
    avatarSize: 'xs',
    truncate: e.props.truncate,
    displayName: e.props.displayName,
    avatar: e.props.avatar,
    color: textColor
  }
});