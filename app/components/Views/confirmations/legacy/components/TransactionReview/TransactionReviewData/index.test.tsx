import React from 'react';
import TransactionReviewData from '.';
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
    transaction: {
      data: '',
    },
    value: '',
    from: '0x1',
    gas: '',
    gasPrice: '',
    to: '0x2',
    selectedAsset: undefined,
    assetType: undefined,
  },
};
const store = mockStore(initialState);

describe('TransactionReviewData', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <TransactionReviewData />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
