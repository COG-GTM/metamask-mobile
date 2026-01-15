import { Reducer } from 'redux';

/**
 * State shape for the alert reducer
 */
export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}

/**
 * Action types for alert
 */
export const ACTIONS = {
  SHOW_ALERT: 'SHOW_ALERT',
  HIDE_ALERT: 'HIDE_ALERT',
} as const;

interface ShowAlertAction {
  type: typeof ACTIONS.SHOW_ALERT;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}

interface HideAlertAction {
  type: typeof ACTIONS.HIDE_ALERT;
}

type AlertAction = ShowAlertAction | HideAlertAction;

export const initialState: AlertState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

const alertReducer: Reducer<AlertState, AlertAction | { type: string }> = (
  state = initialState,
  action,
): AlertState => {
  switch (action.type) {
    case ACTIONS.SHOW_ALERT:
      return {
        ...state,
        isVisible: true,
        autodismiss: (action as ShowAlertAction).autodismiss,
        content: (action as ShowAlertAction).content,
        data: (action as ShowAlertAction).data,
      };
    case ACTIONS.HIDE_ALERT:
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
