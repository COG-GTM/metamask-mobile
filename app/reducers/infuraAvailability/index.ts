import { createSlice } from '@reduxjs/toolkit';
import { ActionType } from '../../actions/infuraAvailability';

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

export const initialState: InfuraAvailabilityState = {
  isBlocked: false,
};

export const INFURA_AVAILABILITY_BLOCKED =
  ActionType.INFURA_AVAILABILITY_BLOCKED;
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  ActionType.INFURA_AVAILABILITY_NOT_BLOCKED;

export const getInfuraBlockedSelector = (state: {
  infuraAvailability?: InfuraAvailabilityState;
}) => state.infuraAvailability?.isBlocked;

const infuraAvailabilitySlice = createSlice({
  name: 'infuraAvailability',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ActionType.INFURA_AVAILABILITY_BLOCKED, (state) => ({
        ...state,
        isBlocked: true,
      }))
      .addCase(ActionType.INFURA_AVAILABILITY_NOT_BLOCKED, (state) => ({
        ...state,
        isBlocked: false,
      }));
  },
});

export default infuraAvailabilitySlice.reducer;
