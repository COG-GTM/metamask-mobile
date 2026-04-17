import React from 'react';
import TransactionEditor from '.';
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
    value: 0,
    data: '0x0',
    gas: 0,
    gasPrice: 1,
    from: '0x0',
    to: '0x1',
  },
  settings: {
    primaryCurrency: 'fiat',
  },
};
const store = mockStore(initialState);

describe('TransactionEditor', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <TransactionEditor />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
