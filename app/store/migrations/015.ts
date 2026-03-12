import { GOERLI } from '../../../app/constants/network';

// NetworksChainId was removed from @metamask/controller-utils in a later version.
// Hardcoding the goerli chain ID here since this is a legacy migration.
const GOERLI_CHAIN_ID = '5';

export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  const chainId =
    s.engine.backgroundState.NetworkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    s.engine.backgroundState.NetworkController.providerConfig = {
      chainId: GOERLI_CHAIN_ID,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return s;
}
