import React from 'react';
import type { ParamListBase } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import ManualBackupStep3 from './';
import configureMockStore from 'redux-mock-store';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';

const mockStore = configureMockStore();
const initialState = {};
const store = mockStore(initialState);
const navigation = {
  setOptions: jest.fn(),
  navigate: jest.fn(),
  reset: jest.fn(),
  pop: jest.fn(),
} as unknown as StackNavigationProp<ParamListBase>;

describe('ManualBackupStep3', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ManualBackupStep3 navigation={navigation} route={{ params: {} }} />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
