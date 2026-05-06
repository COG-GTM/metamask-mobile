import { AnyAction } from 'redux';

export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

export type AlertAction =
  | {
      type: 'SHOW_ALERT';
      isVisible: boolean;
      autodismiss: number | null;
      content: string | null;
      data: unknown;
    }
  | { type: 'HIDE_ALERT' };

const initialState: AlertState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

const alertReducer = (
  state: AlertState = initialState,
  action: AnyAction = { type: '' },
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
