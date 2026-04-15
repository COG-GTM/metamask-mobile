import { omit, pick } from 'lodash';
import approvalResult from './ApprovalResult';
import smartTransactionStatus from './SmartTransactionStatus';
import { ApprovalTypes } from '../../../../../../../../core/RPCMethods/RPCMethodMiddleware';



























const APPROVAL_TEMPLATES = {
  [ApprovalTypes.RESULT_SUCCESS]: approvalResult,
  [ApprovalTypes.RESULT_ERROR]: approvalResult,
  [ApprovalTypes.SMART_TRANSACTION_STATUS]: smartTransactionStatus
};

export const TEMPLATED_CONFIRMATION_APPROVAL_TYPES =
Object.keys(APPROVAL_TEMPLATES);

const ALLOWED_TEMPLATE_KEYS = [
'cancelText',
'confirmText',
'content',
'hideCancelButton',
'hideSubmitButton',
'onCancel',
'onConfirm',
'loadingText'];


export function getTemplateValues(
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
pendingApproval,
stringFn,
actions,
colors)
{
  const fn = APPROVAL_TEMPLATES[pendingApproval.type]?.getValues;
  if (!fn) {
    throw new Error(
      `APPROVAL_TYPE: '${pendingApproval.type}' is not specified in approval templates`
    );
  }

  const values = fn(pendingApproval, stringFn, actions, colors);
  const extraneousKeys = omit(values, ALLOWED_TEMPLATE_KEYS);
  const safeValues = pick(
    values,
    ALLOWED_TEMPLATE_KEYS
  );
  if (Object.keys(extraneousKeys).length > 0) {
    throw new Error(
      `Received extraneous keys from ${
      pendingApproval.type}.getValues. These keys are not passed to the confirmation page: ${
      Object.keys(
        extraneousKeys
      )}`
    );
  }
  return safeValues;
}