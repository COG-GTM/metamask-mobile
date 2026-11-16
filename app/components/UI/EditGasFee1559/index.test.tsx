import { shallow } from 'enzyme';
import React from 'react';
import { fireEvent } from '@testing-library/react-native';

import EditGasFee1559 from './';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { strings } from '../../../../locales/i18n';
import { useMetrics } from '../../hooks/useMetrics';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import { MetaMetricsEvents } from '../../../core/Analytics';

jest.mock('../../hooks/useMetrics');

const mockTrackEvent = jest.fn();

const GAS_LIMIT = '21000';
const MAX_PRIORITY_FEE = '2';
const MAX_FEE = '50';

const gasFee = {
  maxWaitTimeEstimate: 150000,
  minWaitTimeEstimate: 0,
  suggestedGasLimit: GAS_LIMIT,
  suggestedMaxFeePerGas: MAX_FEE,
  suggestedMaxPriorityFeePerGas: MAX_PRIORITY_FEE,
};

const gasOptions = {
  low: { suggestedMaxPriorityFeePerGas: '1', suggestedMaxFeePerGas: '40' },
  medium: { suggestedMaxPriorityFeePerGas: '2', suggestedMaxFeePerGas: '50' },
  high: { suggestedMaxPriorityFeePerGas: '4', suggestedMaxFeePerGas: '60' },
};

type Props = Partial<React.ComponentProps<typeof EditGasFee1559>>;

const renderComponent = (props: Props = {}) => {
  const onChange = jest.fn();
  const onSave = jest.fn();
  const utils = renderWithProvider(
    <EditGasFee1559
      gasFee={gasFee}
      gasOptions={gasOptions}
      onChange={onChange}
      onSave={onSave}
      onCancel={jest.fn()}
      chainId={'0x1'}
      view={'Test'}
      {...props}
    />,
  );
  return { ...utils, onChange, onSave };
};

