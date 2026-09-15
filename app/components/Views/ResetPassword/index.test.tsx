import React, { ComponentType } from 'react';
import { shallow } from 'enzyme';
import ChoosePassword from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../util/test/initial-root-state';

const ChoosePasswordScreen = ChoosePassword as unknown as ComponentType;

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
        <ChoosePasswordScreen />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
