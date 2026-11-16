import React from 'react';
import { fireEvent } from '@testing-library/react-native';

import { backgroundState } from '../../../../../../util/test/initial-root-state';
import renderWithProvider, {
  DeepPartial,
} from '../../../../../../util/test/renderWithProvider';
import { RootState } from '../../../../../../reducers';
import { strings } from '../../../../../../../locales/i18n';
import EditGasFee1559Update from '.';

const gasFeeEstimates = {
  low: { suggestedMaxPriorityFeePerGas: '1', suggestedMaxFeePerGas: '20' },
  medium: { suggestedMaxPriorityFeePerGas: '1.5', suggestedMaxFeePerGas: '30' },
  high: { suggestedMaxPriorityFeePerGas: '2', suggestedMaxFeePerGas: '40' },
};

const mockInitialState: DeepPartial<RootState> = {
  settings: {},
  transaction: {
    selectedAsset: { isETH: true },
    transaction: { gas: '0x5208', gasPrice: '0x0', data: '0x' },
  },
  engine: {
    backgroundState: {
      ...backgroundState,
      GasFeeController: {
        gasEstimateType: 'fee-market',
        gasFeeEstimates,
      },
    },
  },
};

const INITIAL_PRIORITY_FEE = '1.5';
const INITIAL_MAX_FEE = '30';

const selectedGasObject = {
  suggestedMaxFeePerGas: INITIAL_MAX_FEE,
  suggestedMaxPriorityFeePerGas: INITIAL_PRIORITY_FEE,
  suggestedGasLimit: '21000',
};

const PRIORITY_FLOOR = '2.5';
const MAX_FEE_FLOOR = '45';

const createUpdateOption = (isCancel: boolean) => ({
  isCancel,
  maxPriortyFeeThreshold: PRIORITY_FLOOR,
  maxFeeThreshold: MAX_FEE_FLOOR,
  showAdvanced: true,
});

const mockOnChange = jest.fn();
const mockOnSave = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderComponent = (props: Record<string, any> = {}) =>
  renderWithProvider(
    <EditGasFee1559Update
      selectedGasValue={undefined}
      gasOptions={gasFeeEstimates}
      primaryCurrency="ETH"
      chainId="0x1"
      onCancel={jest.fn()}
      onChange={mockOnChange}
      onSave={mockOnSave}
      error={undefined}
      warning={undefined}
      dappSuggestedGas={false}
      ignoreOptions={[]}
      updateOption={undefined}
      extendOptions={{}}
      recommended={undefined}
      warningMinimumEstimateOption="low"
      suggestedEstimateOption="medium"
      animateOnChange={false}
      isAnimating={false}
      analyticsParams={{ view: 'test' }}
      selectedGasObject={selectedGasObject}
      onlyGas={false}
      {...props}
    />,
    { state: mockInitialState },
  );

type RenderResult = ReturnType<typeof renderComponent>;

const typeInto = (
  { getByDisplayValue }: RenderResult,
  currentValue: string,
  newValue: string,
) => fireEvent.changeText(getByDisplayValue(currentValue), newValue);

const allFeeErrors = () => [
  strings('edit_gas_fee_eip1559.max_priority_fee_low'),
  strings('edit_gas_fee_eip1559.max_priority_fee_high'),
  strings('edit_gas_fee_eip1559.max_fee_low'),
  strings('edit_gas_fee_eip1559.max_fee_high'),
  strings('edit_gas_fee_eip1559.max_priority_fee_cancel_low', {
    cancel_value: PRIORITY_FLOOR,
  }),
  strings('edit_gas_fee_eip1559.max_priority_fee_speed_up_low', {
    speed_up_floor_value: PRIORITY_FLOOR,
  }),
  strings('edit_gas_fee_eip1559.max_fee_cancel_low', {
    cancel_value: MAX_FEE_FLOOR,
  }),
  strings('edit_gas_fee_eip1559.max_fee_speed_up_low', {
    speed_up_floor_value: MAX_FEE_FLOOR,
  }),
];

