import React from 'react';
import { shallow } from 'enzyme';
import ManualBackupStep2 from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

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
        {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
        <ManualBackupStep2
          // @ts-expect-error -- legacy JavaScript UI type boundary
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
