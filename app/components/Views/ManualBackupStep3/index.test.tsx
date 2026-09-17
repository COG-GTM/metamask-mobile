import React, { ComponentType } from 'react';
import ManualBackupStep3 from './';
import configureMockStore from 'redux-mock-store';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';

const mockStore = configureMockStore();
const initialState = {};
const store = mockStore(initialState);

describe('ManualBackupStep3', () => {
  it('should render correctly', () => {
    const ManualBackupStep3Component =
      ManualBackupStep3 as unknown as ComponentType;
    const wrapper = shallow(
      <Provider store={store}>
        <ManualBackupStep3Component />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
