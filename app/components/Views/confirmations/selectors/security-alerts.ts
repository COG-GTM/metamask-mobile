import { SignatureRequest } from '@metamask/signature-controller';
import { RootState } from '../../../../reducers';
import { SecurityAlertResponse } from '../legacy/components/BlockaidBanner/BlockaidBanner.types';

/**
 * Returns the security alert id that was attached to a signature request when
 * it was created, which binds Blockaid results to that specific request.
 */
export const getSignatureRequestSecurityAlertId = (
  signatureRequest?: Pick<SignatureRequest, 'securityAlertResponse'>,
): string | undefined =>
  (signatureRequest?.securityAlertResponse as { securityAlertId?: string })
    ?.securityAlertId;

export const selectSignatureSecurityAlertResponse = (
  rootState: RootState,
  securityAlertId?: string,
): SecurityAlertResponse | undefined =>
  securityAlertId
    ? rootState.signatureRequest?.securityAlertResponses?.[securityAlertId]
    : undefined;
