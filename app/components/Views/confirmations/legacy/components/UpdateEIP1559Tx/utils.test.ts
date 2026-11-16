import { CANCEL_RATE, SPEED_UP_RATE } from '@metamask/transaction-controller';
import BigNumber from 'bignumber.js';
import {
  getInitialUpdateTx1559Options,
  getReplacementFeeFloor,
  isMaxFeePerGasMoreThanLegacy,
  isMaxPriorityFeePerGasMoreThanLegacy,
  validateUpdateTxAmount,
} from './utils';

const existingGas = { maxFeePerGas: '100', maxPriorityFeePerGas: '10' };
const ONE_ETH_HEX = 'de0b6b3a7640000';
const TEN_ETH_HEX = '0x8ac7230489e80000';

const validUpdateTx = {
  totalMaxHex: ONE_ETH_HEX,
  suggestedMaxFeePerGas: '200',
  suggestedMaxPriorityFeePerGas: '20',
};

describe('UpdateEIP1559Tx utils', () => {
  describe('getReplacementFeeFloor', () => {
    it.each([
      ['speed up', false, SPEED_UP_RATE],
      ['cancel', true, CANCEL_RATE],
    ])('multiplies the existing fee by the %s rate', (_, isCancel, rate) => {
      expect(getReplacementFeeFloor('100', isCancel).toString()).toBe(
        new BigNumber(100).times(rate).toString(),
      );
    });
  });

  describe('fee floor checks', () => {
    it.each([false, true])(
      'compares max fee against existing max fee times rate (isCancel=%s)',
      (isCancel) => {
        const floor = getReplacementFeeFloor('100', isCancel);
        expect(
          isMaxFeePerGasMoreThanLegacy(existingGas, isCancel, floor),
        ).toEqual({ result: true, value: floor });
        expect(
          isMaxFeePerGasMoreThanLegacy(existingGas, isCancel, floor.minus(0.1))
            .result,
        ).toBe(false);
      },
    );

    it.each([false, true])(
      'compares priority fee against existing priority fee times rate (isCancel=%s)',
      (isCancel) => {
        const floor = getReplacementFeeFloor('10', isCancel);
        expect(
          isMaxPriorityFeePerGasMoreThanLegacy(existingGas, isCancel, floor),
        ).toEqual({ result: true, value: floor });
        expect(
          isMaxPriorityFeePerGasMoreThanLegacy(
            existingGas,
            isCancel,
            floor.minus(0.1),
          ).result,
        ).toBe(false);
      },
    );
  });

  describe('validateUpdateTxAmount', () => {
    const validate = (
      updateTx: Partial<typeof validUpdateTx>,
      isCancel = false,
      accountBalance = TEN_ETH_HEX,
    ) =>
      validateUpdateTxAmount({
        updateTx: { ...validUpdateTx, ...updateTx },
        accountBalance,
        existingGas,
        isCancel,
        ticker: 'ETH',
      });

    it('returns undefined when balance and both fees are sufficient', () => {
      expect(validate({})).toBeUndefined();
      expect(validate({}, true)).toBeUndefined();
    });

    it('rejects an invalid totalMaxHex', () => {
      expect(validate({ totalMaxHex: 'not-hex' })).toBe('Invalid amount');
    });

    it('reports the missing amount when the balance is insufficient', () => {
      expect(validate({}, false, '0x0')).toBe(
        'You need 1 more ETH to complete this transaction.',
      );
    });

    it('prioritises insufficient balance over low fees', () => {
      expect(validate({ suggestedMaxFeePerGas: '1' }, false, '0x0')).toMatch(
        /^You need 1 more ETH/,
      );
    });

    it('reports a low max fee for speed up', () => {
      expect(validate({ suggestedMaxFeePerGas: '109' })).toBe(
        'Max Fee must be at least 110 GWEI (10% higher than initial transaction)',
      );
    });

    it('reports a low max fee for cancel', () => {
      expect(validate({ suggestedMaxFeePerGas: '109' }, true)).toBe(
        'Max Fee must be at least 110 GWEI (50% higher than initial transaction)',
      );
    });

    it('reports a low priority fee for speed up', () => {
      expect(validate({ suggestedMaxPriorityFeePerGas: '10.9' })).toBe(
        'Max Priority Fee must be at least 11 GWEI (10% higher than initial transaction)',
      );
    });

    it('reports a low priority fee for cancel', () => {
      expect(validate({ suggestedMaxPriorityFeePerGas: '10.9' }, true)).toBe(
        'Max Priority Fee must be at least 11 GWEI (50% higher than initial transaction)',
      );
    });
  });

  describe('getInitialUpdateTx1559Options', () => {
    it.each([false, true])(
      'uses the market medium thresholds when medium is above both floors (isCancel=%s)',
      (isCancel) => {
        expect(
          getInitialUpdateTx1559Options({
            existingGas,
            mediumEstimate: {
              suggestedMaxFeePerGas: '120',
              suggestedMaxPriorityFeePerGas: '12',
            },
            isCancel,
          }),
        ).toEqual({
          maxFeeThreshold: '120',
          maxPriortyFeeThreshold: '12',
          showAdvanced: false,
          isCancel,
        });
      },
    );

    it.each([
      [
        'max fee',
        { suggestedMaxFeePerGas: '105', suggestedMaxPriorityFeePerGas: '50' },
      ],
      [
        'priority fee',
        { suggestedMaxFeePerGas: '200', suggestedMaxPriorityFeePerGas: '5' },
      ],
      [
        'max fee (priority fee above old max fee floor)',
        { suggestedMaxFeePerGas: '105', suggestedMaxPriorityFeePerGas: '120' },
      ],
    ])(
      'forces the advanced view with floor thresholds when medium %s is below the floor',
      (_, mediumEstimate) => {
        const result = getInitialUpdateTx1559Options({
          existingGas,
          mediumEstimate,
          isCancel: false,
        });
        expect(result.showAdvanced).toBe(true);
        expect(result.maxFeeThreshold.toString()).toBe('110');
        expect(result.maxPriortyFeeThreshold.toString()).toBe('11');
      },
    );
  });
});
