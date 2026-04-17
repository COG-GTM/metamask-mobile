import React from 'react';
import ManualBackupStep3 from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { render } from '@testing-library/react-native';
const mockStore = configureMockStore();
const initialState = {};
const store = mockStore(initialState);

describe('ManualBackupStep3', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <ManualBackupStep3 />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
