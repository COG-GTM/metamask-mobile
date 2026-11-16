import React from 'react';
import { TextInput } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';

import { backgroundState } from '../../../../../../util/test/initial-root-state';
import renderWithProvider, {
  DeepPartial,
} from '../../../../../../util/test/renderWithProvider';
import EditGasFeeLegacyUpdate from '.';
import { RootState } from '../../../../../../reducers';

const mockInitialState: (
  txnType?: 'none' | 'eth_gasPrice' | 'fee-market' | 'legacy' | undefined,
) => DeepPartial<RootState> = (txnType = 'none') => ({
  engine: {
    backgroundState: {
      ...backgroundState,
      GasFeeController: {
        gasEstimateType: txnType,
      },
    },
  },
});

const selectedGasObjectForFeeMarket = {
  legacyGasLimit: undefined,
  suggestedMaxFeePerGas: '10',
};

const selectedGasObjectForLegacy = {
  legacyGasLimit: undefined,
  suggestedGasPrice: '3',
};

const sharedProps = {
  view: 'Transaction',
  analyticsParams: undefined,
  onSave: () => undefined,
  error: undefined,
  onCancel: () => undefined,
  onUpdatingValuesStart: () => undefined,
  onUpdatingValuesEnd: () => undefined,
  animateOnChange: undefined,
  isAnimating: true,
  hasDappSuggestedGas: false,
  warning: 'test',
  onlyGas: true,
  chainId: '0x1',
};

const editGasFeeLegacyForFeeMarket = {
  ...sharedProps,
  selectedGasObject: selectedGasObjectForFeeMarket,
};

const editGasFeeLegacyForLegacy = {
  ...sharedProps,
  selectedGasObject: selectedGasObjectForLegacy,
};

const GAS_PRICE_LOW_WARNING = 'Gas price is low for current network conditions';
const GAS_PRICE_HIGH_WARNING = 'Gas price is higher than necessary';

const mockStateWithEstimates = (
  gasEstimateType: string,
  gasFeeEstimates: Record<string, string>,
): DeepPartial<RootState> => ({
  engine: {
    backgroundState: {
      ...backgroundState,
      GasFeeController: {
        gasEstimateType,
        gasFeeEstimates,
      },
    },
  },
});

// low = 20, high = 40 -> warn below 20 and above 40 * 1.5 = 60
const legacyEstimates = { low: '20', medium: '30', high: '40' };
// gasPrice = 20 -> warn below 20 and above 20 * 1.5 = 30
const ethGasPriceEstimates = { gasPrice: '20' };

describe('EditGasFeeLegacyUpdate', () => {
  it('should match snapshot', async () => {
    const initialState = mockInitialState();
    const container = renderWithProvider(
      <EditGasFeeLegacyUpdate {...editGasFeeLegacyForFeeMarket} />,
      { state: initialState },
    );
    expect(container).toMatchSnapshot();
  });

  it('should calculate the correct gas transaction fee for 1559 transaction', async () => {
    const initialState = mockInitialState('fee-market');
    const { findByText } = renderWithProvider(
      <EditGasFeeLegacyUpdate {...editGasFeeLegacyForFeeMarket} />,
      { state: initialState },
    );

    expect(await findByText('~ 0.00021 ETH')).toBeDefined();
  });

  it('should calculate the correct gas transaction fee for legacy transaction', async () => {
    const initialState = mockInitialState('legacy');
    const { findByText } = renderWithProvider(
      <EditGasFeeLegacyUpdate {...editGasFeeLegacyForLegacy} />,
      { state: initialState },
    );

    expect(await findByText('~ 0.00006 ETH')).toBeDefined();
  });

  describe('gas price warnings', () => {
    const renderAndEnterGasPrice = (
      gasEstimateType: string,
      gasFeeEstimates: Record<string, string>,
      gasPrice: string,
    ) => {
      const utils = renderWithProvider(
        <EditGasFeeLegacyUpdate {...editGasFeeLegacyForLegacy} />,
        { state: mockStateWithEstimates(gasEstimateType, gasFeeEstimates) },
      );
      // Inputs render in order: gas limit, gas price
      const gasPriceInput = utils.UNSAFE_getAllByType(TextInput)[1];
      fireEvent.changeText(gasPriceInput, gasPrice);
      return utils;
    };

    it.each([
      [GAS_ESTIMATE_TYPES.LEGACY, '19', legacyEstimates],
      [GAS_ESTIMATE_TYPES.ETH_GASPRICE, '19', ethGasPriceEstimates],
    ])(
      'shows the low gas price warning for %s when the gas price %s is below the low estimate',
      (gasEstimateType, gasPrice, gasFeeEstimates) => {
        const { getByText, queryByText } = renderAndEnterGasPrice(
          gasEstimateType,
          gasFeeEstimates,
          gasPrice,
        );

        expect(getByText(GAS_PRICE_LOW_WARNING)).toBeOnTheScreen();
        expect(queryByText(GAS_PRICE_HIGH_WARNING)).not.toBeOnTheScreen();
      },
    );

    it.each([
      [GAS_ESTIMATE_TYPES.LEGACY, '61', legacyEstimates],
      [GAS_ESTIMATE_TYPES.ETH_GASPRICE, '31', ethGasPriceEstimates],
    ])(
      'shows the high gas price warning for %s when the gas price %s is above 1.5x the high estimate',
      (gasEstimateType, gasPrice, gasFeeEstimates) => {
        const { getByText, queryByText } = renderAndEnterGasPrice(
          gasEstimateType,
          gasFeeEstimates,
          gasPrice,
        );

        expect(getByText(GAS_PRICE_HIGH_WARNING)).toBeOnTheScreen();
        expect(queryByText(GAS_PRICE_LOW_WARNING)).not.toBeOnTheScreen();
      },
    );

    it.each([
      [GAS_ESTIMATE_TYPES.LEGACY, '20', legacyEstimates],
      [GAS_ESTIMATE_TYPES.LEGACY, '40', legacyEstimates],
      [GAS_ESTIMATE_TYPES.LEGACY, '60', legacyEstimates],
      [GAS_ESTIMATE_TYPES.ETH_GASPRICE, '20', ethGasPriceEstimates],
      [GAS_ESTIMATE_TYPES.ETH_GASPRICE, '30', ethGasPriceEstimates],
    ])(
      'shows no gas price warning for %s when the gas price %s is in range',
      (gasEstimateType, gasPrice, gasFeeEstimates) => {
        const { queryByText } = renderAndEnterGasPrice(
          gasEstimateType,
          gasFeeEstimates,
          gasPrice,
        );

        expect(queryByText(GAS_PRICE_LOW_WARNING)).not.toBeOnTheScreen();
        expect(queryByText(GAS_PRICE_HIGH_WARNING)).not.toBeOnTheScreen();
      },
    );

    it('clears the warning when the gas price returns to the valid range', () => {
      const { getByText, queryByText, UNSAFE_getAllByType } =
        renderAndEnterGasPrice(
          GAS_ESTIMATE_TYPES.LEGACY,
          legacyEstimates,
          '19',
        );
      expect(getByText(GAS_PRICE_LOW_WARNING)).toBeOnTheScreen();

      fireEvent.changeText(UNSAFE_getAllByType(TextInput)[1], '30');

      expect(queryByText(GAS_PRICE_LOW_WARNING)).not.toBeOnTheScreen();
      expect(queryByText(GAS_PRICE_HIGH_WARNING)).not.toBeOnTheScreen();
    });
  });
});
