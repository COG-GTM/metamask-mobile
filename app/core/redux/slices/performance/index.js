import { createSlice } from '@reduxjs/toolkit';

import { isTest } from '../../../../util/test/utils';
import { createSelector } from 'reselect';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';



























export const initialState = {
  sessionId: '',
  startTime: 0,
  metrics: [],
  environment: {
    branch: '',
    commitHash: '',
    platform: '',
    appVersion: ''
  },
  activeTraceBySessionId: {},
  isInitialized: false
};

const name = 'performance';

const slice = createSlice({
  name,
  initialState,
  reducers: {
    startPerformanceTrace: (
    state,
    action) =>




    {
      if (!isTest) {
        return;
      }
      // Initialize session if not already initialized
      if (!state.isInitialized) {
        const { environment } = action.payload;
        state.sessionId = uuidv4();
        state.startTime = Date.now();
        state.environment = {
          branch: environment?.branch || '',
          commitHash: environment?.commitHash || '',
          platform: environment?.platform || Platform.OS,
          appVersion: environment?.appVersion || ''
        };
        state.isInitialized = true;
      }

      const { eventName, metadata } = action.payload;
      state.activeTraceBySessionId[eventName] = {
        startTime: Date.now(),
        metadata
      };
    },
    endPerformanceTrace: (
    state,
    action) =>



    {
      if (!isTest) {
        return;
      }
      const { eventName, additionalMetadata = {} } = action.payload;
      const activeTrace = state.activeTraceBySessionId[eventName];

      if (activeTrace) {
        const duration = Date.now() - activeTrace.startTime;
        // eslint-disable-next-line no-console
        console.debug(`-- ! perf: ${eventName} took ${duration.toFixed(2)}ms`);
        state.metrics.push({
          eventName,
          timestamp: activeTrace.startTime,
          duration,
          metadata: {
            ...activeTrace.metadata,
            ...additionalMetadata
          }
        });
        delete state.activeTraceBySessionId[eventName];
      }
    },
    clearPerformanceMetrics: (state) => {
      if (!isTest) {
        return;
      }
      state.metrics = [];
      state.activeTraceBySessionId = {};
    }
  }
});

const { actions, reducer } = slice;

// Base selector
const selectPerformanceState = (state) => state.performance;

// Selectors using createSelector
export const selectPerformanceData = createSelector(
  [selectPerformanceState],
  (performanceState) => performanceState
);

export const selectPerformanceMetrics = createSelector(
  [selectPerformanceState],
  (performanceState) => performanceState?.metrics
);

export const selectPerformanceSession = createSelector(
  [selectPerformanceState],
  (performanceState) => ({
    sessionId: performanceState?.sessionId,
    startTime: performanceState?.startTime,
    environment: performanceState?.environment
  })
);

// Actions
export const {
  startPerformanceTrace,
  endPerformanceTrace,
  clearPerformanceMetrics
} = actions;

export default reducer;