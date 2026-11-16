import { captureException } from '@sentry/react-native';
import migrate from './015';
import migration29 from './029';
import { GOERLI } from '../../../app/constants/network';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

const createState = (providerConfig?: unknown) => ({
  engine: {
    backgroundState: {
      NetworkController: {
        ...(providerConfig === undefined ? {} : { providerConfig }),
        networkDetails: { isEIP1559Compatible: true },
      },
      PreferencesController: { foo: 'bar' },
    },
  },
  user: { seedphraseBackedUp: true },
});

describe('Migration #15', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it.each([
    ['Rinkeby', '4'],
    ['Ropsten', '3'],
    ['Kovan', '42'],
  ])('moves users on %s (chainId %s) to Goerli', (_name, chainId) => {
    const oldState = createState({
      chainId,
      ticker: 'ETH',
      type: 'rpc',
      rpcTarget: 'https://example.com',
      nickname: 'Old testnet',
    });

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(
      createState({
        chainId: '5',
        ticker: 'GoerliETH',
        type: GOERLI,
      }),
    );
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it.each([
    ['mainnet', '1', 'mainnet'],
    ['Goerli', '5', GOERLI],
    ['Sepolia', '11155111', 'sepolia'],
    ['custom RPC', '137', 'rpc'],
  ])('leaves users on %s (chainId %s) unchanged', (_name, chainId, type) => {
    const providerConfig = { chainId, ticker: 'ETH', type };

    const newState = migrate(createState(providerConfig));

    expect(newState).toStrictEqual(createState({ ...providerConfig }));
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it.each([
    ['number 4', 4],
    ['number 3', 3],
    ['number 42', 42],
    ['hex 0x4', '0x4'],
  ])('does not rewrite non-decimal-string chainId %s', (_name, chainId) => {
    const providerConfig = { chainId, ticker: 'ETH', type: 'rpc' };

    const newState = migrate(createState(providerConfig));

    expect(newState).toStrictEqual(createState({ ...providerConfig }));
  });

  it.each([
    ['missing', undefined],
    ['null', null],
    ['a string', 'mainnet'],
  ])(
    'returns state unchanged and reports to Sentry when providerConfig is %s',
    (_name, providerConfig) => {
      const oldState = createState(providerConfig);

      expect(() => migrate(oldState)).not.toThrow();
      expect(migrate(createState(providerConfig))).toStrictEqual(
        createState(providerConfig),
      );
      expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
      expect(mockedCaptureException.mock.calls[0][0].message).toContain(
        'Migration 15: Invalid NetworkController providerConfig',
      );
    },
  );

  it.each([
    ['engine is missing', {}],
    ['backgroundState is missing', { engine: {} }],
    ['NetworkController is missing', { engine: { backgroundState: {} } }],
  ])(
    'returns state unchanged and reports to Sentry when %s',
    (_name, oldState) => {
      const snapshot = JSON.parse(JSON.stringify(oldState));

      expect(migrate(oldState)).toStrictEqual(snapshot);
      expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    },
  );

  it('produces a providerConfig that migration 29 converts to hex Goerli', async () => {
    const oldState = createState({
      chainId: '3',
      ticker: 'ETH',
      type: 'ropsten',
    });
    Object.assign(oldState.engine.backgroundState.NetworkController, {
      networkConfigurations: {},
    });
    const stateAfter15 = migrate(oldState);

    const stateAfter29 = (await migration29(stateAfter15)) as ReturnType<
      typeof createState
    >;

    expect(stateAfter29.engine.backgroundState.NetworkController).toMatchObject(
      {
        providerConfig: { chainId: '0x5', ticker: 'GoerliETH', type: GOERLI },
      },
    );
    expect(mockedCaptureException).not.toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          'Migration 29: Invalid NetworkController',
        ),
      }),
    );
  });
});
