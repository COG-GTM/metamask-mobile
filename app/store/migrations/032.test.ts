import migration from './032';
import { cloneDeep, merge } from 'lodash';
import initialRootState from '../../util/test/initial-root-state';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

const decimalChainIdState = {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId: '1',
          rpcTarget: 'https://api.avax.network/ext/bc/C/rpc',
        },
        networkDetails: {
          isEIP1559Compatible: true,
        },
        networkConfigurations: {
          network1: {
            chainId: '1',
          },
        },
      },
      PreferencesController: {
        securityAlertsEnabled: false,
      },
      AddressBookController: {
        addressBook: {
          1: {
            '0xaddress1': {
              address: '0xaddress1',
              chainId: '1',
              isEns: false,
              memo: 't',
              name: 'test',
            },
          },
        },
      },
      SwapsController: {
        chainCache: {
          1: 'cacheData',
        },
      },
      NftController: {
        allNftContracts: {
          '0xaddress1': {
            1: [{ tokenId: '123', address: '0x1234' }],
          },
        },
        allNfts: {
          '0xaddress1': {
            1: [{ tokenId: '123', address: '0x1234' }],
          },
        },
      },
      TransactionController: {
        transactions: [
          {
            chainId: '1',
            id: '1',
            networkID: '1',
            status: 'confirmed',
          },
        ],
      },
      TokensController: {
        allTokens: { '1': { '0x123': { address: '0x123' } } },
        allIgnoredTokens: { '1': { '0x123': { address: '0x123' } } },
        allDetectedTokens: { '1': { '0x123': { address: '0x123' } } },
      },
      TokenRatesController: {
        contractExchangeRatesByChainId: { '1': { ETH: { '0x123': 0.0001 } } },
      },
      TokenListController: {
        tokensChainsCache: {
          '1': { timeStamp: 1, data: { '0x123': { address: '0x123' } } },
        },
      },
    },
  },
  networkOnboarded: {
    networkOnboardedState: {
      1: true,
    },
  },
  swaps: {
    1: {
      data: 'test',
    },
  },
};

const expectedMigratedState = {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId: '0x1',
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        },
        networkDetails: {
          EIPS: {
            1559: true,
          },
        },
        networkConfigurations: {
          network1: {
            chainId: '0x1',
          },
        },
      },
      PreferencesController: {
        securityAlertsEnabled: true,
      },
      AddressBookController: {
        addressBook: {
          '0x1': {
            '0xaddress1': {
              address: '0xaddress1',
              chainId: '0x1',
              isEns: false,
              memo: 't',
              name: 'test',
            },
          },
        },
      },
      SwapsController: {
        chainCache: {
          '0x1': 'cacheData',
        },
      },
      NftController: {
        allNftContracts: {
          '0xaddress1': {
            '0x1': [{ tokenId: '123', address: '0x1234' }],
          },
        },
        allNfts: {
          '0xaddress1': {
            '0x1': [{ tokenId: '123', address: '0x1234' }],
          },
        },
      },
      TransactionController: {
        transactions: [
          {
            chainId: '0x1',
            id: '1',
            networkID: '1',
            status: 'confirmed',
          },
        ],
      },
      TokensController: {
        allTokens: { '0x1': { '0x123': { address: '0x123' } } },
        allIgnoredTokens: { '0x1': { '0x123': { address: '0x123' } } },
        allDetectedTokens: { '0x1': { '0x123': { address: '0x123' } } },
      },
      TokenRatesController: {
        contractExchangeRatesByChainId: { '0x1': { ETH: { '0x123': 0.0001 } } },
      },
      TokenListController: {
        tokensChainsCache: {
          '0x1': { timeStamp: 1, data: { '0x123': { address: '0x123' } } },
        },
      },
    },
  },
  networkOnboarded: {
    networkOnboardedState: {
      '0x1': true,
    },
  },
  swaps: {
    '0x1': {
      data: 'test',
    },
  },
};

