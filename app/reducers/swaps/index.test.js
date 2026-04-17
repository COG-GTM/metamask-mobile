import swapsReducer, {
  initialState,
  SWAPS_SET_LIVENESS,
  SWAPS_SET_HAS_ONBOARDED,
  setSwapsLiveness,
  setSwapsHasOnboarded,
  getFeatureFlagChainId,
  swapsLivenessSelector,
  swapsHasOnboardedSelector,
  swapsSmartTxFlagEnabled,
} from './index';

jest.mock('../../util/networks', () => ({
  isMainnetByChainId: jest.fn((chainId) => chainId === '0x1'),
}));
jest.mock('../../util/address', () => ({
  safeToChecksumAddress: jest.fn((addr) => addr),
}));
jest.mock('../../util/general', () => ({
  toLowerCaseEquals: jest.fn((a, b) => a?.toLowerCase() === b?.toLowerCase()),
}));
jest.mock('../../util/lodash', () => ({
  lte: jest.fn((a, b) => a <= b),
}));
jest.mock('../../selectors/networkController', () => ({
  selectEvmChainId: jest.fn((state) => state?.engine?.backgroundState?.NetworkController?.providerConfig?.chainId || '0x1'),
}));
jest.mock('../../selectors/tokensController', () => ({
  selectAllTokens: jest.fn(() => ({})),
  selectTokens: jest.fn(() => []),
}));
jest.mock('../../selectors/tokenListController', () => ({
  selectTokenList: jest.fn(() => ({})),
}));
jest.mock('../../selectors/tokenBalancesController', () => ({
  selectContractBalances: jest.fn(() => ({})),
}));
jest.mock('../../selectors/accountsController', () => ({
  selectSelectedInternalAccountAddress: jest.fn(() => '0x123'),
}));
jest.mock('./utils', () => ({
  getChainFeatureFlags: jest.fn((flags, chainId) => flags?.[chainId] || {}),
  getSwapsLiveness: jest.fn((flags, chainId) => {
    const chainFlags = flags?.[chainId];
    return chainFlags?.extension_active !== undefined ? chainFlags.extension_active : true;
  }),
}));
jest.mock('../../components/UI/Swaps/utils', () => ({
  allowedTestnetChainIds: ['0x5', '0xaa36a7'],
}));
jest.mock('../../constants/network', () => ({
  NETWORKS_CHAIN_ID: { MAINNET: '0x1' },
}));

describe('swapsReducer', () => {
  it('should return initial state', () => {
    const state = swapsReducer(undefined, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });

  it('should handle SWAPS_SET_HAS_ONBOARDED true', () => {
    const state = swapsReducer(initialState, {
      type: SWAPS_SET_HAS_ONBOARDED,
      payload: true,
    });
    expect(state.hasOnboarded).toBe(true);
  });

  it('should handle SWAPS_SET_HAS_ONBOARDED false', () => {
    const state = swapsReducer(initialState, {
      type: SWAPS_SET_HAS_ONBOARDED,
      payload: false,
    });
    expect(state.hasOnboarded).toBe(false);
  });

  it('should handle SWAPS_SET_LIVENESS with featureFlags', () => {
    const featureFlags = {
      '0x1': { extension_active: true },
      smart_transactions: { mobileActive: true },
      smartTransactions: { mobileActive: true },
    };
    const state = swapsReducer(initialState, {
      type: SWAPS_SET_LIVENESS,
      payload: { chainId: '0x1', featureFlags },
    });
    expect(state['0x1']).toBeDefined();
    expect(state.featureFlags).toBeDefined();
  });

  it('should handle SWAPS_SET_LIVENESS without featureFlags', () => {
    const state = swapsReducer(initialState, {
      type: SWAPS_SET_LIVENESS,
      payload: { chainId: '0x1', featureFlags: null },
    });
    expect(state['0x1'].isLive).toBe(false);
    expect(state.featureFlags).toBeUndefined();
  });

  it('should return current state for unknown action', () => {
    const state = swapsReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toBe(initialState);
  });
});

describe('swaps action creators', () => {
  it('setSwapsLiveness should create correct action', () => {
    const action = setSwapsLiveness('0x1', { test: true });
    expect(action).toEqual({
      type: SWAPS_SET_LIVENESS,
      payload: { chainId: '0x1', featureFlags: { test: true } },
    });
  });

  it('setSwapsHasOnboarded should create correct action', () => {
    const action = setSwapsHasOnboarded(true);
    expect(action).toEqual({
      type: SWAPS_SET_HAS_ONBOARDED,
      payload: true,
    });
  });
});

describe('getFeatureFlagChainId', () => {
  const originalDev = global.__DEV__;

  afterEach(() => {
    global.__DEV__ = originalDev;
  });

  it('should return mainnet chainId for testnet in dev mode', () => {
    global.__DEV__ = true;
    expect(getFeatureFlagChainId('0x5')).toBe('0x1');
  });

  it('should return original chainId for non-testnet', () => {
    global.__DEV__ = true;
    expect(getFeatureFlagChainId('0x89')).toBe('0x89');
  });

  it('should return original chainId when not in dev mode', () => {
    global.__DEV__ = false;
    expect(getFeatureFlagChainId('0x5')).toBe('0x5');
  });
});

describe('swaps selectors', () => {
  it('swapsLivenessSelector should return isLive', () => {
    const state = {
      swaps: { '0x1': { isLive: true } },
      engine: { backgroundState: { NetworkController: { providerConfig: { chainId: '0x1' } } } },
    };
    const result = swapsLivenessSelector(state);
    expect(result).toBe(true);
  });

  it('swapsLivenessSelector should return false if not live', () => {
    const state = {
      swaps: { '0x1': { isLive: false } },
      engine: { backgroundState: { NetworkController: { providerConfig: { chainId: '0x1' } } } },
    };
    const result = swapsLivenessSelector(state);
    expect(result).toBe(false);
  });

  it('swapsHasOnboardedSelector should return hasOnboarded', () => {
    const state = { swaps: { hasOnboarded: true } };
    expect(swapsHasOnboardedSelector(state)).toBe(true);
  });

  it('swapsSmartTxFlagEnabled should return true when enabled', () => {
    const state = {
      swaps: { featureFlags: { smartTransactions: { mobileActive: true } } },
    };
    expect(swapsSmartTxFlagEnabled(state)).toBe(true);
  });

  it('swapsSmartTxFlagEnabled should return false when disabled', () => {
    const state = {
      swaps: { featureFlags: {} },
    };
    expect(swapsSmartTxFlagEnabled(state)).toBe(false);
  });
});
