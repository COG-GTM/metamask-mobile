import {
  AlertActionTypes,
  AlertAction,
  AlertContent,
} from '../../actions/alert';

export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: AlertContent | string | null;
  data: Record<string, unknown> | null;
}

export const alertInitialState: AlertState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

/* eslint-disable @typescript-eslint/default-param-last */
const alertReducer = (
  state: AlertState = alertInitialState,
  action: AlertAction,
): AlertState => {
  switch (action.type) {
    case AlertActionTypes.SHOW_ALERT:
      return {
        ...state,
        isVisible: true,
        autodismiss: action.autodismiss,
        content: action.content,
        data: action.data,
      };
    case AlertActionTypes.HIDE_ALERT:
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
