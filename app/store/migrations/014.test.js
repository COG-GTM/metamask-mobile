import migrate014 from './014';
import migrate015 from './015';
import migrate016 from './016';
import migrate017 from './017';
import migrate018 from './018';
import { NetworksChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../constants/network';

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  NetworksChainId: { mainnet: '1', goerli: '5', rpc: '' },
}));

describe('Migrations #014 - #018', () => {
  it('#014 renames provider to providerConfig', () => {
    const state = {
      engine: { backgroundState: { NetworkController: { provider: { a: 1 } } } },
    };
    expect(migrate014(state).engine.backgroundState.NetworkController).toEqual(
      { providerConfig: { a: 1 } },
    );
  });

  it('#014 leaves state without provider unchanged', () => {
    const state = { engine: { backgroundState: { NetworkController: {} } } };
    expect(migrate014(state).engine.backgroundState.NetworkController).toEqual(
      {},
    );
  });

  it.each(['3', '4', '42'])(
    '#015 moves deprecated chainId %s to goerli',
    (chainId) => {
      const state = {
        engine: {
          backgroundState: {
            NetworkController: { providerConfig: { chainId } },
          },
        },
      };
      expect(
        migrate015(state).engine.backgroundState.NetworkController
          .providerConfig,
      ).toEqual({
        chainId: NetworksChainId.goerli,
        ticker: 'GoerliETH',
        type: GOERLI,
      });
    },
  );

  it('#015 keeps supported chains', () => {
    const providerConfig = { chainId: '1' };
    const state = {
      engine: { backgroundState: { NetworkController: { providerConfig } } },
    };
    expect(
      migrate015(state).engine.backgroundState.NetworkController.providerConfig,
    ).toBe(providerConfig);
  });

  it('#016 renames properties to networkDetails', () => {
    const state = {
      engine: {
        backgroundState: { NetworkController: { properties: { a: 1 } } },
      },
    };
    expect(migrate016(state).engine.backgroundState.NetworkController).toEqual(
      { networkDetails: { a: 1 } },
    );
    const empty = { engine: { backgroundState: { NetworkController: {} } } };
    expect(migrate016(empty).engine.backgroundState.NetworkController).toEqual(
      {},
    );
  });

  it('#017 resets the network onboarded state', () => {
    const state = {
      networkOnboarded: { networkOnboardedState: { '0x1': true } },
    };
    expect(migrate017(state).networkOnboarded.networkOnboardedState).toEqual(
      {},
    );
    const empty = {};
    expect(migrate017(empty)).toEqual({});
  });

  it('#018 removes suggested assets', () => {
    const state = {
      engine: {
        backgroundState: {
          TokensController: { suggestedAssets: [], tokens: [] },
        },
      },
    };
    expect(migrate018(state).engine.backgroundState.TokensController).toEqual(
      { tokens: [] },
    );
    const empty = {
      engine: { backgroundState: { TokensController: { tokens: [] } } },
    };
    expect(migrate018(empty).engine.backgroundState.TokensController).toEqual(
      { tokens: [] },
    );
  });
});
