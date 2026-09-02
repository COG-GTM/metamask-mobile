import React from 'react';
import { shallow } from 'enzyme';
import Contacts, { ContactsProps } from './';
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

describe('Contacts', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <Contacts {...({} as unknown as ContactsProps)} />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
