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

interface AlertReducerAction {
  type: string;
  isVisible?: boolean;
  autodismiss?: number | null;
  content?: string | null;
  data?: unknown;
}

const alertReducer = (
  state: AlertState = initialState,
  action: AlertReducerAction,
): AlertState => {
  switch (action.type) {
    case 'SHOW_ALERT':
      return {
        ...state,
        isVisible: true,
        autodismiss: action.autodismiss ?? null,
        content: action.content ?? null,
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
