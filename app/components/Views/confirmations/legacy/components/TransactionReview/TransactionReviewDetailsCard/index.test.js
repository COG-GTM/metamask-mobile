import React from 'react';
import TransactionReviewDetailsCard from '.';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../../../../util/test/initial-root-state';

import { render } from '@testing-library/react-native';
const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);

describe('TransactionReviewDetailsCard', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <TransactionReviewDetailsCard />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
