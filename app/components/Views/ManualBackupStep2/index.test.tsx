import React, { ComponentType } from 'react';
import { shallow } from 'enzyme';
import ManualBackupStep2 from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

type ManualBackupStep2Props = React.ComponentProps<typeof ManualBackupStep2>;
const ManualBackupStep2Screen = ManualBackupStep2 as unknown as ComponentType<
  Pick<ManualBackupStep2Props, 'route'>
>;

const mockStore = configureMockStore();
const initialState = {
  user: {
    passwordSet: true,
    seedphraseBackedUp: false,
  },
};
const store = mockStore(initialState);

describe('ManualBackupStep2', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ManualBackupStep2Screen
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
                steps: ['one', 'two', 'three'],
              },
            } as ManualBackupStep2Props['route']
          }
        />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
