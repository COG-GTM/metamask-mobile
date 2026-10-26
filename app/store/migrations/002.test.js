import migrate from './002';
import { GOERLI } from '../../constants/network';

jest.mock('../../util/networks', () => ({
  ...jest.requireActual('../../util/networks'),
  isSafeChainId: (chainId) => Number.isSafeInteger(chainId) && chainId > 0,
}));

const createState = (provider) => ({
  engine: { backgroundState: { NetworkController: { provider } } },
});

describe('Migration #002', () => {
  it('keeps initial networks', () => {
    const provider = { type: 'mainnet', chainId: '1' };
    const state = migrate(createState(provider));
    expect(state.engine.backgroundState.NetworkController.provider).toBe(
      provider,
    );
  });

  it('keeps custom RPCs with a valid chainId', () => {
    const provider = { type: 'rpc', chainId: '1337' };
    const state = migrate(createState(provider));
    expect(state.engine.backgroundState.NetworkController.provider).toBe(
      provider,
    );
  });

  it('switches custom RPCs with an invalid chainId to goerli', () => {
    const state = migrate(createState({ type: 'rpc', chainId: 'abc' }));
    expect(state.engine.backgroundState.NetworkController.provider).toEqual({
      ticker: 'ETH',
      type: GOERLI,
    });
  });
});
