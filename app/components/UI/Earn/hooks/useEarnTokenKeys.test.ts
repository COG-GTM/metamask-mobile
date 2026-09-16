import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../../util/test/accountsControllerTestUtils';
import initialRootState from '../../../../util/test/initial-root-state';
import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';
import useEarnTokenKeys, { getEarnTokenKey } from './useEarnTokenKeys';
import useEarnTokens from './useEarnTokens';
import {
  MOCK_USDC_BASE_MAINNET_ASSET,
  MOCK_USDC_MAINNET_ASSET,
  MOCK_ETH_MAINNET_ASSET,
  MOCK_USDT_MAINNET_ASSET,
  MOCK_DAI_MAINNET_ASSET,
  MOCK_GET_POOLED_STAKES_API_RESPONSE,
} from '../../Stake/__mocks__/mockData';
import {
  selectPooledStakingEnabledFlag,
  selectStablecoinLendingEnabledFlag,
} from '../selectors/featureFlags';

const mockPooledStakeData = MOCK_GET_POOLED_STAKES_API_RESPONSE.accounts[0];
const mockExchangeRate = MOCK_GET_POOLED_STAKES_API_RESPONSE.exchangeRate;

const mockState = ({
  isEligibleToPoolStake = true,
}: Partial<{ isEligibleToPoolStake: boolean }> = {}) => ({
  ...initialRootState,
  engine: {
    ...initialRootState.engine,
    backgroundState: {
      ...initialRootState.engine.backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
      EarnController: {
        pooled_staking: {
          pooledStakes: mockPooledStakeData,
          exchangeRate: mockExchangeRate,
          isEligible: isEligibleToPoolStake,
        },
      },
    },
  },
});

const mockTokens = {
  '0x1': [
    MOCK_ETH_MAINNET_ASSET,
    MOCK_USDC_MAINNET_ASSET,
    MOCK_USDT_MAINNET_ASSET,
    MOCK_DAI_MAINNET_ASSET,
  ],
  '0x2105': [MOCK_USDC_BASE_MAINNET_ASSET],
};

jest.mock('../../../../selectors/multichain', () => ({
  selectAccountTokensAcrossChains: jest.fn(() => mockTokens),
}));

jest.mock('../selectors/featureFlags', () => ({
  selectPooledStakingEnabledFlag: jest.fn(),
  selectStablecoinLendingEnabledFlag: jest.fn(),
}));

const mockFlags = ({
  pooledStaking,
  stablecoinLending,
}: {
  pooledStaking: boolean;
  stablecoinLending: boolean;
}) => {
  (
    selectPooledStakingEnabledFlag as jest.MockedFunction<
      typeof selectPooledStakingEnabledFlag
    >
  ).mockReturnValue(pooledStaking);
  (
    selectStablecoinLendingEnabledFlag as jest.MockedFunction<
      typeof selectStablecoinLendingEnabledFlag
    >
  ).mockReturnValue(stablecoinLending);
};

describe('getEarnTokenKey', () => {
  it('combines chainId and symbol', () => {
    expect(getEarnTokenKey({ chainId: '0x1', symbol: 'USDC' })).toBe(
      '0x1:USDC',
    );
  });
});

describe('useEarnTokenKeys', () => {
  beforeEach(() => {
    mockFlags({ pooledStaking: false, stablecoinLending: false });
  });

  it('returns keys for all eligible tokens when all flags enabled and user is eligible', () => {
    mockFlags({ pooledStaking: true, stablecoinLending: true });

    const { result } = renderHookWithProvider(() => useEarnTokenKeys(), {
      state: mockState(),
    });

    expect(result.current.size).toBe(5);
    [
      MOCK_ETH_MAINNET_ASSET,
      MOCK_USDC_MAINNET_ASSET,
      MOCK_USDT_MAINNET_ASSET,
      MOCK_DAI_MAINNET_ASSET,
      MOCK_USDC_BASE_MAINNET_ASSET,
    ].forEach((token) => {
      expect(result.current.has(getEarnTokenKey(token))).toBe(true);
    });
  });

  it('excludes pooled-staking tokens when the flag is disabled', () => {
    mockFlags({ pooledStaking: false, stablecoinLending: true });

    const { result } = renderHookWithProvider(() => useEarnTokenKeys(), {
      state: mockState(),
    });

    expect(result.current.size).toBe(4);
    expect(result.current.has(getEarnTokenKey(MOCK_ETH_MAINNET_ASSET))).toBe(
      false,
    );
  });

  it('excludes pooled-staking tokens when the user is not eligible to stake', () => {
    mockFlags({ pooledStaking: true, stablecoinLending: true });

    const { result } = renderHookWithProvider(() => useEarnTokenKeys(), {
      state: mockState({ isEligibleToPoolStake: false }),
    });

    expect(result.current.size).toBe(4);
    expect(result.current.has(getEarnTokenKey(MOCK_ETH_MAINNET_ASSET))).toBe(
      false,
    );
  });

  it('excludes lending tokens when the stablecoin lending flag is disabled', () => {
    mockFlags({ pooledStaking: true, stablecoinLending: false });

    const { result } = renderHookWithProvider(() => useEarnTokenKeys(), {
      state: mockState(),
    });

    expect(result.current.size).toBe(1);
    expect(result.current.has(getEarnTokenKey(MOCK_ETH_MAINNET_ASSET))).toBe(
      true,
    );
  });

  it('returns an empty set when no flags are enabled', () => {
    const { result } = renderHookWithProvider(() => useEarnTokenKeys(), {
      state: mockState(),
    });

    expect(result.current.size).toBe(0);
  });

  it('matches the membership of useEarnTokens', () => {
    mockFlags({ pooledStaking: true, stablecoinLending: true });
    const state = mockState();

    const { result: keys } = renderHookWithProvider(
      () => useEarnTokenKeys(),
      { state },
    );
    const { result: tokens } = renderHookWithProvider(() => useEarnTokens(), {
      state,
    });

    expect(new Set(tokens.current.map(getEarnTokenKey))).toEqual(keys.current);
  });

  it('returns a referentially stable set across unrelated re-renders', () => {
    mockFlags({ pooledStaking: true, stablecoinLending: true });

    const { result, rerender } = renderHookWithProvider(
      () => useEarnTokenKeys(),
      { state: mockState() },
    );
    const first = result.current;
    rerender({});

    expect(result.current).toBe(first);
  });
});
