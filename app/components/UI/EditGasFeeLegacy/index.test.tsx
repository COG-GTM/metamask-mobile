import { shallow } from 'enzyme';
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';

import EditGasFeeLegacy from './';
import { strings } from '../../../../locales/i18n';
import { useMetrics } from '../../../components/hooks/useMetrics';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import renderWithProvider from '../../../util/test/renderWithProvider';

jest.mock('../../../components/hooks/useMetrics');

const GAS_PRICE_LOW = strings('edit_gas_fee_eip1559.gas_price_low');
const GAS_PRICE_HIGH = strings('edit_gas_fee_eip1559.gas_price_high');

const gasFee = {
  maxWaitTimeEstimate: 150000,
  minWaitTimeEstimate: 0,
  suggestedGasLimit: '21000',
  suggestedGasPrice: '10',
};

const renderEditGasFeeLegacy = (
  props: Partial<React.ComponentProps<typeof EditGasFeeLegacy>> = {},
) => {
  const onChange = jest.fn();
  renderWithProvider(
    <EditGasFeeLegacy
      gasFee={gasFee}
      onChange={onChange}
      onSave={jest.fn()}
      onCancel={jest.fn()}
      view={'Transfer'}
      {...props}
    />,
  );
  return { onChange };
};

const changeGasPrice = (value: string) =>
  fireEvent.changeText(
    screen.getByDisplayValue(gasFee.suggestedGasPrice),
    value,
  );

