import React, { ComponentType } from 'react';
import { shallow } from 'enzyme';
import ContactForm from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../../util/test/initial-root-state';

const ContactFormScreen = ContactForm as unknown as ComponentType;

const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);

describe('ContactForm', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ContactFormScreen />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
