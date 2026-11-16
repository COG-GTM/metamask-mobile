import migrate from './003';
import { migrationList } from './index';
import AppConstants from '../../core/AppConstants';

interface Provider {
  type: string;
  chainId?: unknown;
  ticker?: string;
  rpcTarget?: string;
  nickname?: string;
}

const createState = (provider: Provider) => ({
  engine: {
    backgroundState: {
      NetworkController: {
        provider,
        properties: { isEIP1559Compatible: true },
      },
      PreferencesController: { selectedAddress: '0xabc' },
    },
  },
  user: { seedphraseBackedUp: true },
});

const GOERLI_PROVIDER = { ticker: 'ETH', type: 'goerli', chainId: '5' };

describe('Migration #3', () => {
  it('is registered as migration 3', () => {
    expect(migrationList[3]).toBe(migrate);
  });

  it.each([
    ['mainnet', '1'],
    ['goerli', '5'],
    ['sepolia', '11155111'],
  ])(
    'sets the chainId of the built-in %s provider to %s',
    (type, expectedChainId) => {
      const oldState = createState({ type, ticker: 'ETH' });

      const newState = migrate(oldState);

      expect(newState).toStrictEqual(
        createState({ type, ticker: 'ETH', chainId: expectedChainId }),
      );
    },
  );

  it('overwrites a stale chainId on a built-in provider', () => {
    const newState = migrate(
      createState({ type: 'mainnet', ticker: 'ETH', chainId: '5' }),
    );

    expect(newState.engine.backgroundState.NetworkController.provider).toEqual({
      type: 'mainnet',
      ticker: 'ETH',
      chainId: '1',
    });
  });

  it.each(['1', '137', '43114', String(AppConstants.MAX_SAFE_CHAIN_ID)])(
    'keeps a custom RPC with valid decimal chainId %s unchanged',
    (chainId) => {
      const provider = {
        type: 'rpc',
        chainId,
        rpcTarget: 'https://rpc.example.com',
        nickname: 'Custom',
        ticker: 'MATIC',
      };

      const newState = migrate(createState({ ...provider }));

      expect(newState).toStrictEqual(createState(provider));
    },
  );

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['zero', '0'],
    ['zero-padded', '01'],
    ['hexadecimal', '0x89'],
    ['negative', '-1'],
    ['fractional', '1.5'],
    ['non-numeric', 'abc'],
    ['numeric (non-string)', 137],
    ['above MAX_SAFE_CHAIN_ID', String(AppConstants.MAX_SAFE_CHAIN_ID + 1)],
  ])('resets a custom RPC with a %s chainId to Goerli', (_label, chainId) => {
    const oldState = createState({
      type: 'rpc',
      chainId,
      rpcTarget: 'https://rpc.example.com',
      nickname: 'Custom',
      ticker: 'MATIC',
    });

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(createState(GOERLI_PROVIDER));
  });

  it('resets a localhost provider without a valid chainId to Goerli', () => {
    const newState = migrate(createState({ type: 'localhost' }));

    expect(newState).toStrictEqual(createState(GOERLI_PROVIDER));
  });

  it('keeps a localhost provider with a valid chainId unchanged', () => {
    const provider = { type: 'localhost', chainId: '1337' };

    const newState = migrate(createState({ ...provider }));

    expect(newState).toStrictEqual(createState(provider));
  });
});
