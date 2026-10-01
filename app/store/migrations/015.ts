import { GOERLI } from '../../../app/constants/network';

// `NetworksChainId.goerli` (decimal `'5'`) used to be imported from
// `@metamask/controller-utils`, but that export has since been removed. This
// migration predates hex chain IDs (migration 029 hex-converts later), so the
// original decimal value is preserved here.
const GOERLI_CHAIN_ID = '5';

export default function migrate(state: unknown): Record<string, unknown> {
  const networkControllerState = (
    state as {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: Record<string, unknown>;
          };
        };
      };
    }
  ).engine.backgroundState.NetworkController;

  const chainId = networkControllerState.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    networkControllerState.providerConfig = {
      chainId: GOERLI_CHAIN_ID,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state as Record<string, unknown>;
}
