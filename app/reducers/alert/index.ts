/* eslint-disable @typescript-eslint/default-param-last */
import type { AnyAction } from 'redux';

export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: Record<string, unknown> | null;
}

interface ShowAlertAction {
  type: 'SHOW_ALERT';
  autodismiss: number | null;
  content: string | null;
  data: Record<string, unknown> | null;
}

interface HideAlertAction {
  type: 'HIDE_ALERT';
}

export type AlertAction = ShowAlertAction | HideAlertAction;

const initialState: AlertState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

const alertReducer = (
  state: AlertState = initialState,
  action: AnyAction,
): AlertState => {
  switch (action.type) {
    case 'SHOW_ALERT':
      return {
        ...state,
        isVisible: true,
        autodismiss: action.autodismiss,
        content: action.content,
        data: action.data,
      };
    case 'HIDE_ALERT':
      return {
        ...state,
        isVisible: false,
        autodismiss: null,
      };
    default:
      return state;
  }
};
export default alertReducer;
