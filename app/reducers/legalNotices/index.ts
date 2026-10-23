import { createSlice } from '@reduxjs/toolkit';
import type { Action } from 'redux';
import type { RootState } from '..';
import {
  ActionType,
  type StorePrivacyPolicyClickedOrClosedAction,
  type StorePrivacyPolicyShownDateAction,
} from './types';

const currentDate = new Date(Date.now());
const newPrivacyPolicyDate = new Date('2024-06-18T12:00:00Z');
export const isPastPrivacyPolicyDate = currentDate >= newPrivacyPolicyDate;

export interface LegalNoticesState {
  newPrivacyPolicyToastClickedOrClosed: boolean;
  newPrivacyPolicyToastShownDate: number | null;
}

export const initialState: LegalNoticesState = {
  newPrivacyPolicyToastClickedOrClosed: false,
  newPrivacyPolicyToastShownDate: null,
};

export const storePrivacyPolicyShownDate = (
  timestamp: number,
): StorePrivacyPolicyShownDateAction => ({
  type: ActionType.STORE_PRIVACY_POLICY_SHOWN_DATE,
  payload: timestamp,
});

export const storePrivacyPolicyClickedOrClosed =
  (): StorePrivacyPolicyClickedOrClosedAction => ({
    type: ActionType.STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED,
  });

export const shouldShowNewPrivacyToastSelector = (
  state: RootState,
): boolean => {
  const {
    newPrivacyPolicyToastShownDate,
    newPrivacyPolicyToastClickedOrClosed,
  } = state.legalNotices;

  if (newPrivacyPolicyToastClickedOrClosed) return false;

  const shownDate = new Date(newPrivacyPolicyToastShownDate ?? 0);

  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  const isRecent =
    currentDate.getTime() - shownDate.getTime() < oneDayInMilliseconds;

  return (
    currentDate.getTime() >= newPrivacyPolicyDate.getTime() &&
    (!newPrivacyPolicyToastShownDate ||
      (isRecent && !newPrivacyPolicyToastClickedOrClosed))
  );
};

export interface LegalNoticesAction extends Action {
  newPrivacyPolicyToastShownDate: boolean;
  payload: number;
}

const legalNoticesSlice = createSlice({
  name: 'legalNotices',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        ActionType.STORE_PRIVACY_POLICY_SHOWN_DATE,
        (state, action: StorePrivacyPolicyShownDateAction) => {
          if (state.newPrivacyPolicyToastShownDate !== null) {
            return state;
          }

          return {
            ...state,
            newPrivacyPolicyToastShownDate: action.payload,
          };
        },
      )
      .addCase(ActionType.STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED, (state) => ({
        ...state,
        newPrivacyPolicyToastClickedOrClosed: true,
      }));
  },
});

export default legalNoticesSlice.reducer;
