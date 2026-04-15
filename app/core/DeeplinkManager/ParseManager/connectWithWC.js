import WC2Manager from '../../WalletConnect/WalletConnectV2';


export function connectWithWC({
  handled,
  wcURL,
  origin,
  params





}) {
  handled();

  WC2Manager.getInstance().
  then((instance) =>
  instance.connect({
    wcUri: wcURL,
    origin,
    redirectUrl: params?.redirect
  })
  ).
  catch((err) => {
    console.warn(`DeepLinkManager failed to connect`, err);
  });
}

export default connectWithWC;