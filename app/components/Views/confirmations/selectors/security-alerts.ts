import { SecurityAlertResponse } from '@metamask/transaction-controller';
import { RootState } from '../../../../reducers';
import { selectSignatureRequestById } from '../../../../selectors/signatureController';

/**
 * Returns the security alert response of one signature request.
 * The lookup key is the `securityAlertId` stored on the request by the wallet,
 * so a result produced for another request is never returned.
 *
 * @param rootState - Redux state.
 * @param signatureRequestId - ID of the signature request (`metamaskId`).
 */
export const selectSignatureSecurityAlertResponse = (
  rootState: RootState,
  signatureRequestId?: string,
): SecurityAlertResponse | undefined => {
  if (!signatureRequestId) {
    return undefined;
  }

  const securityAlertId = selectSignatureRequestById(
    rootState,
    signatureRequestId,
  )?.securityAlertResponse?.securityAlertId;

  if (typeof securityAlertId !== 'string') {
    return undefined;
  }

  return rootState.signatureRequest?.securityAlertResponses?.[
    securityAlertId
  ] as SecurityAlertResponse | undefined;
};
