import React from 'react';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { shallow } from 'enzyme';
import Contacts from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../util/test/initial-root-state';

const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);
const mockNavigation = {
  setOptions: jest.fn(),
  navigate: jest.fn(),
  setParams: jest.fn(),
  pop: jest.fn(),
} as unknown as NavigationProp<ParamListBase> & { pop: () => void };

describe('Contacts', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <Contacts navigation={mockNavigation} />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