const expectNoFeeErrors = ({ queryByText }: RenderResult) => {
  allFeeErrors().forEach((message) => expect(queryByText(message)).toBeNull());
};

describe('EditGasFee1559Update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens the advanced section and validates input typed there', () => {
    const result = renderComponent({ selectedGasValue: 'medium' });

    expect(result.queryByDisplayValue(INITIAL_PRIORITY_FEE)).toBeNull();

    fireEvent.press(
      result.getByText(strings('edit_gas_fee_eip1559.advanced_options')),
    );
    typeInto(result, INITIAL_PRIORITY_FEE, '0.5');

    expect(
      result.getByText(strings('edit_gas_fee_eip1559.max_priority_fee_low')),
    ).toBeOnTheScreen();
  });

  describe('max priority fee', () => {
    it.each([
      ['below the low estimate', '0.5', 'max_priority_fee_low'],
      ['above 1.5x the high estimate', '3.01', 'max_priority_fee_high'],
    ])('shows a warning when the value is %s', (_, value, errorKey) => {
      const result = renderComponent();

      typeInto(result, INITIAL_PRIORITY_FEE, value);

      expect(
        result.getByText(strings(`edit_gas_fee_eip1559.${errorKey}`)),
      ).toBeOnTheScreen();
      expect(result.getByDisplayValue(value)).toBeOnTheScreen();
      expect(mockOnChange).toHaveBeenLastCalledWith(null);
    });

    it.each([
      ['equal to the low estimate', '1'],
      ['between the estimates', '2'],
      ['equal to 1.5x the high estimate', '3'],
    ])('shows no warning when the value is %s', (_, value) => {
      const result = renderComponent();

      typeInto(result, INITIAL_PRIORITY_FEE, value);

      expectNoFeeErrors(result);
      expect(result.getByDisplayValue(value)).toBeOnTheScreen();
    });

    it('clears a previous warning once a valid value is entered', () => {
      const result = renderComponent();
      const lowMessage = strings('edit_gas_fee_eip1559.max_priority_fee_low');

      typeInto(result, INITIAL_PRIORITY_FEE, '0.5');
      expect(result.getByText(lowMessage)).toBeOnTheScreen();

      typeInto(result, '0.5', '2');
      expect(result.queryByText(lowMessage)).toBeNull();
    });

    it.each([
      [true, 'max_priority_fee_cancel_low', { cancel_value: PRIORITY_FLOOR }],
      [
        false,
        'max_priority_fee_speed_up_low',
        { speed_up_floor_value: PRIORITY_FLOOR },
      ],
    ])(
      'shows the update floor warning when isCancel is %s',
      (isCancel, errorKey, params) => {
        const result = renderComponent({
          updateOption: createUpdateOption(isCancel),
        });

        typeInto(result, INITIAL_PRIORITY_FEE, '2');

        expect(
          result.getByText(strings(`edit_gas_fee_eip1559.${errorKey}`, params)),
        ).toBeOnTheScreen();
        expect(
          result.queryByText(
            strings('edit_gas_fee_eip1559.max_priority_fee_low'),
          ),
        ).toBeNull();
      },
    );

    it('prefers the update floor warning over the low estimate warning', () => {
      const result = renderComponent({
        updateOption: createUpdateOption(false),
      });

      typeInto(result, INITIAL_PRIORITY_FEE, '0.5');

      expect(
        result.getByText(
          strings('edit_gas_fee_eip1559.max_priority_fee_speed_up_low', {
            speed_up_floor_value: PRIORITY_FLOOR,
          }),
        ),
      ).toBeOnTheScreen();
      expect(
        result.queryByText(
          strings('edit_gas_fee_eip1559.max_priority_fee_low'),
        ),
      ).toBeNull();
    });

    it('shows no warning at the update floor', () => {
      const result = renderComponent({
        updateOption: createUpdateOption(true),
      });

      typeInto(result, INITIAL_PRIORITY_FEE, PRIORITY_FLOOR);

      expectNoFeeErrors(result);
    });
  });

  describe('max fee', () => {
    it.each([
      ['below the low estimate', '10', 'max_fee_low'],
      ['above 1.5x the high estimate', '60.5', 'max_fee_high'],
    ])('shows a warning when the value is %s', (_, value, errorKey) => {
      const result = renderComponent();

      typeInto(result, INITIAL_MAX_FEE, value);

      expect(
        result.getByText(strings(`edit_gas_fee_eip1559.${errorKey}`)),
      ).toBeOnTheScreen();
      expect(result.getByDisplayValue(value)).toBeOnTheScreen();
      expect(mockOnChange).toHaveBeenLastCalledWith(null);
    });

    it.each([
      ['equal to the low estimate', '20'],
      ['between the estimates', '50'],
      ['equal to 1.5x the high estimate', '60'],
    ])('shows no warning when the value is %s', (_, value) => {
      const result = renderComponent();

      typeInto(result, INITIAL_MAX_FEE, value);

      expectNoFeeErrors(result);
      expect(result.getByDisplayValue(value)).toBeOnTheScreen();
    });

    it.each([
      [true, 'max_fee_cancel_low', { cancel_value: MAX_FEE_FLOOR }],
      [false, 'max_fee_speed_up_low', { speed_up_floor_value: MAX_FEE_FLOOR }],
    ])(
      'shows the update floor warning when isCancel is %s',
      (isCancel, errorKey, params) => {
        const result = renderComponent({
          updateOption: createUpdateOption(isCancel),
        });

        typeInto(result, INITIAL_MAX_FEE, '44');

        expect(
          result.getByText(strings(`edit_gas_fee_eip1559.${errorKey}`, params)),
        ).toBeOnTheScreen();
      },
    );

    it('prefers the update floor warning over the low estimate warning', () => {
      const result = renderComponent({
        updateOption: createUpdateOption(true),
      });

      typeInto(result, INITIAL_MAX_FEE, '10');

      expect(
        result.getByText(
          strings('edit_gas_fee_eip1559.max_fee_cancel_low', {
            cancel_value: MAX_FEE_FLOOR,
          }),
        ),
      ).toBeOnTheScreen();
      expect(
        result.queryByText(strings('edit_gas_fee_eip1559.max_fee_low')),
      ).toBeNull();
    });

    it('shows no warning at the update floor', () => {
      const result = renderComponent({
        updateOption: createUpdateOption(true),
      });

      typeInto(result, INITIAL_MAX_FEE, MAX_FEE_FLOOR);

      expectNoFeeErrors(result);
    });
  });

  it('does not show warnings when no estimates or floor are available', () => {
    const result = renderComponent({ gasOptions: {} });

    typeInto(result, INITIAL_PRIORITY_FEE, '0.01');
    typeInto(result, INITIAL_MAX_FEE, '9999');

    expectNoFeeErrors(result);
  });

  it('saves the typed fees as the new gas object', () => {
    const result = renderComponent();

    typeInto(result, INITIAL_PRIORITY_FEE, '2');
    typeInto(result, INITIAL_MAX_FEE, '50');
    fireEvent.press(result.getByText(strings('edit_gas_fee_eip1559.save')));

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    const [gasTransaction, newGasPriceObject] = mockOnSave.mock.calls[0];
    expect(newGasPriceObject).toEqual({
      suggestedMaxFeePerGas: '50',
      suggestedMaxPriorityFeePerGas: '2',
      suggestedGasLimit: '21000',
    });
    expect(gasTransaction).toEqual(
      expect.objectContaining({
        suggestedMaxFeePerGas: '50',
        suggestedMaxPriorityFeePerGas: '2',
        suggestedGasLimit: '21000',
      }),
    );
  });
});
