import React from 'react';
import TransactionReviewInformation from '.';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../../../../util/test/initial-root-state';

import { render } from '@testing-library/react-native';
const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
  transaction: {
    value: '',
    data: '',
    from: '0x1',
    gas: '',
    gasPrice: '',
    to: '0x2',
    selectedAsset: undefined,
    assetType: undefined,
  },
  settings: {
    primaryCurrency: 'ETH',
  },
  fiatOrders: {
    networks: [
      {
        active: true,
        chainId: 1,
        chainName: 'Ethereum Mainnet',
        nativeTokenSupported: true,
      },
    ],
  },
};
const store = mockStore(initialState);

describe('TransactionReviewInformation', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <TransactionReviewInformation EIP1559GasData={{}} />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
