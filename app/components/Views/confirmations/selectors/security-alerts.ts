import { SecurityAlertResponse } from '@metamask/transaction-controller';
import { RootState } from '../../../../reducers';
import { SignatureRequestState } from '../../../../reducers/signatureRequest';

export const selectSignatureSecurityAlertResponse = (
  rootState: RootState,
): SignatureRequestState => rootState.signatureRequest;
