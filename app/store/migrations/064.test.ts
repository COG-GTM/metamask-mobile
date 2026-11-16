import migration from './064';
import { merge } from 'lodash';
import initialRootState from '../../util/test/initial-root-state';
import { captureException } from '@sentry/react-native';
import { RootState } from '../../reducers';

const oldState = {
  engine: {
    backgroundState: {
      NetworkController: {
        selectedNetworkClientId: 'unknown-client-id',
        networkConfigurationsByChainId: {
          '0x1': {
            rpcEndpoints: [{ networkClientId: 'mainnet' }],
          },
          '0x5': {
            rpcEndpoints: [{ networkClientId: 'goerli' }],
          },
        },
      },
    },
  },
};

const expectedNewState = {
  engine: {
    backgroundState: {
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networkConfigurationsByChainId: {
          '0x1': {
            rpcEndpoints: [{ networkClientId: 'mainnet' }],
          },
          '0x5': {
            rpcEndpoints: [{ networkClientId: 'goerli' }],
          },
        },
      },
    },
  },
};

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #64', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  const invalidStates = [
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            NetworkController: null,
          },
        },
      }),
      errorMessage:
        "Migration 64: Invalid or missing 'NetworkController' in backgroundState: 'object'",
      scenario: 'NetworkController state is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            NetworkController: { networkConfigurationsByChainId: null },
          },
        },
      }),
      errorMessage:
        "Migration 64: Missing or invalid 'networkConfigurationsByChainId' in NetworkController",
      scenario: 'networkConfigurationsByChainId is invalid',
    },
  ];

  for (const { errorMessage, scenario, state } of invalidStates) {
    it(`should capture exception if ${scenario}`, async () => {
      const newState = await migration(state);

      expect(newState).toStrictEqual(state);
      expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
      expect(mockedCaptureException.mock.calls[0][0].message).toBe(
        errorMessage,
      );
    });
  }

  it('should set selectedNetworkClientId to "mainnet" if it does not exist in networkConfigurationsByChainId', async () => {
    const newState = await migration(oldState);
    expect(newState).toStrictEqual(expectedNewState);
  });

  it('should keep selectedNetworkClientId unchanged if it exists in networkConfigurationsByChainId', async () => {
    const validState = merge({}, oldState, {
      engine: {
        backgroundState: {
          NetworkController: {
            selectedNetworkClientId: 'mainnet',
          },
        },
      },
    });
    const newState = await migration(validState);

    expect(newState).toStrictEqual(validState);
  });

  it('should set selectedNetworkClientId to the default mainnet client ID if mainnet configuration exists but selectedNetworkClientId is invalid', async () => {
    const invalidClientState = merge({}, oldState, {
      engine: {
        backgroundState: {
          NetworkController: {
            selectedNetworkClientId: 'invalid-client-id',
          },
        },
      },
    });

    const newState = await migration(invalidClientState);
    expect(
      (newState as RootState).engine.backgroundState.NetworkController
        .selectedNetworkClientId,
    ).toBe('mainnet');
  });

  it('should handle the absence of mainnet configuration gracefully', async () => {
    const noMainnetState = merge({}, oldState, {
      engine: {
        backgroundState: {
          NetworkController: {
            networkConfigurationsByChainId: {
              '0x1': {
                chainId: '0x1',
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [{ networkClientId: 'another-mainnet' }],
              },
              '0x5': {
                rpcEndpoints: [{ networkClientId: 'goerli' }],
              },
            },
            selectedNetworkClientId: 'unknown-client-id',
          },
        },
      },
    });

    const newState = await migration(noMainnetState);
    expect(
      (newState as RootState).engine.backgroundState.NetworkController
        .selectedNetworkClientId,
    ).toBe('another-mainnet');
  });

  it('should capture exception and not throw if a network configuration has no rpcEndpoints array', async () => {
    const malformedState = {
      engine: {
        backgroundState: {
          NetworkController: {
            selectedNetworkClientId: 'unknown-client-id',
            networkConfigurationsByChainId: {
              '0x5': { chainId: '0x5' },
              '0xaa36a7': { chainId: '0xaa36a7', rpcEndpoints: 'invalid' },
              '0x1': {
                chainId: '0x1',
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [{ networkClientId: 'mainnet' }],
              },
            },
          },
        },
      },
    };

    const newState = await migration(malformedState);

    expect(
      (newState as RootState).engine.backgroundState.NetworkController
        .selectedNetworkClientId,
    ).toBe('mainnet');
    expect(
      mockedCaptureException.mock.calls.map(([error]) => error.message),
    ).toStrictEqual([
      "Migration 64: Invalid network configuration or missing 'rpcEndpoints' for chainId: '0x5'",
      "Migration 64: Invalid network configuration or missing 'rpcEndpoints' for chainId: '0xaa36a7'",
    ]);
  });

  it('should not throw if there is no 0x1 configuration and no endpoint uses the mainnet client id', async () => {
    const noMainnetConfigState = {
      engine: {
        backgroundState: {
          NetworkController: {
            selectedNetworkClientId: 'unknown-client-id',
            networkConfigurationsByChainId: {
              '0x5': {
                chainId: '0x5',
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [{ networkClientId: 'goerli' }],
              },
            },
          },
        },
      },
    };

    const newState = await migration(noMainnetConfigState);

    expect(
      (newState as RootState).engine.backgroundState.NetworkController
        .selectedNetworkClientId,
    ).toBe('mainnet');
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toBe(
      "Migration 64: Missing or invalid mainnet ('0x1') network configuration, falling back to 'mainnet'",
    );
  });

  it('should not throw if the 0x1 configuration has an out-of-range defaultRpcEndpointIndex', async () => {
    const badIndexState = {
      engine: {
        backgroundState: {
          NetworkController: {
            selectedNetworkClientId: 'unknown-client-id',
            networkConfigurationsByChainId: {
              '0x1': {
                chainId: '0x1',
                defaultRpcEndpointIndex: 5,
                rpcEndpoints: [{ networkClientId: 'another-mainnet' }],
              },
            },
          },
        },
      },
    };

    const newState = await migration(badIndexState);

    expect(
      (newState as RootState).engine.backgroundState.NetworkController
        .selectedNetworkClientId,
    ).toBe('mainnet');
    expect(mockedCaptureException.mock.calls[0][0].message).toBe(
      "Migration 64: Missing or invalid mainnet ('0x1') network configuration, falling back to 'mainnet'",
    );
  });

  it('should not modify the state if it is already valid', async () => {
    const validState = merge({}, oldState, {
      engine: {
        backgroundState: {
          NetworkController: {
            selectedNetworkClientId: 'mainnet',
          },
        },
      },
    });

    const newState = await migration(validState);
    expect(newState).toStrictEqual(validState);
  });
});
