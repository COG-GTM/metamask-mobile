

import { createDeepEqualSelector } from './util';

const selectSignatureControllerState = (state) =>
state.engine.backgroundState.SignatureController;

export const selectSignatureRequests = createDeepEqualSelector(
  (state) => selectSignatureControllerState(state).signatureRequests,
  (signatureRequests) => signatureRequests
);

export const selectSignatureRequestById = createDeepEqualSelector(
  selectSignatureRequests,
  (_, id) => id,
  (signatureRequests, id) =>
  signatureRequests[id]
);