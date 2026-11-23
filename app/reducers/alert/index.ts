export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null | undefined;
  content: string | null | undefined;
  data: unknown;
}

export interface AlertAction {
  type: string;
  autodismiss?: number | null;
  content?: string | null;
  data?: unknown;
}

const initialState: AlertState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

const alertReducer = (
  // eslint-disable-next-line @typescript-eslint/default-param-last
  state: AlertState = initialState,
  action: AlertAction,
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
