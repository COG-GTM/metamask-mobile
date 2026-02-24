const initialState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

interface AlertAction {
  type: string;
  autodismiss?: number | null;
  content?: string | null;
  data?: unknown;
}

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
