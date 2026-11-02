import { RpcEndpointType } from '@metamask/network-controller';
import {
  MOCK_ACCOUNTS_CONTROLLER_STATE,
  MOCK_ADDRESS_2,
} from '../util/test/accountsControllerTestUtils';
import { RootState } from '../reducers';
import {
  selectAccountBalanceByChainId,
  selectNativeBalanceByChainIdAndAddress,
} from './accountTrackerController';
import { mockNetworkState } from '../util/test/network';
import mockedEngine from '../core/__mocks__/MockedEngine';
import { SolScope } from '@metamask/keyring-api';

const MOCK_CHAIN_ID = '0x1';

jest.mock('../core/Engine', () => ({
  init: () => mockedEngine.init(),
}));

describe('selectAccountBalanceByChainId', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns account balance for chain id', () => {
    const result = selectAccountBalanceByChainId({
      engine: {
        backgroundState: {
          NetworkController: {
            ...mockNetworkState({
              chainId: MOCK_CHAIN_ID,
              id: 'mainnet',
              nickname: 'Ethereum Mainnet',
              ticker: 'ETH',
            }),
          },
          AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
          AccountTrackerController: {
            accountsByChainId: {
              [MOCK_CHAIN_ID]: {
                [MOCK_ADDRESS_2]: { balance: '0x1' },
              },
            },
          },
          MultichainNetworkController: {
            isEvmSelected: true,
            selectedMultichainNetworkChainId: SolScope.Mainnet,
            multichainNetworkConfigurationsByChainId: {},
          },
        },
      },
    } as unknown as RootState);
    expect(result?.balance).toBe('0x1');
  });
  it('returns undefined when chain ID is undefined', () => {
    const result = selectAccountBalanceByChainId({
      engine: {
        backgroundState: {
          MultichainNetworkController: {
            isEvmSelected: true,
            selectedMultichainNetworkChainId: SolScope.Mainnet,

            multichainNetworkConfigurationsByChainId: {},
          },
          NetworkController: {
            ...mockNetworkState({
              id: 'sepolia',
              nickname: 'Sepolia',
              ticker: 'ETH',
              chainId: '0xaa36a7',
              type: RpcEndpointType.Infura,
            }),
          },
          AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
          AccountTrackerController: {
            accountsByChainId: {
              [MOCK_CHAIN_ID]: {
                [MOCK_ADDRESS_2]: { balance: '0x1' },
              },
            },
            // TODO: Replace "any" with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        },
      },
    } as unknown as RootState);
    expect(result).toBeUndefined();
  });
});

describe('selectNativeBalanceByChainIdAndAddress', () => {
  const CHECKSUM_ADDRESS = '0xAbCdEf0123456789aBcDeF0123456789AbCdEf01';
  const state = {
    engine: {
      backgroundState: {
        AccountTrackerController: {
          accountsByChainId: {
            [MOCK_CHAIN_ID]: {
              [CHECKSUM_ADDRESS]: { balance: '0xabc' },
            },
            '0x89': {
              [CHECKSUM_ADDRESS]: { balance: '0xdef' },
            },
          },
        },
      },
    },
  } as unknown as RootState;

  it('returns the balance for an exact address match', () => {
    expect(
      selectNativeBalanceByChainIdAndAddress(
        state,
        MOCK_CHAIN_ID,
        CHECKSUM_ADDRESS,
      ),
    ).toBe('0xabc');
  });

  it('matches the address case-insensitively within the requested chain', () => {
    expect(
      selectNativeBalanceByChainIdAndAddress(
        state,
        '0x89',
        CHECKSUM_ADDRESS.toLowerCase(),
      ),
    ).toBe('0xdef');
  });

  it.each([
    ['chain id is missing', undefined, CHECKSUM_ADDRESS],
    ['address is missing', MOCK_CHAIN_ID, undefined],
    ['chain is unknown', '0x2', CHECKSUM_ADDRESS],
    ['address is unknown', MOCK_CHAIN_ID, '0x1234'],
  ] as const)('returns 0x0 when %s', (_, chainId, address) => {
    expect(
      selectNativeBalanceByChainIdAndAddress(state, chainId, address),
    ).toBe('0x0');
  });

  it('reuses the lowercase address index across unrelated store updates', () => {
    let ownKeysCalls = 0;
    const accounts = new Proxy(
      { [CHECKSUM_ADDRESS]: { balance: '0x123' } },
      {
        ownKeys(target) {
          ownKeysCalls++;
          return Reflect.ownKeys(target);
        },
      },
    );
    const accountTrackerControllerState = {
      accountsByChainId: { [MOCK_CHAIN_ID]: accounts },
    };
    const buildState = (unrelated: number) =>
      ({
        unrelated,
        engine: {
          backgroundState: {
            AccountTrackerController: accountTrackerControllerState,
          },
        },
      } as unknown as RootState);

    for (let i = 0; i < 5; i++) {
      expect(
        selectNativeBalanceByChainIdAndAddress(
          buildState(i),
          MOCK_CHAIN_ID,
          CHECKSUM_ADDRESS.toLowerCase(),
        ),
      ).toBe('0x123');
    }
    expect(ownKeysCalls).toBe(1);
  });

  it('returns 0x0 when accountsByChainId is undefined', () => {
    expect(
      selectNativeBalanceByChainIdAndAddress(
        {
          engine: {
            backgroundState: { AccountTrackerController: {} },
          },
        } as unknown as RootState,
        MOCK_CHAIN_ID,
        CHECKSUM_ADDRESS,
      ),
    ).toBe('0x0');
  });
});
