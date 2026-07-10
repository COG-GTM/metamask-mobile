import migrate from './002';
import { GOERLI } from '../../../app/constants/network';

jest.mock('../../util/networks', () => ({
  getAllNetworks: jest.fn(() => ['mainnet', 'goerli']),
  isSafeChainId: jest.fn((chainId: number) => !Number.isNaN(chainId)),
}));

describe('Migration #2', () => {
  it('should keep provider unchanged when on an initial network', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: { type: 'mainnet', chainId: '1' },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(
      newState.engine.backgroundState.NetworkController.provider,
    ).toStrictEqual({ type: 'mainnet', chainId: '1' });
  });

  it('should switch to goerli when custom RPC has invalid chain ID', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: { type: 'rpc', chainId: undefined },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(
      newState.engine.backgroundState.NetworkController.provider,
    ).toStrictEqual({ ticker: 'ETH', type: GOERLI });
  });
});
