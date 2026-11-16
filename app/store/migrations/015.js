import { captureException } from '@sentry/react-native';
import { GOERLI } from '../../../app/constants/network';

export default function migrate(state) {
  const providerConfig =
    state?.engine?.backgroundState?.NetworkController?.providerConfig;
  if (!providerConfig || typeof providerConfig !== 'object') {
    captureException(
      new Error(
        `Migration 15: Invalid NetworkController providerConfig: '${typeof providerConfig}'`,
      ),
    );
    return state;
  }
  const { chainId } = providerConfig;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    state.engine.backgroundState.NetworkController.providerConfig = {
      // Chain IDs were decimal strings until migration 29 converted them to hex
      chainId: '5',
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}