describe('EditGasFee1559', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMetrics as jest.Mock).mockReturnValue({
      trackEvent: mockTrackEvent,
      createEventBuilder: MetricsEventBuilder.createEventBuilder,
    });
  });

  it('should render correctly', () => {
    const wrapper = shallow(
      <EditGasFee1559
        gasFee={{
          maxWaitTimeEstimate: 150000,
          minWaitTimeEstimate: 0,
          suggestedMaxFeePerGas: '50',
          suggestedMaxPriorityFeePerGas: '2',
        }}
        view={''}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('hides the fee inputs until advanced options are opened when an option is selected', () => {
    const { queryByDisplayValue, getByText } = renderComponent({
      selected: 'medium',
    });

    expect(queryByDisplayValue(MAX_PRIORITY_FEE)).toBeNull();
    expect(queryByDisplayValue(MAX_FEE)).toBeNull();

    fireEvent.press(
      getByText(strings('edit_gas_fee_eip1559.advanced_options')),
    );

    expect(queryByDisplayValue(MAX_PRIORITY_FEE)).toBeTruthy();
    expect(queryByDisplayValue(MAX_FEE)).toBeTruthy();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEvents.GAS_ADVANCED_OPTIONS_CLICKED.category,
      }),
    );
  });

  describe('max priority fee validation', () => {
    it.each([
      [
        'below the cancel floor',
        { maxPriortyFeeThreshold: '3', isCancel: true },
        '2.5',
        strings('edit_gas_fee_eip1559.max_priority_fee_cancel_low', {
          cancel_value: '3',
        }),
      ],
      [
        'below the speed up floor',
        { maxPriortyFeeThreshold: '3', isCancel: false },
        '2.5',
        strings('edit_gas_fee_eip1559.max_priority_fee_speed_up_low', {
          speed_up_floor_value: '3',
        }),
      ],
      [
        'below the low estimate',
        undefined,
        '0.5',
        strings('edit_gas_fee_eip1559.max_priority_fee_low'),
      ],
      [
        'above 1.5x the high estimate',
        undefined,
        '6.1',
        strings('edit_gas_fee_eip1559.max_priority_fee_high'),
      ],
    ])(
      'shows an error when the value is %s',
      (_, updateOption, value, expectedError) => {
        const { getByDisplayValue, getByText, onChange } = renderComponent({
          updateOption,
        });

        fireEvent.changeText(getByDisplayValue(MAX_PRIORITY_FEE), value);

        expect(getByText(expectedError)).toBeTruthy();
        expect(onChange).toHaveBeenLastCalledWith(
          { ...gasFee, suggestedMaxPriorityFeePerGas: value },
          null,
        );
      },
    );

    it('prefers the replacement floor error over the low estimate error', () => {
      const { getByDisplayValue, getByText, queryByText } = renderComponent({
        updateOption: { maxPriortyFeeThreshold: '3', isCancel: false },
      });

      fireEvent.changeText(getByDisplayValue(MAX_PRIORITY_FEE), '0.5');

      expect(
        getByText(
          strings('edit_gas_fee_eip1559.max_priority_fee_speed_up_low', {
            speed_up_floor_value: '3',
          }),
        ),
      ).toBeTruthy();
      expect(
        queryByText(strings('edit_gas_fee_eip1559.max_priority_fee_low')),
      ).toBeNull();
    });

    it.each([
      ['equal to the replacement floor', '3'],
      ['equal to 1.5x the high estimate', '6'],
    ])('accepts a value %s', (_, value) => {
      const { getByDisplayValue, queryByText } = renderComponent({
        updateOption: { maxPriortyFeeThreshold: '3', isCancel: true },
      });

      fireEvent.changeText(getByDisplayValue(MAX_PRIORITY_FEE), value);

      expect(
        queryByText(
          strings('edit_gas_fee_eip1559.max_priority_fee_cancel_low', {
            cancel_value: '3',
          }),
        ),
      ).toBeNull();
      expect(
        queryByText(strings('edit_gas_fee_eip1559.max_priority_fee_high')),
      ).toBeNull();
    });

    it('clears the error once a valid value is entered', () => {
      const { getByDisplayValue, queryByText, onChange } = renderComponent();
      const lowError = strings('edit_gas_fee_eip1559.max_priority_fee_low');

      fireEvent.changeText(getByDisplayValue(MAX_PRIORITY_FEE), '0.5');
      expect(queryByText(lowError)).toBeTruthy();

      fireEvent.changeText(getByDisplayValue(MAX_PRIORITY_FEE), '3');
      expect(queryByText(lowError)).toBeNull();
      expect(onChange).toHaveBeenLastCalledWith(
        { ...gasFee, suggestedMaxPriorityFeePerGas: '3' },
        null,
      );
    });

    it('ignores missing estimates and floors', () => {
      const { getByDisplayValue, queryByText } = renderComponent({
        gasOptions: {},
      });

      fireEvent.changeText(getByDisplayValue(MAX_PRIORITY_FEE), '1000');
      expect(
        queryByText(strings('edit_gas_fee_eip1559.max_priority_fee_high')),
      ).toBeNull();
      fireEvent.changeText(getByDisplayValue(MAX_PRIORITY_FEE), '0.1');
      expect(
        queryByText(strings('edit_gas_fee_eip1559.max_priority_fee_low')),
      ).toBeNull();
    });
  });

  describe('max fee validation', () => {
    it.each([
      [
        'below the cancel floor',
        { maxFeeThreshold: '75', isCancel: true },
        '70',
        strings('edit_gas_fee_eip1559.max_fee_cancel_low', {
          cancel_value: '75',
        }),
      ],
      [
        'below the speed up floor',
        { maxFeeThreshold: '55', isCancel: false },
        '54',
        strings('edit_gas_fee_eip1559.max_fee_speed_up_low', {
          speed_up_floor_value: '55',
        }),
      ],
      [
        'below the low estimate',
        undefined,
        '39',
        strings('edit_gas_fee_eip1559.max_fee_low'),
      ],
      [
        'above 1.5x the high estimate',
        undefined,
        '91',
        strings('edit_gas_fee_eip1559.max_fee_high'),
      ],
    ])(
      'shows an error when the value is %s',
      (_, updateOption, value, expectedError) => {
        const { getByDisplayValue, getByText, onChange } = renderComponent({
          updateOption,
        });

        fireEvent.changeText(getByDisplayValue(MAX_FEE), value);

        expect(getByText(expectedError)).toBeTruthy();
        expect(onChange).toHaveBeenLastCalledWith(
          { ...gasFee, suggestedMaxFeePerGas: value },
          null,
        );
      },
    );

    it('uses warningMinimumEstimateOption for the low estimate', () => {
      const { getByDisplayValue, getByText } = renderComponent({
        warningMinimumEstimateOption: 'medium',
      });

      fireEvent.changeText(getByDisplayValue(MAX_FEE), '45');

      expect(
        getByText(strings('edit_gas_fee_eip1559.max_fee_low')),
      ).toBeTruthy();
    });

    it('clears the error once a valid value is entered', () => {
      const { getByDisplayValue, queryByText, onChange } = renderComponent();
      const highError = strings('edit_gas_fee_eip1559.max_fee_high');

      fireEvent.changeText(getByDisplayValue(MAX_FEE), '91');
      expect(queryByText(highError)).toBeTruthy();

      fireEvent.changeText(getByDisplayValue(MAX_FEE), '90');
      expect(queryByText(highError)).toBeNull();
      expect(onChange).toHaveBeenLastCalledWith(
        { ...gasFee, suggestedMaxFeePerGas: '90' },
        null,
      );
    });
  });

  it('clears fee errors and emits the option gas when an option is selected', () => {
    const { getByDisplayValue, getByText, queryByText, onChange } =
      renderComponent();
    const lowError = strings('edit_gas_fee_eip1559.max_fee_low');

    fireEvent.changeText(getByDisplayValue(MAX_FEE), '39');
    expect(queryByText(lowError)).toBeTruthy();

    fireEvent.press(getByText(strings('edit_gas_fee_eip1559.aggressive')));

    expect(queryByText(lowError)).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith(gasOptions.high, 'high');
  });

  it('calls onSave with the selected option and tracks GAS_FEE_CHANGED', () => {
    const { getByText, onSave } = renderComponent({ selected: 'medium' });

    fireEvent.press(getByText(strings('edit_gas_fee_eip1559.save')));

    expect(onSave).toHaveBeenCalledWith('medium');
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEvents.GAS_FEE_CHANGED.category,
        properties: expect.objectContaining({
          chain_id: '1',
          function_type: 'Test',
          gas_mode: 'Basic',
          speed_set: 'medium',
        }),
      }),
    );
  });

  it('calls onSave with null after a custom fee is entered', () => {
    const { getByDisplayValue, getByText, onSave } = renderComponent({
      selected: 'medium',
    });

    fireEvent.press(
      getByText(strings('edit_gas_fee_eip1559.advanced_options')),
    );
    fireEvent.changeText(getByDisplayValue(MAX_FEE), '55');
    fireEvent.press(getByText(strings('edit_gas_fee_eip1559.save')));

    expect(onSave).toHaveBeenCalledWith(null);
    expect(mockTrackEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: MetaMetricsEvents.GAS_FEE_CHANGED.category,
        properties: expect.objectContaining({ gas_mode: 'Advanced' }),
      }),
    );
  });
});
