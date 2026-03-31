/* eslint-disable @typescript-eslint/default-param-last */
import {
  type AlertAction,
  AlertActionType,
} from '../../actions/alert';

/**
 * Alert state interface
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type AlertState = {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
};

export const initialState: AlertState = {
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
