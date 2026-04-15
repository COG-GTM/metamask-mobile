import {
  EARN_INPUT_ACTION_TO_LABEL_MAP } from

'./EarnInputView.types';

export const getEarnInputViewTitle = (action) => {
  const prefix = EARN_INPUT_ACTION_TO_LABEL_MAP[action];

  return `${prefix}`;
};