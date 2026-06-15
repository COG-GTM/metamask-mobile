import React from 'react';
import { shallow } from 'enzyme';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
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
        <ManualBackupStep2
          navigation={{} as StackNavigationProp<ParamListBase>}
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
          } as unknown as RouteProp<
            { params: { words: string[]; steps: string[] } },
            'params'
          >}
        />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
