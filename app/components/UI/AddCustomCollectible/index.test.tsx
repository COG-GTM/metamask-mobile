import React from 'react';
import AddCustomCollectible from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import initialRootState from '../../../util/test/initial-root-state';

import { render } from '@testing-library/react-native';
const mockStore = configureMockStore();

const store = mockStore(initialRootState);

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn().mockImplementation(() => ''),
}));

describe('AddCustomCollectible', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <AddCustomCollectible />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
