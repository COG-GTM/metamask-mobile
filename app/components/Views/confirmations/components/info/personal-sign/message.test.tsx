import React from 'react';

import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import {
  personalSignatureConfirmationState,
  siweSignatureConfirmationState,
} from '../../../../../../util/test/confirm-data-helpers';
// eslint-disable-next-line import/no-namespace
import * as SignatureRequestHook from '../../../hooks/signatures/useSignatureRequest';
import Message from './message';

jest.mock('../../../../../../core/Engine', () => ({
  getTotalEvmFiatAccountBalance: () => ({ tokenFiat: 10 }),
  context: {
    KeyringController: {
      state: { keyrings: [] },
      getOrAddQRKeyring: jest.fn(),
    },
    AccountsController: {
      state: {
        internalAccounts: {
          accounts: {
            '1': { address: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477' },
          },
        },
      },
    },
  },
  controllerMessenger: { subscribe: jest.fn() },
}));

describe('Message', () => {
  it('renders the decoded plaintext message for a personal_sign request', () => {
    const { getByText } = renderWithProvider(<Message />, {
      state: personalSignatureConfirmationState,
    });

    expect(getByText('Message')).toBeDefined();
    expect(getByText('Example `personal_sign` message')).toBeDefined();
  });

  it('renders the SIWE statement as the collapsed message for a SIWE request', () => {
    const { getByText } = renderWithProvider(<Message />, {
      state: siweSignatureConfirmationState,
    });

    expect(getByText('Message')).toBeDefined();
    expect(
      getByText(
        'I accept the MetaMask Terms of Service: https://community.metamask.io/tos',
      ),
    ).toBeDefined();
  });

  it('renders an empty message section when there is no signature request', () => {
    jest
      .spyOn(SignatureRequestHook, 'useSignatureRequest')
      .mockReturnValue(undefined);

    const { queryByText } = renderWithProvider(<Message />, {
      state: personalSignatureConfirmationState,
    });

    expect(queryByText('Example `personal_sign` message')).toBeNull();
  });
});
