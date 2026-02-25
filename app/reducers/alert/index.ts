export interface AlertData {
  msg: string;
  width?: string;
}

export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: AlertData | null;
}

interface ShowAlertAction {
  type: 'SHOW_ALERT';
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data: AlertData;
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

/* eslint-disable @typescript-eslint/default-param-last */
const alertReducer = (
  state: AlertState = initialState,
  action: AlertAction,
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
