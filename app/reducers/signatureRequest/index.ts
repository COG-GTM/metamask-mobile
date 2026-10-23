import { createSlice } from '@reduxjs/toolkit';
import { SecurityAlertResponse } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';
import {
  ActionType,
  type SetSignatureRequestSecurityAlertResponseAction,
} from '../../actions/signatureRequest';

export interface SignatureRequestState {
  securityAlertResponse?: SecurityAlertResponse;
}

export const initialState: SignatureRequestState = {
  securityAlertResponse: undefined,
};

const signatureRequestSlice = createSlice({
  name: 'signatureRequest',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      ActionType.SET_SIGNATURE_REQUEST_SECURITY_ALERT_RESPONSE,
      (_state, action: SetSignatureRequestSecurityAlertResponseAction) => ({
        securityAlertResponse: action.securityAlertResponse,
      }),
    );
  },
});

export default signatureRequestSlice.reducer;
