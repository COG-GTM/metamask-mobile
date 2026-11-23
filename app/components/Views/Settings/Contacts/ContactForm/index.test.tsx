import React from 'react';
import { shallow } from 'enzyme';
import ContactFormComponent from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../../util/test/initial-root-state';

const ContactForm = ContactFormComponent as unknown as React.ComponentType<
  Record<string, unknown>
>;


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
        <ContactForm />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
