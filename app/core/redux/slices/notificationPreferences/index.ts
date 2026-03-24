/**
 * Notification Preferences Redux Slice
 *
 * Manages user-configurable notification preferences:
 * - Per-category enable/disable toggles
 * - Quiet hours configuration (start/end times)
 * - Notification grouping toggle
 * - Priority threshold (suppress notifications below a given priority)
 */

import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
  NotificationCategory,
  NotificationPriority,
} from '../../../../util/notifications/types/notification-types';

/** Quiet hours window expressed as HH:mm strings in 24-hour format. */
export interface QuietHoursConfig {
  /** Whether quiet hours are enabled */
  enabled: boolean;
  /** Start time in HH:mm format (e.g., "22:00") */
  startTime: string;
  /** End time in HH:mm format (e.g., "07:00") */
  endTime: string;
}

/** Root shape of the notificationPreferences slice. */
export interface NotificationPreferencesState {
  /** Per-category on/off toggles. All categories default to enabled. */
  categoryToggles: Record<NotificationCategory, boolean>;
  /** Quiet hours configuration */
  quietHours: QuietHoursConfig;
  /** Whether to group similar notifications together */
  groupingEnabled: boolean;
  /** Minimum priority a notification must have to be displayed */
  priorityThreshold: NotificationPriority;
}

export const initialState: NotificationPreferencesState = {
  categoryToggles: {
    [NotificationCategory.TRANSACTION]: true,
    [NotificationCategory.SECURITY]: true,
    [NotificationCategory.PRICE_ALERT]: true,
    [NotificationCategory.DAPP]: true,
    [NotificationCategory.ANNOUNCEMENT]: true,
    [NotificationCategory.SYSTEM]: true,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
  },
  groupingEnabled: true,
  priorityThreshold: NotificationPriority.LOW,
};

const name = 'notificationPreferences';

const slice = createSlice({
  name,
  initialState,
  reducers: {
    /**
     * Toggle a single notification category on or off.
     */
    toggleCategory: (
      state,
      action: PayloadAction<{
        category: NotificationCategory;
        enabled: boolean;
      }>,
    ) => {
      state.categoryToggles[action.payload.category] =
        action.payload.enabled;
    },

    /**
     * Replace the entire quiet hours configuration.
     */
    setQuietHours: (state, action: PayloadAction<QuietHoursConfig>) => {
      state.quietHours = action.payload;
    },

    /**
     * Toggle notification grouping on or off.
     */
    setGroupingEnabled: (state, action: PayloadAction<boolean>) => {
      state.groupingEnabled = action.payload;
    },

    /**
     * Set the minimum priority threshold for displaying notifications.
     */
    setPriorityThreshold: (
      state,
      action: PayloadAction<NotificationPriority>,
    ) => {
      state.priorityThreshold = action.payload;
    },
  },
});

const { actions, reducer } = slice;

export default reducer;

export const {
  toggleCategory,
  setQuietHours,
  setGroupingEnabled,
  setPriorityThreshold,
} = actions;
