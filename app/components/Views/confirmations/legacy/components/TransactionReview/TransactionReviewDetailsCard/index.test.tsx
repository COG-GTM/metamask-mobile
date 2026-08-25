import React from 'react';
import TransactionReviewDetailsCardBase from '.';
import { shallow } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../../../../util/test/initial-root-state';

// TODO: Replace "any" with type
const TransactionReviewDetailsCard =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TransactionReviewDetailsCardBase as unknown as React.ComponentType<any>;

const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);

describe('TransactionReviewDetailsCard', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <TransactionReviewDetailsCard />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
