/* eslint-disable react/jsx-pascal-case, react/prop-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports, import/no-commonjs */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

jest.mock('react-native-modal', () => {
  const RN = jest.requireActual('react-native');
  const MockModal = ({ isVisible, children }) =>
    isVisible ? <RN.View testID="modal">{children}</RN.View> : null;
  return { __esModule: true, default: MockModal };
});

jest.mock('react-native-keyboard-aware-scroll-view', () => {
  const RN = jest.requireActual('react-native');
  return {
    KeyboardAwareScrollView: ({ children }) => <RN.View>{children}</RN.View>,
  };
});

jest.mock('../../EditGasFeeLegacy', () => {
  const RN = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <RN.View testID="edit-gas-legacy" />,
  };
});

jest.mock('../../EditGasFee1559', () => {
  const RN = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <RN.View testID="edit-gas-1559" />,
  };
});

jest.mock('./InfoModal', () => {
  const RN = jest.requireActual('react-native');
  return { __esModule: true, default: () => <RN.View /> };
});

jest.mock('../../../../util/transactions', () => ({
  parseTransactionEIP1559: jest.fn(() => ({})),
  parseTransactionLegacy: jest.fn(() => ({})),
}));

import GasEditModal from './GasEditModal';

const mockStore = configureMockStore();
const store = mockStore({
  settings: { primaryCurrency: 'ETH' },
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: { chainId: '0x1', ticker: 'ETH' },
      },
      CurrencyRateController: {
        currentCurrency: 'usd',
        currencyRates: { ETH: { conversionRate: 1 } },
      },
    },
  },
});

const wrap = (ui) => <Provider store={store}>{ui}</Provider>;

const defaultProps = {
  dismiss: jest.fn(),
  gasEstimateType: 'fee-market',
  gasFeeEstimates: {
    high: {
      suggestedMaxFeePerGas: '10',
      suggestedMaxPriorityFeePerGas: '2',
    },
    medium: {
      suggestedMaxFeePerGas: '5',
      suggestedMaxPriorityFeePerGas: '1',
    },
    estimatedBaseFee: '3',
  },
  isVisible: true,
  onGasUpdate: jest.fn(),
  customGasFee: null,
  initialGasLimit: '21000',
  tradeGasLimit: '21000',
  isNativeAsset: true,
  tradeValue: '0x0',
  sourceAmount: '100',
  checkEnoughEthBalance: jest.fn(() => true),
};

describe('GasEditModal', () => {
  it('matches the snapshot', () => {
    const { toJSON } = render(wrap(<GasEditModal {...defaultProps} />));
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the EIP-1559 editor when gasEstimateType is fee-market', () => {
    const { getByTestId } = render(wrap(<GasEditModal {...defaultProps} />));
    expect(getByTestId('edit-gas-1559')).toBeTruthy();
  });

  it('renders the legacy gas editor for other estimate types', () => {
    const { getByTestId } = render(
      wrap(<GasEditModal {...defaultProps} gasEstimateType="legacy" />),
    );
    expect(getByTestId('edit-gas-legacy')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = render(
      wrap(<GasEditModal {...defaultProps} isVisible={false} />),
    );
    expect(queryByTestId('modal')).toBeNull();
  });
});
