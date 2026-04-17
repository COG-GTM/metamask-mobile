import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ManualBackupStep1 from './';
import { AppThemeKey } from '../../../util/theme/models';

import { render } from '@testing-library/react-native';
const mockStore = configureMockStore();
const initialState = {
  user: { appTheme: AppThemeKey.light },
};
const store = mockStore(initialState);

describe('ManualBackupStep1', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <ManualBackupStep1
          route={{
            params: {
              words: [
                'abstract',
                'accident',
                'acoustic',
                'announce',
                'artefact',
                'attitude',
                'bachelor',
                'broccoli',
                'business',
                'category',
                'champion',
                'cinnamon',
              ],
            },
          }}
        />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
