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
 * Action types for alert reducer
 */
interface ShowAlertAction {
  type: 'SHOW_ALERT';
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}

interface HideAlertAction {
  type: 'HIDE_ALERT';
}

type AlertAction = ShowAlertAction | HideAlertAction;

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
