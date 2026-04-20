/* eslint-disable react/jsx-pascal-case, react/prop-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports, import/no-commonjs */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

jest.mock('react-native-modal', () => {
  const RN = jest.requireActual('react-native');
  const MockModal = ({ isVisible, children }) =>
    isVisible ? <RN.View testID="modal">{children}</RN.View> : null;
  return { __esModule: true, default: MockModal };
});

jest.mock('./Ratio', () => {
  const RN = jest.requireActual('react-native');
  return { __esModule: true, default: () => <RN.View testID="ratio" /> };
});

jest.mock('../../../../reducers/swaps', () => ({
  selectSwapsQuoteValues: jest.fn(() => ({
    agg1: { overallValueOfQuote: 100, ethFee: '0.01' },
    agg2: { overallValueOfQuote: 90, ethFee: '0.02' },
  })),
}));

import QuotesModal from './QuotesModal';

const mockStore = configureMockStore();
const store = mockStore({
  settings: { showFiatOnTestnets: false, primaryCurrency: 'ETH' },
  engine: {
    backgroundState: {
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            nativeCurrency: 'ETH',
            rpcEndpoints: [
              { networkClientId: 'mainnet', type: 'infura', url: 'https://x' },
            ],
            defaultRpcEndpointIndex: 0,
          },
        },
      },
      CurrencyRateController: {
        currentCurrency: 'usd',
        currencyRates: { ETH: { conversionRate: 2000 } },
      },
    },
  },
});

const wrap = (ui) => <Provider store={store}>{ui}</Provider>;

const defaultProps = {
  isVisible: true,
  toggleModal: jest.fn(),
  quotes: [
    {
      aggregator: 'agg1',
      sourceAmount: '1000000',
      destinationAmount: '1000000000000000000',
      slippage: 0.5,
      aggType: 'AGG',
    },
    {
      aggregator: 'agg2',
      sourceAmount: '1000000',
      destinationAmount: '900000000000000000',
      slippage: 0.5,
      aggType: 'AGG',
    },
  ],
  selectedQuote: 'agg1',
  sourceToken: { symbol: 'USDC', decimals: 6 },
  destinationToken: { symbol: 'ETH', decimals: 18 },
  ticker: 'ETH',
  showOverallValue: true,
  multiLayerL1ApprovalFeeTotal: null,
};

describe('QuotesModal', () => {
  it('matches the snapshot when visible', () => {
    const { toJSON } = render(wrap(<QuotesModal {...defaultProps} />));
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the modal when visible', () => {
    const { getByTestId } = render(wrap(<QuotesModal {...defaultProps} />));
    expect(getByTestId('modal')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = render(
      wrap(<QuotesModal {...defaultProps} isVisible={false} />),
    );
    expect(queryByTestId('modal')).toBeNull();
  });
});
