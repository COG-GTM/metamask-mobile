export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: string | null;
}

interface ShowAlertAction {
  type: 'SHOW_ALERT';
  autodismiss: number | null;
  content: string | null;
  data: string | null;
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
