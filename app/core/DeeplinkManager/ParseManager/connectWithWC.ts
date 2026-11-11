import WC2Manager from '../../WalletConnect/WalletConnectV2';
import extractURLParams from './extractURLParams';

export function connectWithWC({
  handled,
  wcURL,
  origin,
  params,
}: {
  handled: () => void;
  wcURL: string;
  origin: string;
  params: ReturnType<typeof extractURLParams>['params'];
}) {
  handled();

  WC2Manager.getInstance()
    .then((instance) =>
      instance.connect({
        wcUri: wcURL,
        origin,
        redirectUrl:
          typeof params?.redirect === 'string' ? params.redirect : undefined,
      }),
    )
    .catch((err) => {
      console.warn(`DeepLinkManager failed to connect`, err);
    });
}

export default connectWithWC;
