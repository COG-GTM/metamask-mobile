import React from 'react';

import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import { typedSignV1ConfirmationState } from '../../../../../../util/test/confirm-data-helpers';
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
  it('renders the first typed-sign v1 data value as the collapsed message', () => {
    const { getByText, getAllByText } = renderWithProvider(<Message />, {
      state: typedSignV1ConfirmationState,
    });

    // SignatureMessageSection's "Message" label plus the collapsed title.
    expect(getAllByText('Message')).toHaveLength(2);
    expect(getByText('Hi, Alice!')).toBeDefined();
  });

  it('renders nothing when there is no typed-sign data available', () => {
    jest
      .spyOn(SignatureRequestHook, 'useSignatureRequest')
      .mockReturnValue(undefined);

    const { queryByText } = renderWithProvider(<Message />, {
      state: typedSignV1ConfirmationState,
    });

    expect(queryByText('Hi, Alice!')).toBeNull();
  });
});
