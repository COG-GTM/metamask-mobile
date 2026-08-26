/* eslint-disable @typescript-eslint/default-param-last */
import type { Action } from '../../actions/alert';

export interface State {
  isVisible: boolean;
  autodismiss: unknown;
  content: unknown;
  data: unknown;
}

export const initialState: State = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

const alertReducer = (state: State = initialState, action: Action): State => {
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
