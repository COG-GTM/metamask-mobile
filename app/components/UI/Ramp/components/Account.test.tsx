import React from 'react';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { createMockAccountsControllerState } from '../../../../util/test/accountsControllerTestUtils';
import { MOCK_KEYRING_CONTROLLER_STATE } from '../../../../util/test/keyringControllerTestUtils';
import { backgroundState } from '../../../../util/test/initial-root-state';
import Account from './Account';

const MOCK_ADDRESS_1 = '0xAbCdef1234567890abcdef1234567890ABCdef12';
const MOCK_ADDRESS_2 = '0x1111111111111111111111111111111111111111';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stateWithAccounts: any = {
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: createMockAccountsControllerState(
        [MOCK_ADDRESS_1, MOCK_ADDRESS_2],
        MOCK_ADDRESS_1,
      ),
      KeyringController: MOCK_KEYRING_CONTROLLER_STATE,
    },
  },
};

describe('Account', () => {
  it('renders the selected internal account by default', () => {
    const { toJSON } = renderWithProvider(<Account />, {
      state: stateWithAccounts,
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the account that matches the provided address', () => {
    const { toJSON } = renderWithProvider(
      <Account address={MOCK_ADDRESS_2} />,
      { state: stateWithAccounts },
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders in the transparent variant', () => {
    const { toJSON } = renderWithProvider(<Account transparent />, {
      state: stateWithAccounts,
    });
    expect(toJSON()).toMatchSnapshot();
  });
});
