import { Action } from 'redux';

export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}

interface ShowAlertAction extends Action<'SHOW_ALERT'> {
  autodismiss: number;
  content: string;
  data: unknown;
}

interface HideAlertAction extends Action<'HIDE_ALERT'> {}

type AlertAction = ShowAlertAction | HideAlertAction | Action<string>;

const initialState: AlertState = {
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
    case 'SHOW_ALERT':
      return {
        ...state,
        isVisible: true,
        autodismiss: (action as ShowAlertAction).autodismiss,
        content: (action as ShowAlertAction).content,
        data: (action as ShowAlertAction).data,
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