describe('Migration #32', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it.each([
    { state: undefined, type: 'undefined' },
    { state: null, type: 'object' },
    { state: 'state', type: 'string' },
  ])(
    'returns an empty object and captures exception if state is $state',
    async ({ state, type }) => {
      const newState = await migration(state);

      expect(newState).toStrictEqual({});
      expect(mockedCaptureException).toHaveBeenCalledTimes(1);
      expect(mockedCaptureException.mock.calls[0][0].message).toBe(
        `Migration 32: Invalid state: '${type}'`,
      );
    },
  );

  const engineDroppingStates = [
    {
      state: { ...cloneDeep(initialRootState), engine: null },
      errorMessage: "Migration 32: Invalid engine state: 'object'",
      scenario: 'engine state is invalid',
    },
    {
      state: { ...cloneDeep(initialRootState), engine: undefined },
      errorMessage: "Migration 32: Invalid engine state: 'undefined'",
      scenario: 'engine state is missing',
    },
    {
      state: {
        ...cloneDeep(initialRootState),
        engine: { backgroundState: null },
      },
      errorMessage: "Migration 32: Invalid engine backgroundState: 'object'",
      scenario: 'backgroundState is invalid',
    },
    {
      state: {
        ...cloneDeep(initialRootState),
        engine: { backgroundState: 'invalid' },
      },
      errorMessage: "Migration 32: Invalid engine backgroundState: 'string'",
      scenario: 'backgroundState is a string',
    },
  ];

  for (const { errorMessage, scenario, state } of engineDroppingStates) {
    it(`removes engine and captures exception if ${scenario}`, async () => {
      const { engine, ...expectedState } = cloneDeep(state);

      const newState = await migration(state);

      expect(newState).toStrictEqual(expectedState);
      expect(newState).not.toHaveProperty('engine');
      expect(newState).toHaveProperty('user', initialRootState.user);
      expect(mockedCaptureException).toHaveBeenCalledTimes(1);
      expect(mockedCaptureException.mock.calls[0][0].message).toBe(
        errorMessage,
      );
    });
  }

  const unchangedInvalidStates = [
    {
      state: merge({}, initialRootState, {
        engine: { backgroundState: { NetworkController: null } },
      }),
      errorMessage: "Migration 32: Invalid NetworkController state: 'object'",
      scenario: 'NetworkController state is invalid',
    },
    {
      state: {
        engine: { backgroundState: { PreferencesController: {} } },
      },
      errorMessage:
        "Migration 32: Invalid NetworkController state: 'undefined'",
      scenario: 'NetworkController state is missing',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: { NetworkController: { providerConfig: null } },
        },
      }),
      errorMessage:
        "Migration 32: Invalid NetworkController providerConfig: 'object'",
      scenario: 'providerConfig is invalid',
    },
    {
      state: {
        engine: {
          backgroundState: { NetworkController: { networkConfigurations: {} } },
        },
      },
      errorMessage:
        "Migration 32: Invalid NetworkController providerConfig: 'undefined'",
      scenario: 'providerConfig is missing',
    },
  ];

  for (const { errorMessage, scenario, state } of unchangedInvalidStates) {
    it(`returns state unchanged and captures exception if ${scenario}`, async () => {
      const originalState = cloneDeep(state);

      const newState = await migration(state);

      expect(newState).toBe(state);
      expect(newState).toStrictEqual(originalState);
      expect(mockedCaptureException).toHaveBeenCalledTimes(1);
      expect(mockedCaptureException.mock.calls[0][0].message).toBe(
        errorMessage,
      );
    });
  }

  it('returns state unchanged without re-running migrations 29 and 30 if rpcUrl is set', async () => {
    const state = merge({}, decimalChainIdState, {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: { rpcUrl: 'https://rpc.example.com' },
          },
        },
      },
    });
    const originalState = cloneDeep(state);

    const newState = await migration(state);

    expect(newState).toBe(state);
    expect(newState).toStrictEqual(originalState);
    const backgroundState = (newState as typeof originalState).engine
      .backgroundState;
    expect(backgroundState.NetworkController.providerConfig.chainId).toBe('1');
    expect(backgroundState.AddressBookController.addressBook).toHaveProperty(
      '1',
    );
    expect(backgroundState.PreferencesController.securityAlertsEnabled).toBe(
      false,
    );
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('re-runs migrations 29 and 30 if rpcUrl is missing', async () => {
    const newState = await migration(cloneDeep(decimalChainIdState));

    expect(newState).toStrictEqual(expectedMigratedState);
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('is a no-op when run again on its own output', async () => {
    const firstRun = await migration(cloneDeep(decimalChainIdState));
    const secondRun = await migration(cloneDeep(firstRun));

    expect(secondRun).toStrictEqual(expectedMigratedState);
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('is idempotent when rpcUrl is still missing after migrations 29 and 30', async () => {
    const state = merge({}, decimalChainIdState);
    delete (
      state.engine.backgroundState.NetworkController.providerConfig as {
        rpcTarget?: string;
      }
    ).rpcTarget;
    const { rpcUrl, ...providerConfigWithoutRpcUrl } =
      expectedMigratedState.engine.backgroundState.NetworkController
        .providerConfig;
    const expectedState = merge({}, expectedMigratedState);
    expectedState.engine.backgroundState.NetworkController.providerConfig =
      providerConfigWithoutRpcUrl as typeof expectedState.engine.backgroundState.NetworkController.providerConfig;

    const firstRun = await migration(state);
    expect(firstRun).toStrictEqual(expectedState);

    const secondRun = await migration(cloneDeep(firstRun));
    expect(secondRun).toStrictEqual(expectedState);
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });
});
