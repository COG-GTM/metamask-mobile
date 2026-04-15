

export const getHostFromUrl = (url) => {
  if (!url) {
    return;
  }
  try {
    return new URL(url).host;
  } catch (error) {
    console.error(error);
  }
  return;
};

export const isNativeToken = (selectedAsset) =>
selectedAsset.isNative || selectedAsset.isETH;