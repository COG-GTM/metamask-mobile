import {
  AlertAction,
  AlertActionType,
} from '../../actions/alert';

export interface AlertState {
  isVisible: boolean;
  autodismiss: number | false | null;
  content: string | null;
  data: unknown;
}

export const initialAlertState: AlertState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

const alertReducer = (
  state: AlertState = initialAlertState,
  action: AlertAction = { type: AlertActionType.HIDE_ALERT },
): AlertState => {
  switch (action.type) {
    case AlertActionType.SHOW_ALERT:
      return {
        ...state,
        isVisible: true,
        autodismiss: action.autodismiss ?? null,
        content: action.content ?? null,
        data: action.data ?? null,
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
