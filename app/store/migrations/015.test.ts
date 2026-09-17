import migrate from './015';
import { GOERLI } from '../../../app/constants/network';

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  NetworksChainId: { goerli: '5' },
}));

describe('Migration #15', () => {
  it('should fall back to goerli for deprecated test networks', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: { chainId: '4', type: 'rinkeby' },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(
      newState.engine.backgroundState.NetworkController.providerConfig,
    ).toStrictEqual({ chainId: '5', ticker: 'GoerliETH', type: GOERLI });
  });

  it('should return state unaltered for other networks', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: { chainId: '1', type: 'mainnet' },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(oldState);
  });
});
