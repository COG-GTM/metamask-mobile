import { RootState } from '../../../../reducers';

export const selectSignatureSecurityAlertResponse = (
  rootState: RootState,
) =>
  rootState.signatureRequest;
