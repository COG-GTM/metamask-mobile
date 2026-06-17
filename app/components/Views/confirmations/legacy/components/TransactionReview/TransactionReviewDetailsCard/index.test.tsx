// TODO: Replace "any" with type
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import TransactionReviewDetailsCard from '.';
import { shallow } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../../../../util/test/initial-root-state';

const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);

const TransactionReviewDetailsCardTyped = TransactionReviewDetailsCard as any;

describe('TransactionReviewDetailsCard', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <TransactionReviewDetailsCardTyped />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
