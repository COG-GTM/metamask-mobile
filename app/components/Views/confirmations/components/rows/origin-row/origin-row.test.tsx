import React from 'react';

import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import {
  siweSignatureConfirmationState,
  typedSignV1ConfirmationState,
} from '../../../../../../util/test/confirm-data-helpers';
import InfoRowOrigin from './origin-row';

describe('InfoRowOrigin', () => {
  it('should contained required text', async () => {
    const { getByText } = renderWithProvider(<InfoRowOrigin isSignatureRequest />, {
      state: typedSignV1ConfirmationState,
    });
    expect(getByText('Request from')).toBeDefined();
    expect(getByText('metamask.github.io')).toBeDefined();
  });

  it('should display signing in with information for SIWE sign request', async () => {
    const { getByText } = renderWithProvider(<InfoRowOrigin isSignatureRequest />, {
      state: siweSignatureConfirmationState,
    });
    expect(getByText('Signing in with')).toBeDefined();
    expect(getByText('0x935E7...05477')).toBeDefined();
  });

  it('shows the requesting origin when meta.url is from another site', async () => {
    const approvalId = Object.keys(
      typedSignV1ConfirmationState.engine.backgroundState.ApprovalController
        .pendingApprovals,
    )[0];
    const approvals =
      typedSignV1ConfirmationState.engine.backgroundState.ApprovalController
        .pendingApprovals as Record<string, Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
    const approval = approvals[approvalId];
    const state = {
      ...typedSignV1ConfirmationState,
      engine: {
        ...typedSignV1ConfirmationState.engine,
        backgroundState: {
          ...typedSignV1ConfirmationState.engine.backgroundState,
          ApprovalController: {
            ...typedSignV1ConfirmationState.engine.backgroundState
              .ApprovalController,
            pendingApprovals: {
              [approvalId]: {
                ...approval,
                origin: 'evil.example',
                requestData: {
                  ...approval.requestData,
                  origin: 'evil.example',
                  meta: {
                    ...approval.requestData.meta,
                    url: 'https://metamask.github.io/test-dapp/',
                  },
                },
              },
            },
          },
        },
      },
    };
    const { getByText, queryByText } = renderWithProvider(
      <InfoRowOrigin isSignatureRequest />,
      { state },
    );
    expect(getByText('evil.example')).toBeDefined();
    expect(queryByText('metamask.github.io')).toBeNull();
  });
});
