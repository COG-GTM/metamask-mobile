import { merge } from 'lodash';
import { useTokenValues } from './useTokenValues';
import {
  DeepPartial,
  renderHookWithProvider,
} from '../../../../util/test/renderWithProvider';
import { stakingDepositConfirmationState } from '../../../../util/test/confirm-data-helpers';
import { RootState } from '../../../../reducers';

jest.mock('../../../../core/Engine', () => ({
  context: {
    TokenListController: {
      fetchTokenList: jest.fn(),
    },
  },
}));

const stateWithConversionRate = (
  conversionRate: number | null | undefined,
): DeepPartial<RootState> => {
  const state = merge({}, stakingDepositConfirmationState);
  state.engine.backgroundState.CurrencyRateController.currencyRates.ETH = {
    conversionDate: 1732887955.694,
    conversionRate,
    usdConversionRate: conversionRate,
  } as never;
  return state;
};

const stateWithTxValue = (
  value: string | undefined,
): DeepPartial<RootState> => {
  const state = merge({}, stakingDepositConfirmationState);
  state.engine.backgroundState.TransactionController.transactions[0].txParams.value =
    value as never;
  return state;
};

describe('useTokenValues', () => {
  describe('staking deposit', () => {
    it('returns token and fiat values if from transaction metadata', () => {
      const { result } = renderHookWithProvider(
        () => useTokenValues({ amountWei: undefined }),
        {
          state: stakingDepositConfirmationState,
        },
      );

      expect(result.current).toEqual({
        tokenAmountValue: '0.0001',
        tokenAmountDisplayValue: '0.0001',
        fiatDisplayValue: '$0.36',
      });
    });

    it('returns token and fiat values if amountWei is defined', () => {
      const { result } = renderHookWithProvider(
        () => useTokenValues({ amountWei: '1000000000000000' }),
        {
          state: stakingDepositConfirmationState,
        },
      );

      expect(result.current).toEqual({
        tokenAmountValue: '0.001',
        tokenAmountDisplayValue: '0.001',
        fiatDisplayValue: '$3.60',
      });
    });
  });

  describe('missing conversion rate', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['zero', 0],
    ])(
      'returns no fiat value when the conversion rate is %s',
      (_label, conversionRate) => {
        const { result } = renderHookWithProvider(
          () => useTokenValues({ amountWei: '1000000000000000000' }),
          { state: stateWithConversionRate(conversionRate) },
        );

        expect(result.current).toEqual({
          tokenAmountValue: '1',
          tokenAmountDisplayValue: '1',
          fiatDisplayValue: undefined,
        });
      },
    );

    it('returns no fiat value when the chain has no rate entry', () => {
      const state = merge({}, stakingDepositConfirmationState);
      state.engine.backgroundState.CurrencyRateController.currencyRates =
        {} as never;

      const { result } = renderHookWithProvider(
        () => useTokenValues({ amountWei: '1000000000000000000' }),
        { state },
      );

      expect(result.current.fiatDisplayValue).toBeUndefined();
      expect(result.current.tokenAmountValue).toBe('1');
    });
  });

  describe('transaction value edge cases', () => {
    it.each([
      ['0x0', '0x0'],
      ['empty string', ''],
      ['undefined', undefined],
    ])('returns zero values when txParams.value is %s', (_label, value) => {
      const { result } = renderHookWithProvider(() => useTokenValues(), {
        state: stateWithTxValue(value),
      });

      expect(result.current).toEqual({
        tokenAmountValue: '0',
        tokenAmountDisplayValue: '0',
        fiatDisplayValue: '$0',
      });
    });

    it('returns zero values when amountWei is "0"', () => {
      const { result } = renderHookWithProvider(
        () => useTokenValues({ amountWei: '0' }),
        { state: stakingDepositConfirmationState },
      );

      expect(result.current).toEqual({
        tokenAmountValue: '0',
        tokenAmountDisplayValue: '0',
        fiatDisplayValue: '$0',
      });
    });

    it('keeps full precision for very large amountWei', () => {
      const { result } = renderHookWithProvider(
        () => useTokenValues({ amountWei: '1000000000000000000000000000000' }),
        { state: stakingDepositConfirmationState },
      );

      expect(result.current).toEqual({
        tokenAmountValue: '1000000000000',
        tokenAmountDisplayValue: '1,000,000,000,000',
        fiatDisplayValue: '$3,596,250,000,000,000',
      });
    });

    it('rounds tokenAmountDisplayValue but keeps exact tokenAmountValue', () => {
      const { result } = renderHookWithProvider(
        () => useTokenValues({ amountWei: '1234567890123456789' }),
        { state: stakingDepositConfirmationState },
      );

      expect(result.current).toEqual({
        tokenAmountValue: '1.234567890123456789',
        tokenAmountDisplayValue: '1.235',
        fiatDisplayValue: '$4,439.81',
      });
    });

    it('shows a minimum indicator for amounts below display precision', () => {
      const { result } = renderHookWithProvider(
        () => useTokenValues({ amountWei: '1' }),
        { state: stakingDepositConfirmationState },
      );

      expect(result.current.tokenAmountValue).toBe('0.000000000000000001');
      expect(result.current.tokenAmountDisplayValue).toBe('< 0.000001');
    });
  });
});
