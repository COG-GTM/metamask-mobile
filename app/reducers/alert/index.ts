import { Action } from 'redux';
import { AlertState } from './types';

export * from './types';

export enum AlertActionType {
  SHOW_ALERT = 'SHOW_ALERT',
  HIDE_ALERT = 'HIDE_ALERT',
}

export interface ShowAlertAction extends Action<AlertActionType.SHOW_ALERT> {
  autodismiss: number;
  content: string;
  data: { msg: string };
}

export type HideAlertAction = Action<AlertActionType.HIDE_ALERT>;

export type AlertAction = ShowAlertAction | HideAlertAction;

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