describe('EditGasFeeLegacy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMetrics as jest.MockedFn<typeof useMetrics>).mockReturnValue({
      trackEvent: jest.fn(),
      createEventBuilder: MetricsEventBuilder.createEventBuilder,
    } as unknown as ReturnType<typeof useMetrics>);
  });

  it('should render correctly', () => {
    const wrapper = shallow(
      <EditGasFeeLegacy
        gasFee={{
          maxWaitTimeEstimate: 150000,
          minWaitTimeEstimate: 0,
          suggestedGasLimit: '21000',
          suggestedGasPrice: '10',
        }}
        view={''}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });

  describe('rendering', () => {
    const gasOptions = { low: '10', medium: '20', high: '30' };

    it('renders the low/medium/high selector for LEGACY estimates', () => {
      renderEditGasFeeLegacy({
        gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
        gasOptions,
        selected: 'medium',
      });

      expect(
        screen.getByText(strings('edit_gas_fee_eip1559.low')),
      ).toBeOnTheScreen();
      expect(
        screen.getByText(strings('edit_gas_fee_eip1559.medium')),
      ).toBeOnTheScreen();
      expect(
        screen.getByText(strings('edit_gas_fee_eip1559.high')),
      ).toBeOnTheScreen();
    });

    it('renders the warning and error props', () => {
      renderEditGasFeeLegacy({
        gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
        gasOptions,
        warning: 'Network is busy',
        error: 'Insufficient funds',
      });

      expect(screen.getByText('Network is busy')).toBeOnTheScreen();
      expect(screen.getByText('Insufficient funds')).toBeOnTheScreen();
    });
  });

  describe('gas price validation with LEGACY estimates', () => {
    // gasPrice is intentionally inconsistent with low/high so that reading the
    // eth_gasPrice source instead of the legacy one changes the outcome.
    const gasOptions = { low: '10', medium: '20', high: '30', gasPrice: '50' };
    const renderLegacy = (
      props: Partial<React.ComponentProps<typeof EditGasFeeLegacy>> = {},
    ) =>
      renderEditGasFeeLegacy({
        gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
        gasOptions,
        ...props,
      });

    it('warns that the gas price is low when below the low estimate', () => {
      const { onChange } = renderLegacy();

      changeGasPrice('9.99');

      expect(screen.getByText(GAS_PRICE_LOW)).toBeOnTheScreen();
      expect(screen.queryByText(GAS_PRICE_HIGH)).toBeNull();
      expect(onChange).toHaveBeenLastCalledWith(
        { ...gasFee, suggestedGasPrice: '9.99' },
        null,
      );
    });

    it('warns that the gas price is high when above 1.5x the high estimate', () => {
      const { onChange } = renderLegacy();

      changeGasPrice('45.01');

      expect(screen.getByText(GAS_PRICE_HIGH)).toBeOnTheScreen();
      expect(screen.queryByText(GAS_PRICE_LOW)).toBeNull();
      expect(onChange).toHaveBeenLastCalledWith(
        { ...gasFee, suggestedGasPrice: '45.01' },
        null,
      );
    });

    it.each(['10', '40', '45'])(
      'shows no warning for %s (between the low estimate and 1.5x high, inclusive)',
      (value) => {
        const { onChange } = renderLegacy();

        changeGasPrice(value);

        expect(screen.queryByText(GAS_PRICE_LOW)).toBeNull();
        expect(screen.queryByText(GAS_PRICE_HIGH)).toBeNull();
        expect(onChange).toHaveBeenLastCalledWith(
          { ...gasFee, suggestedGasPrice: value },
          null,
        );
      },
    );

    it('compares against warningMinimumEstimateOption for the low bound', () => {
      renderLegacy({ warningMinimumEstimateOption: 'medium' });

      changeGasPrice('15');
      expect(screen.getByText(GAS_PRICE_LOW)).toBeOnTheScreen();

      changeGasPrice('20');
      expect(screen.queryByText(GAS_PRICE_LOW)).toBeNull();
    });

    it('clears a previous warning once the value is back in range', () => {
      renderLegacy();

      changeGasPrice('1');
      expect(screen.getByText(GAS_PRICE_LOW)).toBeOnTheScreen();

      changeGasPrice('100');
      expect(screen.queryByText(GAS_PRICE_LOW)).toBeNull();
      expect(screen.getByText(GAS_PRICE_HIGH)).toBeOnTheScreen();

      changeGasPrice('20');
      expect(screen.queryByText(GAS_PRICE_LOW)).toBeNull();
      expect(screen.queryByText(GAS_PRICE_HIGH)).toBeNull();
    });

    it('normalizes a comma decimal separator before validating and emitting', () => {
      const { onChange } = renderLegacy();

      changeGasPrice('9,5');

      expect(screen.getByText(GAS_PRICE_LOW)).toBeOnTheScreen();
      expect(onChange).toHaveBeenLastCalledWith(
        { ...gasFee, suggestedGasPrice: '9.5' },
        null,
      );
    });

    it('clears the warning and emits the option price when an option is selected', () => {
      const { onChange } = renderLegacy();

      changeGasPrice('1');
      expect(screen.getByText(GAS_PRICE_LOW)).toBeOnTheScreen();

      fireEvent.press(screen.getByText(strings('edit_gas_fee_eip1559.high')));

      expect(screen.queryByText(GAS_PRICE_LOW)).toBeNull();
      expect(onChange).toHaveBeenLastCalledWith(
        { ...gasFee, suggestedGasPrice: '30' },
        'high',
      );
    });
  });

  describe('gas price validation with ETH_GASPRICE estimates', () => {
    // low/high are intentionally inconsistent with gasPrice so that reading
    // the legacy source instead of gasPrice changes the outcome.
    const gasOptions = { gasPrice: '20', low: '1', high: '100' };
    const renderEthGasPrice = (
      props: Partial<React.ComponentProps<typeof EditGasFeeLegacy>> = {},
    ) =>
      renderEditGasFeeLegacy({
        gasEstimateType: GAS_ESTIMATE_TYPES.ETH_GASPRICE,
        gasOptions,
        ...props,
      });

    it('warns that the gas price is low when below gasPrice', () => {
      const { onChange } = renderEthGasPrice();

      changeGasPrice('5');

      expect(screen.getByText(GAS_PRICE_LOW)).toBeOnTheScreen();
      expect(onChange).toHaveBeenLastCalledWith(
        { ...gasFee, suggestedGasPrice: '5' },
        null,
      );
    });

    it('warns that the gas price is high when above 1.5x gasPrice', () => {
      const { onChange } = renderEthGasPrice();

      changeGasPrice('31');

      expect(screen.getByText(GAS_PRICE_HIGH)).toBeOnTheScreen();
      expect(onChange).toHaveBeenLastCalledWith(
        { ...gasFee, suggestedGasPrice: '31' },
        null,
      );
    });

    it.each(['20', '25', '30'])(
      'shows no warning for %s (between gasPrice and 1.5x gasPrice, inclusive)',
      (value) => {
        const { onChange } = renderEthGasPrice();

        changeGasPrice(value);

        expect(screen.queryByText(GAS_PRICE_LOW)).toBeNull();
        expect(screen.queryByText(GAS_PRICE_HIGH)).toBeNull();
        expect(onChange).toHaveBeenLastCalledWith(
          { ...gasFee, suggestedGasPrice: value },
          null,
        );
      },
    );

    it('clears a previous warning once the value is back in range', () => {
      renderEthGasPrice();

      changeGasPrice('31');
      expect(screen.getByText(GAS_PRICE_HIGH)).toBeOnTheScreen();

      changeGasPrice('22');
      expect(screen.queryByText(GAS_PRICE_HIGH)).toBeNull();
      expect(screen.queryByText(GAS_PRICE_LOW)).toBeNull();
    });

    it('does not render the basic low/medium/high selector', () => {
      renderEthGasPrice();

      expect(
        screen.queryByText(strings('edit_gas_fee_eip1559.advanced_options')),
      ).toBeNull();
      expect(
        screen.queryByText(strings('edit_gas_fee_eip1559.high')),
      ).toBeNull();
    });

    it('does not warn when no estimates are available', () => {
      const { onChange } = renderEthGasPrice({ gasOptions: undefined });

      changeGasPrice('0.5');
      changeGasPrice('1000');

      expect(screen.queryByText(GAS_PRICE_LOW)).toBeNull();
      expect(screen.queryByText(GAS_PRICE_HIGH)).toBeNull();
      expect(onChange).toHaveBeenLastCalledWith(
        { ...gasFee, suggestedGasPrice: '1000' },
        null,
      );
    });
  });
});
