import { ChainId, isSafeChainId } from '@metamask/controller-utils';
import type { Hex } from '@metamask/utils';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

interface Provider {
  type: string;
  chainId?: string | number;
  ticker?: string;
  [key: string]: unknown;
}

interface Migration03State {
  engine: {
    backgroundState: {
      NetworkController: {
        provider: Provider;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration03State;
  const provider = typedState.engine.backgroundState.NetworkController.provider;
  const chainId = ChainId[
    provider.type as keyof typeof ChainId
  ];
  // if chainId === '' is a rpc
  if (chainId) {
    typedState.engine.backgroundState.NetworkController.provider = {
      ...provider,
      chainId,
    };
    return state;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString ||
    !isSafeChainId(parseInt(storedChainId, 10) as unknown as Hex);

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    typedState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: ChainId.goerli,
    };
  }
  return state;
}
