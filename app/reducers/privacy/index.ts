import { createSlice } from '@reduxjs/toolkit';
import {
  ActionType,
  type ApproveHostAction,
  type RecordSRPRevealTimestampAction,
  type RejectHostAction,
} from '../../actions/privacy';

export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: string[];
}

export const initialState: PrivacyState = {
  approvedHosts: {},
  revealSRPTimestamps: [],
};

const privacySlice = createSlice({
  name: 'privacy',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ActionType.APPROVE_HOST, (state, action: ApproveHostAction) => ({
        ...state,
        approvedHosts: {
          ...state.approvedHosts,
          [action.hostname]: true,
        },
      }))
      .addCase(ActionType.REJECT_HOST, (state, action: RejectHostAction) => {
        const newHosts = { ...state.approvedHosts };
        delete newHosts[action.hostname];
        return {
          ...state,
          approvedHosts: newHosts,
        };
      })
      .addCase(ActionType.CLEAR_HOSTS, (state) => ({
        ...state,
        approvedHosts: {},
      }))
      .addCase(
        ActionType.RECORD_SRP_REVEAL_TIMESTAMP,
        (state, action: RecordSRPRevealTimestampAction) => ({
          ...state,
          revealSRPTimestamps: [...state.revealSRPTimestamps, action.timestamp],
        }),
      );
  },
});

export default privacySlice.reducer;
