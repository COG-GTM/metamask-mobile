import { AlertActionTypes } from '../../actions/alert';

interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: Record<string, unknown> | null;
}

const initialState: AlertState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

/* eslint-disable @typescript-eslint/default-param-last */
const alertReducer = (state: AlertState = initialState, action: AlertActionTypes): AlertState => {
  switch (action.type) {
    case 'SHOW_ALERT':
      return {
        ...state,
        isVisible: true,
        autodismiss: action.autodismiss,
        content: action.content as string | null,
        data: action.data as Record<string, unknown> | null,
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
