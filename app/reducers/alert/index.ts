/* eslint-disable @typescript-eslint/default-param-last */

const SHOW_ALERT = 'SHOW_ALERT' as const;
const HIDE_ALERT = 'HIDE_ALERT' as const;

interface ShowAlertAction {
  type: typeof SHOW_ALERT;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

interface HideAlertAction {
  type: typeof HIDE_ALERT;
}

type AlertAction = ShowAlertAction | HideAlertAction;

export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

const initialState: Readonly<AlertState> = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

const alertReducer = (
  state: AlertState = initialState,
  action: AlertAction,
): AlertState => {
  switch (action.type) {
    case SHOW_ALERT:
      return {
        ...state,
        isVisible: true,
        autodismiss: action.autodismiss,
        content: action.content,
        data: action.data,
      };
    case HIDE_ALERT:
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
