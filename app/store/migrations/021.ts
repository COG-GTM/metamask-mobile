import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

export default function migrate(state: Record<string, unknown>) {
  const engineState = state.engine as Record<string, Record<string, Record<string, unknown>>>;
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const preferencesController = engineState.backgroundState?.PreferencesController as Record<string, unknown> | undefined;
  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    preferencesController?.ipfsGateway as string,
  );

  if (isUsingOutdatedGateway) {
    (engineState.backgroundState.PreferencesController as Record<string, unknown>).ipfsGateway =
      IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}
