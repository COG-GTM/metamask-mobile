import React, { ComponentType } from 'react';
import { shallow } from 'enzyme';
import Contacts from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../util/test/initial-root-state';

const ContactsScreen = Contacts as unknown as ComponentType;

const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);

describe('Contacts', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ContactsScreen />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
