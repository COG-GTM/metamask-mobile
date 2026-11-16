import { renderHook } from '@testing-library/react-hooks';
import BigNumber from 'bignumber.js';
import {
  getFetchParams,
  shouldShowMaxBalanceLink,
  isSwapsAllowed,
  useRatio,
} from './index';
import { swapsUtils } from '@metamask/swaps-controller';
import { SolScope } from '@metamask/keyring-api';

// Mock AppConstants
const mockSwapsConstantsGetter = jest.fn(() => ({
  ACTIVE: true,
  ONLY_MAINNET: true,
}));
jest.mock('../../../../core/AppConstants', () => ({
  get SWAPS() {
    return mockSwapsConstantsGetter();
  },
}));

const {
  ETH_CHAIN_ID,
  BSC_CHAIN_ID,
  SWAPS_TESTNET_CHAIN_ID,
  POLYGON_CHAIN_ID,
  AVALANCHE_CHAIN_ID,
  ARBITRUM_CHAIN_ID,
  OPTIMISM_CHAIN_ID,
  ZKSYNC_ERA_CHAIN_ID,
  LINEA_CHAIN_ID,
  BASE_CHAIN_ID,
} = swapsUtils;

describe('getFetchParams', () => {
  const mockSourceToken = {
    address: '0x123',
    symbol: 'TOKEN1',
    decimals: 18,
  };

  const mockDestinationToken = {
    address: '0x456',
    symbol: 'TOKEN2',
    decimals: 18,
  };

  const mockBaseParams = {
    slippage: 1,
    sourceToken: mockSourceToken,
    destinationToken: mockDestinationToken,
    sourceAmount: '1000000000000000000', // 1 token in wei
    walletAddress: '0x789',
    networkClientId: '1',
    enableGasIncludedQuotes: true,
  };

  it('returns correct parameters with default slippage', () => {
    const result = getFetchParams(mockBaseParams);

    expect(result).toEqual({
      slippage: 1,
      sourceToken: mockSourceToken.address,
      destinationToken: mockDestinationToken.address,
      sourceAmount: '1000000000000000000',
      walletAddress: '0x789',
      metaData: {
        sourceTokenInfo: mockSourceToken,
        destinationTokenInfo: mockDestinationToken,
        networkClientId: '1',
      },
      enableGasIncludedQuotes: true,
    });
  });

  it('returns correct parameters with custom slippage', () => {
    const result = getFetchParams({
      ...mockBaseParams,
      slippage: 2,
    });

    expect(result).toEqual({
      slippage: 2,
      sourceToken: mockSourceToken.address,
      destinationToken: mockDestinationToken.address,
      sourceAmount: '1000000000000000000',
      walletAddress: '0x789',
      metaData: {
        sourceTokenInfo: mockSourceToken,
        destinationTokenInfo: mockDestinationToken,
        networkClientId: '1',
      },
      enableGasIncludedQuotes: true,
    });
  });

  it('returns correct parameters with gas included quotes disabled', () => {
    const result = getFetchParams({
      ...mockBaseParams,
      enableGasIncludedQuotes: false,
    });

    expect(result).toEqual({
      slippage: 1,
      sourceToken: mockSourceToken.address,
      destinationToken: mockDestinationToken.address,
      sourceAmount: '1000000000000000000',
      walletAddress: '0x789',
      metaData: {
        sourceTokenInfo: mockSourceToken,
        destinationTokenInfo: mockDestinationToken,
        networkClientId: '1',
      },
      enableGasIncludedQuotes: false,
    });
  });
});

