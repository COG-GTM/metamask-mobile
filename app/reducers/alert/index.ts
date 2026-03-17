import { AlertActionType, AlertAction } from '../../actions/alert';

export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

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
    case AlertActionType.SHOW_ALERT:
      return {
        ...state,
        isVisible: true,
        autodismiss: action.autodismiss,
        content: action.content,
        data: action.data,
      };
    case AlertActionType.HIDE_ALERT:
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
