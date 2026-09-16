/* eslint-disable @typescript-eslint/default-param-last */
export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: Record<string, unknown> | null;
}

export type AlertAction =
  | ({ type: 'SHOW_ALERT' } & Omit<AlertState, 'isVisible'>)
  | { type: 'HIDE_ALERT' };

const initialState: AlertState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

const alertReducer = (state = initialState, action: AlertAction) => {
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
