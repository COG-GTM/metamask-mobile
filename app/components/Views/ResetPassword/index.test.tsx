import React, { ComponentType } from 'react';
import { shallow } from 'enzyme';
import ChoosePassword from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../util/test/initial-root-state';

const mockStore = configureMockStore();
const initialState = {
  user: {
    passwordSet: true,
    seedphraseBackedUp: false,
  },
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);

const ResetPasswordComponent = ChoosePassword as unknown as ComponentType;

describe('ChoosePassword', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ResetPasswordComponent />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
