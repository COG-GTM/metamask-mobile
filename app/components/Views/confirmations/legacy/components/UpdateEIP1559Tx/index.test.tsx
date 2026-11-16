import React from 'react';
import { act } from '@testing-library/react-native';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import AppConstants from '../../../../../../core/AppConstants';
import {
  startGasPolling,
  stopGasPolling,
} from '../../../../../../core/GasPolling/GasPolling';
import UpdateEIP1559Tx from '.';

const SELECTED_ADDRESS = '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272';

const mockState = {
  accounts: { [SELECTED_ADDRESS]: { balance: '0x8ac7230489e80000' } },
  gasEstimateType: 'fee-market',
  gasFeeEstimates: {} as Record<string, unknown>,
};

jest.mock('../../../../../../core/GasPolling/GasPolling', () => ({
  startGasPolling: jest.fn().mockResolvedValue('poll-token'),
  stopGasPolling: jest.fn(),
}));

jest.mock('../../../../../../selectors/accountTrackerController', () => ({
  ...jest.requireActual('../../../../../../selectors/accountTrackerController'),
  selectAccounts: () => mockState.accounts,
}));

jest.mock('../../../../../../selectors/accountsController', () => ({
  ...jest.requireActual('../../../../../../selectors/accountsController'),
  selectSelectedInternalAccountFormattedAddress: () =>
    '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272',
}));

jest.mock('../../../../../../selectors/confirmTransaction', () => ({
  ...jest.requireActual('../../../../../../selectors/confirmTransaction'),
  selectGasFeeEstimates: () => mockState.gasFeeEstimates,
}));

jest.mock('../../../../../../selectors/gasFeeController', () => ({
  ...jest.requireActual('../../../../../../selectors/gasFeeController'),
  selectGasFeeControllerEstimateType: () => mockState.gasEstimateType,
}));

const mockEditGasFee1559Update = jest.fn();
jest.mock('../EditGasFee1559Update', () => (props: unknown) => {
  mockEditGasFee1559Update(props);
  return null;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lastEditProps = (): any =>
  mockEditGasFee1559Update.mock.calls[
    mockEditGasFee1559Update.mock.calls.length - 1
  ][0];

const existingGas = {
  maxFeePerGas: '100',
  maxPriorityFeePerGas: '10',
  isEIP1559Transaction: true,
};

const renderSheet = ({
  isCancel = false,
  medium = {
    suggestedMaxFeePerGas: '120',
    suggestedMaxPriorityFeePerGas: '12',
  },
  onSave = jest.fn(),
} = {}) => {
  mockState.gasFeeEstimates = {
    low: { suggestedMaxFeePerGas: '90', suggestedMaxPriorityFeePerGas: '9' },
    medium,
    high: { suggestedMaxFeePerGas: '300', suggestedMaxPriorityFeePerGas: '30' },
  };
  const result = renderWithProvider(
    <UpdateEIP1559Tx
      gas="0x5208"
      existingGas={existingGas}
      isCancel={isCancel}
      chainId="0x1"
      onCancel={jest.fn()}
      onSave={onSave}
    />,
    { state: { settings: { primaryCurrency: 'ETH' } } },
  );
  return { ...result, onSave };
};

describe('UpdateEIP1559Tx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.gasEstimateType = GAS_ESTIMATE_TYPES.FEE_MARKET;
  });

  it('starts gas polling on mount and stops it on unmount', () => {
    const { unmount } = renderSheet();
    expect(startGasPolling).toHaveBeenCalledTimes(1);
    unmount();
    expect(stopGasPolling).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    'uses the market medium thresholds when medium is above the floor (isCancel=%s)',
    (isCancel) => {
      renderSheet({ isCancel });
      const props = lastEditProps();
      expect(props.updateOption).toEqual({
        maxFeeThreshold: '120',
        maxPriortyFeeThreshold: '12',
        showAdvanced: false,
        isCancel,
      });
      expect(props.selectedGasValue).toBe(AppConstants.GAS_OPTIONS.MEDIUM);
      expect(props.ignoreOptions).toEqual([AppConstants.GAS_OPTIONS.LOW]);
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
  ])(
    'shows only the advanced view and stops updating when medium %s is below the floor',
    (_, medium) => {
      renderSheet({ medium });
      const props = lastEditProps();
      expect(props.updateOption.showAdvanced).toBe(true);
      expect(props.updateOption.maxFeeThreshold.toString()).toBe('110');
      expect(props.updateOption.maxPriortyFeeThreshold.toString()).toBe('11');
      expect(props.selectedGasValue).toBe('');
      expect(props.ignoreOptions).toEqual([
        AppConstants.GAS_OPTIONS.LOW,
        AppConstants.GAS_OPTIONS.MEDIUM,
      ]);
    },
  );

  it('does not compute thresholds for non fee-market estimates', () => {
    mockState.gasEstimateType = GAS_ESTIMATE_TYPES.LEGACY;
    renderSheet();
    expect(lastEditProps().updateOption).toBeUndefined();
  });

  it('attaches the validation error to the saved transaction', () => {
    const { onSave } = renderSheet({ isCancel: true });
    const gasTxn = {
      totalMaxHex: 'de0b6b3a7640000',
      suggestedMaxFeePerGas: '109',
      suggestedMaxPriorityFeePerGas: '20',
    };
    act(() => lastEditProps().onSave(gasTxn));
    expect(onSave).toHaveBeenCalledWith({
      ...gasTxn,
      error:
        'Max Fee must be at least 110 GWEI (50% higher than initial transaction)',
    });
  });

  it('saves without an error when the replacement fees are valid', () => {
    const { onSave } = renderSheet();
    act(() =>
      lastEditProps().onSave({
        totalMaxHex: 'de0b6b3a7640000',
        suggestedMaxFeePerGas: '120',
        suggestedMaxPriorityFeePerGas: '12',
      }),
    );
    expect(onSave.mock.calls[0][0].error).toBeUndefined();
  });
});
