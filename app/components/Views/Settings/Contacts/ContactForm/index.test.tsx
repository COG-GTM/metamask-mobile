import React from 'react';
import { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import { shallow } from 'enzyme';
import ContactForm from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../../util/test/initial-root-state';

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
const mockRoute = { params: {} } as unknown as RouteProp<
  Record<string, { onDelete: () => void }>,
  string
>;

describe('ContactForm', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ContactForm navigation={mockNavigation} route={mockRoute} />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
