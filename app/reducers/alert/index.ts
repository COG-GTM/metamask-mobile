import { createSlice } from '@reduxjs/toolkit';
import {
  ActionType,
  type AlertData,
  type ShowAlertAction,
} from '../../actions/alert';

export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null | undefined;
  content: string | null | undefined;
  data: AlertData | null | undefined;
}

export const initialState: AlertState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

const slice = createSlice({
  name: 'alert',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        ActionType.SHOW_ALERT,
        (state, action: ShowAlertAction): AlertState => ({
          ...state,
          isVisible: true,
          autodismiss: action.autodismiss,
          content: action.content,
          data: action.data,
        }),
      )
      .addCase(
        ActionType.HIDE_ALERT,
        (state): AlertState => ({
          ...state,
          isVisible: false,
          autodismiss: null,
        }),
      );
  },
});

const alertReducer = slice.reducer;

export default alertReducer;
