import { EVENT_PROVIDERS, EVENT_LOCATIONS } from './events';

describe('EVENT_PROVIDERS', () => {
  it('exposes the consensys provider constant', () => {
    expect(EVENT_PROVIDERS.CONSENSYS).toBe('consensys');
  });
});

describe('EVENT_LOCATIONS', () => {
  it('exposes the expected set of locations', () => {
    expect(EVENT_LOCATIONS).toEqual({
      HOME_SCREEN: 'HomeScreen',
      GAS_IMPACT_MODAL: 'GasImpactModal',
      LEARN_MORE_MODAL: 'LearnMoreModal',
      STAKING_BALANCE: 'StakingBalance',
      TOKEN_DETAILS: 'TokenDetails',
      STAKE_INPUT_VIEW: 'StakeInputView',
      STAKE_CONFIRMATION_VIEW: 'StakeConfirmationView',
      STAKING_EARNINGS: 'StakingEarnings',
      UNSTAKE_INPUT_VIEW: 'UnstakeInputView',
      UNSTAKE_CONFIRMATION_VIEW: 'UnstakeConfirmationView',
      WALLET_ACTIONS_BOTTOM_SHEET: 'WalletActionsBottomSheet',
      UNIT_TEST: 'UnitTest',
    });
  });

  it('has every value as a non-empty string', () => {
    Object.values(EVENT_LOCATIONS).forEach((value) => {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    });
  });
});
