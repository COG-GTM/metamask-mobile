import React from 'react';
import ManualBackupStep3 from './';
import configureMockStore from 'redux-mock-store';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';

const mockStore = configureMockStore();
const initialState = {};
const store = mockStore(initialState);

describe('ManualBackupStep3', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <ManualBackupStep3 navigation={{ setOptions: jest.fn(), navigate: jest.fn(), reset: jest.fn(), pop: jest.fn(), dangerouslyGetParent: () => ({ pop: jest.fn() }) }} route={{ params: { steps: [] } }} />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
