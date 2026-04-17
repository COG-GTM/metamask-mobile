import React from 'react';
import Contacts from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../util/test/initial-root-state';

import { render } from '@testing-library/react-native';
const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);

describe('Contacts', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <Contacts />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
