export enum ActionType {
  STORE_PRIVACY_POLICY_SHOWN_DATE = 'STORE_PRIVACY_POLICY_SHOWN_DATE',
  STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED = 'STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED',
}

export interface StorePrivacyPolicyShownDateAction {
  type: ActionType.STORE_PRIVACY_POLICY_SHOWN_DATE;
  payload: number;
}

export interface StorePrivacyPolicyClickedOrClosedAction {
  type: ActionType.STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED;
}

export type Action =
  | StorePrivacyPolicyShownDateAction
  | StorePrivacyPolicyClickedOrClosedAction;

export default {
  STORE_PRIVACY_POLICY_SHOWN_DATE: ActionType.STORE_PRIVACY_POLICY_SHOWN_DATE,
  STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED:
    ActionType.STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED,
};
