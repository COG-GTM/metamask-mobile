import React, { ComponentType } from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ManualBackupStep1 from './';
import { AppThemeKey } from '../../../util/theme/models';

const mockStore = configureMockStore();
const initialState = {
  user: { appTheme: AppThemeKey.light },
};
const store = mockStore(initialState);

const ManualBackupStep1Component = ManualBackupStep1 as unknown as ComponentType<{
  route: { params: { words: string[] } };
}>;

describe('ManualBackupStep1', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ManualBackupStep1Component
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
    expect(wrapper).toMatchSnapshot();
  });
});
