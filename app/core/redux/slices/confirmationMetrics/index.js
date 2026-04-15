import { merge } from 'lodash';
import { createSlice } from '@reduxjs/toolkit';

import { createSelector } from 'reselect';










export const initialState = {
  metricsById: {}
};

const name = 'confirmationMetrics';

const slice = createSlice({
  name,
  initialState,
  reducers: {
    updateConfirmationMetric: (
    state,
    action) =>



    {
      const { id, params } = action.payload;

      if (state.metricsById[id] === undefined) {
        state.metricsById[id] = {
          properties: {},
          sensitiveProperties: {}
        };
      }

      state.metricsById[id] = merge(state.metricsById[id], params);
    }
  }
});

const { actions, reducer } = slice;
export default reducer;
// Actions
export const { updateConfirmationMetric } = actions;

// Selectors
export const selectConfirmationMetrics = (state) =>
state[name].metricsById;

export const selectConfirmationMetricsById = createSelector(
  [selectConfirmationMetrics, (_, id) => id],
  (metricsById, id) => metricsById[id]
);