describe('shouldShowMaxBalanceLink', () => {
  const nativeToken = {
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000', // NATIVE_SWAPS_TOKEN_ADDRESS
  };

  const erc20Token = {
    symbol: 'DAI',
    address: '0x123456789abcdef',
  };

  it('should show max balance link when all conditions are met for ERC20 token', () => {
    const result = shouldShowMaxBalanceLink({
      sourceToken: erc20Token,
      shouldUseSmartTransaction: true,
      hasBalance: true,
    });
    expect(result).toBe(true);
  });

  it('should show max balance link for native token when smart transactions enabled', () => {
    const result = shouldShowMaxBalanceLink({
      sourceToken: nativeToken,
      shouldUseSmartTransaction: true,
      hasBalance: true,
    });
    expect(result).toBe(true);
  });

  it('should not show max balance link for native token when smart transactions disabled', () => {
    const result = shouldShowMaxBalanceLink({
      sourceToken: nativeToken,
      shouldUseSmartTransaction: false,
      hasBalance: true,
    });
    expect(result).toBe(false);
  });

  it('should show max balance link for ERC20 token regardless of smart transaction setting', () => {
    let result = shouldShowMaxBalanceLink({
      sourceToken: erc20Token,
      shouldUseSmartTransaction: true,
      hasBalance: true,
    });
    expect(result).toBe(true);

    result = shouldShowMaxBalanceLink({
      sourceToken: erc20Token,
      shouldUseSmartTransaction: false,
      hasBalance: true,
    });
    expect(result).toBe(true);
  });

  it('should not show max balance link when source token is missing symbol', () => {
    const sourceToken = { ...erc20Token, symbol: null };
    const result = shouldShowMaxBalanceLink({
      sourceToken,
      shouldUseSmartTransaction: true,
      hasBalance: true,
    });
    expect(result).toBe(false);
  });

  it('should not show max balance link when user has no balance', () => {
    const result = shouldShowMaxBalanceLink({
      sourceToken: erc20Token,
      shouldUseSmartTransaction: true,
      hasBalance: false,
    });
    expect(result).toBe(false);
  });
});

describe('isSwapsAllowed', () => {
  beforeEach(() => {
    mockSwapsConstantsGetter.mockReturnValue({
      ACTIVE: true,
      ONLY_MAINNET: true,
    });
  });

  it('should return false when swaps are not active', () => {
    // Mock AppConstants.SWAPS.ACTIVE to false
    mockSwapsConstantsGetter.mockReturnValue({
      ...mockSwapsConstantsGetter(),
      ACTIVE: false,
    });

    expect(isSwapsAllowed(ETH_CHAIN_ID)).toBe(false);
  });

  test.each([
    [ETH_CHAIN_ID],
    [BSC_CHAIN_ID],
    [POLYGON_CHAIN_ID],
    [AVALANCHE_CHAIN_ID],
    [ARBITRUM_CHAIN_ID],
    [OPTIMISM_CHAIN_ID],
    [ZKSYNC_ERA_CHAIN_ID],
    [LINEA_CHAIN_ID],
    [BASE_CHAIN_ID],
  ])('should return true for chain ID %s', (chainId) => {
    expect(isSwapsAllowed(chainId)).toBe(true);
  });

  it('should return false for unsupported chain IDs', () => {
    const unsupportedChainId = '0x9999';
    expect(isSwapsAllowed(unsupportedChainId)).toBe(false);
  });

  describe('testnet chain IDs', () => {
    it('should return true for testnet chain IDs in development when ONLY_MAINNET is true', () => {
      global.__DEV__ = true;
      mockSwapsConstantsGetter.mockReturnValue({
        ...mockSwapsConstantsGetter(),
        ONLY_MAINNET: true,
      });
      expect(isSwapsAllowed(SWAPS_TESTNET_CHAIN_ID)).toBe(true);
    });

    it('should return true for testnet chain IDs when ONLY_MAINNET is false', () => {
      global.__DEV__ = false;
      mockSwapsConstantsGetter.mockReturnValue({
        ...mockSwapsConstantsGetter(),
        ONLY_MAINNET: false,
      });
      expect(isSwapsAllowed(SWAPS_TESTNET_CHAIN_ID)).toBe(true);
    });
  });
});

