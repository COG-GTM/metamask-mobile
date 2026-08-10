import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ApprovalRequest } from '@metamask/approval-controller';
import {
  SNAP_ACCOUNT_REMOVAL_APPROVAL,
  SNAP_ACCOUNT_REMOVAL_CANCEL_BUTTON,
  SNAP_ACCOUNT_REMOVAL_REMOVE_BUTTON,
} from '../SnapAccountRemovalApproval.constants';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../core/RPCMethods/RPCMethodMiddleware';
import SnapAccountRemovalApproval from '../SnapAccountRemovalApproval';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import useApprovalRequest from '../../../Views/confirmations/hooks/useApprovalRequest';

jest.mock('../../../Views/confirmations/hooks/useApprovalRequest');

const onConfirm = jest.fn();
const onReject = jest.fn();

const address = '0x2a4d4b667D5f12C3F9Bf8F14a7B9f8D8d9b8c8fA';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockApprovalRequest = (approvalRequest?: ApprovalRequest<any>) => {
  (
    useApprovalRequest as jest.MockedFn<typeof useApprovalRequest>
  ).mockReturnValue({
    approvalRequest,
    onConfirm,
    onReject,
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
};

const createApprovalRequest = (
  type: string = SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ApprovalRequest<any> => ({
  id: '1',
  origin: 'npm:@metamask/snap-simple-keyring-snap',
  time: Date.now(),
  type,
  requestData: {
    publicAddress: address,
  },
  requestState: null,
  expectsResult: false,
});

describe('SnapAccountRemovalApproval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the address when the approval request is for confirmAccountRemoval', () => {
    mockApprovalRequest(createApprovalRequest());

    const { getByTestId, getByText } = renderWithProvider(
      <SnapAccountRemovalApproval />,
    );

    expect(getByTestId(SNAP_ACCOUNT_REMOVAL_APPROVAL)).toBeDefined();
    expect(getByText(address)).toBeDefined();
  });

  it('does not render when the approval request is for another type', () => {
    mockApprovalRequest(
      createApprovalRequest(
        SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
      ),
    );

    const { queryByTestId } = renderWithProvider(
      <SnapAccountRemovalApproval />,
    );

    expect(queryByTestId(SNAP_ACCOUNT_REMOVAL_APPROVAL)).toBeNull();
  });

  it('confirms the removal when the remove button is pressed', () => {
    mockApprovalRequest(createApprovalRequest());

    const { getByTestId } = renderWithProvider(<SnapAccountRemovalApproval />);

    fireEvent.press(getByTestId(SNAP_ACCOUNT_REMOVAL_REMOVE_BUTTON));

    expect(onConfirm).toHaveBeenCalledWith(undefined, { confirmed: true });
    expect(onReject).not.toHaveBeenCalled();
  });

  it('rejects the removal when the cancel button is pressed', () => {
    mockApprovalRequest(createApprovalRequest());

    const { getByTestId } = renderWithProvider(<SnapAccountRemovalApproval />);

    fireEvent.press(getByTestId(SNAP_ACCOUNT_REMOVAL_CANCEL_BUTTON));

    expect(onReject).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
