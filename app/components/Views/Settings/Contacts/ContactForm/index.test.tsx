import React from 'react';
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

const ContactFormView = ContactForm as unknown as React.ComponentType;

describe('ContactForm', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ContactFormView />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
