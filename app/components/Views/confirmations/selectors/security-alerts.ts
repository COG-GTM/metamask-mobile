import { SecurityAlertResponse } from '@metamask/transaction-controller';
import { RootState } from '../../../../reducers';

export const selectSignatureSecurityAlertResponse = (
  rootState: RootState,
): { securityAlertResponse: SecurityAlertResponse } =>
  // The signatureRequest reducer stores the BlockaidBanner SecurityAlertResponse
  // shape, which is not assignable to the transaction-controller type expected by
  // consumers of this selector. Cast at this boundary to keep the public contract.
  rootState.signatureRequest as unknown as {
    securityAlertResponse: SecurityAlertResponse;
  };
