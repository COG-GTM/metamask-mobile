/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dimensions, PixelRatio } from 'react-native';

//baseModel 0
const IPHONE_6_WIDTH = 375;
const IPHONE_6_HEIGHT = 667;

//baseModel 1
const IPHONE_11_PRO_WIDTH = 375;
const IPHONE_11_PRO_HEIGHT = 812;

//baseModel 2
const IPHONE_11_PRO_MAX_WIDTH = 414;
const IPHONE_11_PRO_MAX_HEIGHT = 896;

const getBaseModel = (baseModel: any): any => {
  if (baseModel === 1) {
    return { width: IPHONE_11_PRO_WIDTH, height: IPHONE_11_PRO_HEIGHT };
  } else if (baseModel === 2) {
    return { width: IPHONE_11_PRO_MAX_WIDTH, height: IPHONE_11_PRO_MAX_HEIGHT };
  }

  return { width: IPHONE_6_WIDTH, height: IPHONE_6_HEIGHT };
};

const _getSizes = (scaleVertical: any, baseModel: any): any => {
  const { width, height } = Dimensions.get('window');
  const CURR_WIDTH = width < height ? width : height;
  const CURR_HEIGHT = height > width ? height : width;

  let currSize = CURR_WIDTH;
  let baseScreenSize = getBaseModel(baseModel).width;

  if (scaleVertical) {
    currSize = CURR_HEIGHT;
    baseScreenSize = getBaseModel(baseModel).height;
  }

  return { currSize, baseScreenSize };
};

const scale = (
  size: any,
  {
    factor = 1,
    scaleVertical = false,
    scaleUp = false,
    baseSize = undefined,
    baseModel,
  }: Record<string, any> = {},
): any => {
  const { currSize, baseScreenSize } = _getSizes(scaleVertical, baseModel);
  const sizeScaled = ((baseSize || currSize) / baseScreenSize) * size;

  if (sizeScaled <= size || scaleUp) {
    return PixelRatio.roundToNearestPixel(size + (sizeScaled - size) * factor);
  }

  return size;
};

const scaleVertical = (size: any, options: Record<string, any> = {}): any =>
  scale(size, { scaleVertical: true, ...options });

export default { scale, scaleVertical, IPHONE_6_WIDTH, IPHONE_6_HEIGHT };
