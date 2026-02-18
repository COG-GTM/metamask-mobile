import { RootState, SignatureRequestState } from '../../../../reducers';

export const selectSignatureSecurityAlertResponse = (
  rootState: RootState,
): SignatureRequestState =>
  rootState.signatureRequest;
