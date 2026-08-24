import React, { ComponentType } from 'react';
import ManualBackupStep3View from './';
import configureMockStore from 'redux-mock-store';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';

const ManualBackupStep3 = ManualBackupStep3View as unknown as ComponentType;

const mockStore = configureMockStore();
const initialState = {};
const store = mockStore(initialState);

describe('ManualBackupStep3', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ManualBackupStep3 />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
