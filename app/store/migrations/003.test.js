import { NetworksChainId } from '@metamask/controller-utils';
import migrate from './003';
import { GOERLI } from '../../constants/network';

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  NetworksChainId: { mainnet: '1', goerli: '5', rpc: '' },
}));

jest.mock('../../util/networks', () => ({
  ...jest.requireActual('../../util/networks'),
  isSafeChainId: (chainId) => Number.isSafeInteger(chainId) && chainId > 0,
}));

const createState = (provider) => ({
  engine: { backgroundState: { NetworkController: { provider } } },
});

describe('Migration #003', () => {
  it('sets the chainId of built-in networks', () => {
    const state = migrate(createState({ type: 'mainnet', ticker: 'ETH' }));
    expect(state.engine.backgroundState.NetworkController.provider).toEqual({
      type: 'mainnet',
      ticker: 'ETH',
      chainId: NetworksChainId.mainnet,
    });
  });

  it('keeps custom RPCs with a valid decimal chainId', () => {
    const provider = { type: 'rpc', chainId: '1337' };
    const state = migrate(createState(provider));
    expect(state.engine.backgroundState.NetworkController.provider).toBe(
      provider,
    );
  });

  it.each([['0x1'], [1337], [undefined]])(
    'switches custom RPCs with chainId %p to goerli',
    (chainId) => {
      const state = migrate(createState({ type: 'rpc', chainId }));
      expect(state.engine.backgroundState.NetworkController.provider).toEqual({
        ticker: 'ETH',
        type: GOERLI,
        chainId: NetworksChainId.goerli,
      });
    },
  );
});
