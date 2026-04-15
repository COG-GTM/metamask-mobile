


export const assetSelector = ({
  element: e,
  form
}) => ({
  element: 'SnapUIAssetSelector',
  props: {
    name: e.props.name,
    addresses: e.props.addresses,
    chainIds: e.props.chainIds,
    disabled: e.props.disabled,
    form
  }
});