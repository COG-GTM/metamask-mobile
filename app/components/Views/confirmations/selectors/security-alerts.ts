import { SecurityAlertResponse } from '../legacy/components/BlockaidBanner/BlockaidBanner.types';
import { RootState } from '../../../../reducers';

export const selectSignatureSecurityAlertResponse = (
  rootState: RootState,
): { securityAlertResponse?: SecurityAlertResponse } =>
  rootState.signatureRequest;
