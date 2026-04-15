


function generateBorderRadius(
borderRadius)
{
  switch (borderRadius) {
    default:
    case 'none':
      return 0;

    case 'medium':
      return 6;

    case 'full':
      return 999;
  }
}

export const image = ({ element: e }) => ({
  element: 'SnapUIImage',
  props: {
    value: e.props.src,
    borderRadius: generateBorderRadius(e.props.borderRadius)
  }
});