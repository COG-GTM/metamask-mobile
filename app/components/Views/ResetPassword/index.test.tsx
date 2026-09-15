import React, { ComponentType } from 'react';
import { shallow } from 'enzyme';
import ChoosePasswordComponent from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../util/test/initial-root-state';

const ChoosePassword = ChoosePasswordComponent as unknown as ComponentType;

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

describe('ChoosePassword', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ChoosePassword />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
