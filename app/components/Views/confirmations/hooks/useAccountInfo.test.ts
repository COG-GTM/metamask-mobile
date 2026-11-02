import {
  DeepPartial,
  renderHookWithProvider,
} from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { createMockAccountsControllerState } from '../../../../util/test/accountsControllerTestUtils';
import { RootState } from '../../../../reducers';
import Engine from '../../../../core/Engine';
import useAccountInfo from './useAccountInfo';

jest.mock('../../../../core/Engine', () => ({
  getTotalEvmFiatAccountBalance: jest.fn(() => ({ tokenFiat: 10 })),
}));

const MOCK_ADDRESS = '0x0';
const MOCK_LOWERCASE_ADDRESS = '0xdc47789de4ceff0e8fe9d15d728af7f17550c164';
const MOCK_CHECKSUM_ADDRESS = '0xDc47789de4ceFF0e8Fe9D15D728Af7F17550c164';

const MOCK_ACCOUNTS_CONTROLLER_STATE = createMockAccountsControllerState([
  MOCK_ADDRESS,
]);

const mockInitialState: DeepPartial<RootState> = {
  settings: {},
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
      AccountTrackerController: {
        accountsByChainId: {
          '0x1': {
            [MOCK_ADDRESS]: {
              balance: '0x5',
            },
          },
        },
      },
    },
  },
};

const mockSelectorCalls: string[] = [];

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (fn: (state: DeepPartial<RootState>) => unknown) => {
    mockSelectorCalls.push(fn.name);
    return fn(mockInitialState);
  },
}));

describe('useAccountInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectorCalls.length = 0;
  });

  it('returns the account name and checksummed address', () => {
    const { result } = renderHookWithProvider(
      () => useAccountInfo(MOCK_ADDRESS),
      {
        state: mockInitialState,
      },
    );
    expect(result?.current?.accountName).toEqual('Account 1');
    expect(result?.current?.accountAddress).toEqual('0x0');
  });

  it('returns a checksummed address for a lowercase input', () => {
    const { result } = renderHookWithProvider(
      () => useAccountInfo(MOCK_LOWERCASE_ADDRESS),
      {
        state: mockInitialState,
      },
    );
    expect(result?.current?.accountAddress).toEqual(MOCK_CHECKSUM_ADDRESS);
  });

  it('does not compute the fiat portfolio balance or subscribe to balances', () => {
    const { rerender } = renderHookWithProvider(
      () => useAccountInfo(MOCK_ADDRESS),
      {
        state: mockInitialState,
      },
    );
    rerender({});
    rerender({});

    expect(Engine.getTotalEvmFiatAccountBalance).not.toHaveBeenCalled();
    expect(mockSelectorCalls).not.toContain('selectAccounts');
    expect(mockSelectorCalls).not.toContain('selectContractBalances');
    expect(mockSelectorCalls).not.toContain('selectCurrentCurrency');
  });

  it('keeps the same result references across re-renders', () => {
    const { result, rerender } = renderHookWithProvider(
      () => useAccountInfo(MOCK_ADDRESS),
      {
        state: mockInitialState,
      },
    );
    const first = result.current;
    rerender({});
    expect(result.current.accountAddress).toBe(first.accountAddress);
    expect(result.current.accountName).toBe(first.accountName);
  });
});
