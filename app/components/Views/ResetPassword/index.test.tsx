import React from 'react';
import ChoosePassword from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../util/test/initial-root-state';

import { render } from '@testing-library/react-native';
const mockStore = configureMockStore();
const initialState = {
  user: {
    passwordSet: true,
    seedphraseBackedUp: false,
  },
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);

describe('ChoosePassword', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <ChoosePassword />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
