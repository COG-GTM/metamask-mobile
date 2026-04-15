



export const checkbox = ({
  element: e,
  form
}) => ({
  element: 'SnapUICheckbox',
  props: {
    name: e.props.name,
    label: e.props.label,
    variant: e.props.variant,
    disabled: e.props.disabled,
    form
  }
});