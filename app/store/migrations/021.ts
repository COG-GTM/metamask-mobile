import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    s.engine.backgroundState?.PreferencesController?.ipfsGateway,
  );

  if (isUsingOutdatedGateway) {
    s.engine.backgroundState.PreferencesController.ipfsGateway =
      IPFS_DEFAULT_GATEWAY_URL;
  }
  return s;
}