describe('useRatio', () => {
  const ONE_ETH_WEI = '1000000000000000000';
  const TWO_THOUSAND_USDC = '2000000000';

  const renderUseRatio = (...args) =>
    renderHook((props) => useRatio(...props), { initialProps: args });

  it('returns a BigNumber', () => {
    const { result } = renderUseRatio('1', 18, '1', 18);
    expect(BigNumber.isBigNumber(result.current)).toBe(true);
  });

  it('returns the plain amount ratio when decimals are equal', () => {
    const { result } = renderUseRatio(
      '3000000000000000000',
      18,
      '2000000000000000000',
      18,
    );
    expect(result.current.toString()).toBe('1.5');
  });

  it('returns the plain amount ratio for equal non-18 decimals', () => {
    const { result } = renderUseRatio('5000000', 6, '2000000', 6);
    expect(result.current.toString()).toBe('2.5');
  });

  it('scales USDC (6) per ETH (18) by 10^(18 - 6)', () => {
    const { result } = renderUseRatio(TWO_THOUSAND_USDC, 6, ONE_ETH_WEI, 18);
    expect(result.current.toString()).toBe('2000');
  });

  it('scales ETH (18) per USDC (6) by 10^(6 - 18)', () => {
    const { result } = renderUseRatio(ONE_ETH_WEI, 18, TWO_THOUSAND_USDC, 6);
    expect(result.current.toString()).toBe('0.0005');
  });

  it('returns reciprocal rates for the two directions', () => {
    const { result: usdcPerEth } = renderUseRatio(
      TWO_THOUSAND_USDC,
      6,
      ONE_ETH_WEI,
      18,
    );
    const { result: ethPerUsdc } = renderUseRatio(
      ONE_ETH_WEI,
      18,
      TWO_THOUSAND_USDC,
      6,
    );
    expect(usdcPerEth.current.multipliedBy(ethPerUsdc.current).toString()).toBe(
      '1',
    );
  });

  it('is off by 10^24 if the decimals are swapped', () => {
    const { result: correct } = renderUseRatio(
      TWO_THOUSAND_USDC,
      6,
      ONE_ETH_WEI,
      18,
    );
    const { result: swapped } = renderUseRatio(
      TWO_THOUSAND_USDC,
      18,
      ONE_ETH_WEI,
      6,
    );
    expect(correct.current.toString()).toBe('2000');
    expect(swapped.current.toString()).toBe('2e-21');
    expect(correct.current.dividedBy(swapped.current).toString()).toBe('1e+24');
  });

  it('scales WBTC (8) per ETH (18) by 10^(18 - 8)', () => {
    const { result } = renderUseRatio('5000000', 8, ONE_ETH_WEI, 18);
    expect(result.current.toString()).toBe('0.05');
  });

  it('accepts BigNumber and numeric amounts', () => {
    const { result } = renderUseRatio(
      new BigNumber(TWO_THOUSAND_USDC),
      6,
      1e18,
      18,
    );
    expect(result.current.toString()).toBe('2000');
  });

  it('returns Infinity when the denominator amount is zero', () => {
    const { result } = renderUseRatio(TWO_THOUSAND_USDC, 6, '0', 18);
    expect(result.current.isFinite()).toBe(false);
    expect(result.current.isEqualTo(Infinity)).toBe(true);
  });

  it('returns NaN when both amounts are zero', () => {
    const { result } = renderUseRatio('0', 6, '0', 18);
    expect(result.current.isNaN()).toBe(true);
  });

  it('returns zero when the numerator amount is zero', () => {
    const { result } = renderUseRatio('0', 6, ONE_ETH_WEI, 18);
    expect(result.current.isZero()).toBe(true);
  });

  it('returns NaN when an amount is undefined', () => {
    const { result } = renderUseRatio(undefined, 6, ONE_ETH_WEI, 18);
    expect(result.current.isNaN()).toBe(true);
  });

  it('memoizes the result while inputs are unchanged', () => {
    const { result, rerender } = renderUseRatio(
      TWO_THOUSAND_USDC,
      6,
      ONE_ETH_WEI,
      18,
    );
    const first = result.current;
    rerender([TWO_THOUSAND_USDC, 6, ONE_ETH_WEI, 18]);
    expect(result.current).toBe(first);
  });

  it('recomputes when the amounts or decimals change', () => {
    const { result, rerender } = renderUseRatio(
      TWO_THOUSAND_USDC,
      6,
      ONE_ETH_WEI,
      18,
    );
    expect(result.current.toString()).toBe('2000');

    rerender(['4000000000', 6, ONE_ETH_WEI, 18]);
    expect(result.current.toString()).toBe('4000');

    rerender([ONE_ETH_WEI, 18, TWO_THOUSAND_USDC, 6]);
    expect(result.current.toString()).toBe('0.0005');
  });
});
