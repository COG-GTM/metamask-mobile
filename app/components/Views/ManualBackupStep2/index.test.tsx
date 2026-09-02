import React, { ComponentType } from 'react';
import { shallow } from 'enzyme';
import ManualBackupStep2View from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

const ManualBackupStep2 = ManualBackupStep2View as unknown as ComponentType<{
  route: { params: { words: string[]; steps: string[] } };
}>;

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
        <ManualBackupStep2
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
              steps: ['one', 'two', 'three'],
            },
          }}
        />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
