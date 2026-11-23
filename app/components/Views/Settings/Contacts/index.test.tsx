import React from 'react';
import { shallow } from 'enzyme';
import ContactsComponent from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../util/test/initial-root-state';

const Contacts = ContactsComponent as unknown as React.ComponentType<
  Record<string, unknown>
>;


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
        <Contacts />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
