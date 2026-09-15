import React, { ComponentType } from 'react';
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

// The shallow snapshot renders the card without any of its required props.
const TransactionReviewDetailsCardWithoutProps =
  TransactionReviewDetailsCard as unknown as ComponentType;

describe('TransactionReviewDetailsCard', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <TransactionReviewDetailsCardWithoutProps />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
