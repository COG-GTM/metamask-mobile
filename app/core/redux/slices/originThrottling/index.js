import { createSlice } from '@reduxjs/toolkit';


export const NUMBER_OF_REJECTIONS_THRESHOLD = 3;
export const REJECTION_THRESHOLD_IN_MS = 30000;
const BLOCKING_THRESHOLD_IN_MS = 60000;












export const initialState = {
  origins: {}
};

const name = 'originThrottling';

const slice = createSlice({
  name,
  initialState,
  reducers: {
    onRPCRequestRejectedByUser(
    state,
    action)
    {
      const origin = action.payload;
      const currentState = state.origins[origin] || {
        rejections: 0,
        lastRejection: 0
      };
      const currentTime = Date.now();
      let newRejections = currentState.rejections;

      const isUnderThreshold =
      currentTime - currentState.lastRejection < REJECTION_THRESHOLD_IN_MS;

      newRejections = isUnderThreshold ? newRejections + 1 : 1;

      state.origins[origin] = {
        rejections: newRejections,
        lastRejection: currentTime
      };
    },
    resetOriginSpamState: (
    state,
    action) =>
    {
      const origin = action.payload;
      delete state.origins[origin];
    }
  }
});

// Actions
const { actions, reducer } = slice;

export default reducer;
export const { onRPCRequestRejectedByUser, resetOriginSpamState } = actions;

// Selectors
const selectOriginState = (state, origin) =>
state[name].origins[origin];

export const selectIsOriginBlockedForRPCRequests = (
state,
origin) =>
{
  const originState = selectOriginState(state, origin);
  if (!originState) {
    return false;
  }
  const currentTime = Date.now();
  const { rejections, lastRejection } = originState;
  const isWithinOneMinute =
  currentTime - lastRejection <= BLOCKING_THRESHOLD_IN_MS;

  return rejections >= NUMBER_OF_REJECTIONS_THRESHOLD && isWithinOneMinute;
};