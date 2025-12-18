import { RootState } from '../../../../reducers';
import { SignatureRequestState } from '../../../../reducers/signatureRequest';

export const selectSignatureSecurityAlertResponse = (
  rootState: RootState,
): SignatureRequestState =>
  rootState.signatureRequest;
