import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
  NotificationCategory,
  NotificationPriority,
} from '../../../../util/notifications/types/notification-types';

/**
 * Quiet-hours window. Notifications below `CRITICAL` priority are
 * suppressed between `startTime` and `endTime` (24-hour HH:MM format).
 */
export interface QuietHoursConfig {
  enabled: boolean;
  /** Start time in "HH:MM" 24-hour format */
  startTime: string;
  /** End time in "HH:MM" 24-hour format */
  endTime: string;
}

/**
 * State shape for the notificationPreferences slice.
 */
export interface NotificationPreferencesState {
  /** Per-category enable/disable toggles */
  categoryToggles: Record<NotificationCategory, boolean>;
  /** Quiet hours configuration */
  quietHours: QuietHoursConfig;
  /** Whether notification grouping is enabled */
  groupingEnabled: boolean;
  /**
   * Minimum priority threshold — notifications below this level
   * are suppressed.
   */
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
     * Toggle a specific notification category on or off.
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
     * Update quiet hours configuration.
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
     * Set the minimum priority threshold. Notifications with a priority
     * below this level will be suppressed.
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

/**
 * Selector: get the full notification preferences state.
 */
export const selectNotificationPreferences = (state: {
  notificationPreferences: NotificationPreferencesState;
}): NotificationPreferencesState => state.notificationPreferences;
