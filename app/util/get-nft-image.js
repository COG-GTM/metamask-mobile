
export const getNftImage = (image) => {
  if (typeof image === 'string') {
    return image;
  }

  if (Array.isArray(image)) {
    return image[0];
  }

  return undefined;
};