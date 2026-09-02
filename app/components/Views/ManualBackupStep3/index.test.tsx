import React from 'react';
import ManualBackupStep3 from './';
import configureMockStore from 'redux-mock-store';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

const navigationMock = {
  setOptions: jest.fn(),
  navigate: jest.fn(),
  pop: jest.fn(),
} as unknown as NavigationProp<ParamListBase> & { pop: () => void };

const mockStore = configureMockStore();
const initialState = {};
const store = mockStore(initialState);

describe('ManualBackupStep3', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ManualBackupStep3 navigation={navigationMock} route={{ params: {} }} />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
