import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
  NotificationCategory,
  NotificationPriority,
} from '../../../../util/notifications/types/notification-types';
import type {
  NotificationPreferences,
  QuietHoursConfig,
} from '../../../../util/notifications/services/NotificationFilterService';

export type { NotificationPreferences } from '../../../../util/notifications/services/NotificationFilterService';

export const initialState: NotificationPreferences = {
  categoryEnabled: {},
  minimumPriority: NotificationPriority.LOW,
  quietHours: {
    enabled: false,
    startHour: 22,
    endHour: 7,
  },
};

const name = 'notificationPreferences';

const slice = createSlice({
  name,
  initialState,
  reducers: {
    /**
     * Toggle a specific notification category on or off.
     */
    setCategoryEnabled: (
      state,
      action: PayloadAction<{ category: NotificationCategory; enabled: boolean }>,
    ) => {
      state.categoryEnabled[action.payload.category] = action.payload.enabled;
    },

    /**
     * Set the minimum notification priority threshold.
     * Notifications below this priority are suppressed (except CRITICAL).
     */
    setMinimumPriority: (
      state,
      action: PayloadAction<NotificationPriority>,
    ) => {
      state.minimumPriority = action.payload;
    },

    /**
     * Update quiet hours configuration.
     */
    setQuietHours: (state, action: PayloadAction<QuietHoursConfig>) => {
      state.quietHours = action.payload;
    },

    /**
     * Toggle quiet hours on or off without changing the time window.
     */
    toggleQuietHours: (state, action: PayloadAction<boolean>) => {
      state.quietHours.enabled = action.payload;
    },

    /**
     * Reset all preferences back to defaults.
     */
    resetPreferences: () => initialState,
  },
});

const { actions, reducer } = slice;

export default reducer;

export const {
  setCategoryEnabled,
  setMinimumPriority,
  setQuietHours,
  toggleQuietHours,
  resetPreferences,
} = actions;
