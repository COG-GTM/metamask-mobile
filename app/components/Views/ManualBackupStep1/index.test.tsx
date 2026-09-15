import React, { ComponentType } from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ManualBackupStep1 from './';
import { AppThemeKey } from '../../../util/theme/models';

type ManualBackupStep1Props = React.ComponentProps<typeof ManualBackupStep1>;
const ManualBackupStep1Screen = ManualBackupStep1 as unknown as ComponentType<
  Pick<ManualBackupStep1Props, 'route'>
>;

const mockStore = configureMockStore();
const initialState = {
  user: { appTheme: AppThemeKey.light },
};
const store = mockStore(initialState);

describe('ManualBackupStep1', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ManualBackupStep1Screen
          route={
            {
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
            } as ManualBackupStep1Props['route']
          }
        />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
