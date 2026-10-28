import { SecurityAlertResponse } from '@metamask/transaction-controller';
import { SignatureRequest } from '@metamask/signature-controller';
import { RootState } from '../../../../reducers';
import { selectSignatureRequestById } from '../../../../selectors/signatureController';

const EMPTY_SECURITY_ALERT_RESPONSES: Record<string, SecurityAlertResponse> =
  {};

export const selectSignatureSecurityAlertResponses = (
  rootState: RootState,
): Record<string, SecurityAlertResponse> =>
  (rootState.signatureRequest?.securityAlertResponses as
    | Record<string, SecurityAlertResponse>
    | undefined) ?? EMPTY_SECURITY_ALERT_RESPONSES;

export const getSignatureRequestSecurityAlertId = (
  signatureRequest?: SignatureRequest,
): string | undefined => {
  const securityAlertId =
    signatureRequest?.securityAlertResponse?.securityAlertId;
  return typeof securityAlertId === 'string' ? securityAlertId : undefined;
};

export const selectSignatureSecurityAlertResponseById = (
  rootState: RootState,
  securityAlertId?: string,
): SecurityAlertResponse | undefined =>
  securityAlertId
    ? selectSignatureSecurityAlertResponses(rootState)[securityAlertId]
    : undefined;

/**
 * Returns the security alert response bound to the given signature request,
 * never a response produced for a different request.
 */
export const selectSecurityAlertResponseBySignatureRequestId = (
  rootState: RootState,
  signatureRequestId?: string,
): SecurityAlertResponse | undefined => {
  if (!signatureRequestId) {
    return undefined;
  }
  const signatureRequest = selectSignatureRequestById(
    rootState,
    signatureRequestId,
  );
  return selectSignatureSecurityAlertResponseById(
    rootState,
    getSignatureRequestSecurityAlertId(signatureRequest),
  );
};
