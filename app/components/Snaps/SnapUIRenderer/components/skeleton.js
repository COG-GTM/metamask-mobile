
import { mapSnapBorderRadiusToMobileBorderRadius } from '../utils';


const DEFAULT_SKELETON_WIDTH = 96;
const DEFAULT_SKELETON_HEIGHT = 22;
const DEFAULT_SKELETON_BORDER_RADIUS = 6;

export const skeleton = ({
  element: skeletonElement
}) => ({
  element: 'Skeleton',
  props: {
    width: skeletonElement.props.width ?? DEFAULT_SKELETON_WIDTH,
    height: skeletonElement.props.height ?? DEFAULT_SKELETON_HEIGHT,
    style: {
      borderRadius: skeletonElement.props.borderRadius ?
      mapSnapBorderRadiusToMobileBorderRadius(
        skeletonElement.props.borderRadius
      ) :
      DEFAULT_SKELETON_BORDER_RADIUS
    }
  }
});