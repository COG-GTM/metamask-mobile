import React from 'react';
import ChoosePassword from './';
import configureMockStore from 'redux-mock-store';
import { ONBOARDING, PROTECT } from '../../../constants/navigation';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';

import { render } from '@testing-library/react-native';
const mockStore = configureMockStore();
const initialState = {
  user: {
    passwordSet: true,
    seedphraseBackedUp: false,
  },
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
};
const store = mockStore(initialState);

describe('ChoosePassword', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <ChoosePassword route={{ params: [ONBOARDING, PROTECT] }} />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
