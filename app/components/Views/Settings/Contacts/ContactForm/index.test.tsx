import React from 'react';
import ContactForm from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../../util/test/initial-root-state';

import { render } from '@testing-library/react-native';
const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);

describe('ContactForm', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <ContactForm />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
