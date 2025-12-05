import {
  AlertAction,
  AlertActionType,
  ShowAlertAction,
} from '../../actions/alert';

export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}

export const initialAlertState: AlertState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

/* eslint-disable @typescript-eslint/default-param-last */
const alertReducer = (
  state: AlertState = initialAlertState,
  action: AlertAction,
): AlertState => {
  switch (action.type) {
    case AlertActionType.SHOW_ALERT: {
      const showAction = action as ShowAlertAction;
      return {
        ...state,
        isVisible: true,
        autodismiss: showAction.autodismiss,
        content: showAction.content,
        data: showAction.data,
      };
    }
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
