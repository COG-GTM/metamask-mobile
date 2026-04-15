import { PopularList } from './networks/customNetworks';

const getImage = (chainId) => {
  const customNetworkData = PopularList.filter(
    (x) => x.chainId === chainId
  );
  const image =
  customNetworkData.length > 0 ?
  customNetworkData[0].rpcPrefs.imageSource :
  null;
  return image;
};

export default getImage;