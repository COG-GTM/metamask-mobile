import { ApprovalType } from '@metamask/controller-utils';

import { useSelector } from 'react-redux';

import { selectSignatureRequestById } from '../../../../../selectors/signatureController';

import useApprovalRequest from '../useApprovalRequest';

const SIGNATURE_APPROVAL_TYPES = [
ApprovalType.PersonalSign,
ApprovalType.EthSignTypedData];


export function useSignatureRequest() {
  const { approvalRequest } = useApprovalRequest();

  const signatureRequest = useSelector((state) =>
  selectSignatureRequestById(state, approvalRequest?.id)
  );

  if (
  !SIGNATURE_APPROVAL_TYPES.includes(approvalRequest?.type) ||
  !signatureRequest)
  {
    return undefined;
  }

  return signatureRequest;
}