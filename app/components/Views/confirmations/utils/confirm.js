import { TransactionType } from '@metamask/transaction-controller';

import { ApprovalTypes } from '../../../../core/RPCMethods/RPCMethodMiddleware';

export const TOKEN_VALUE_UNLIMITED_THRESHOLD = 10 ** 15;

export function isSignatureRequest(requestType) {
  return [
  ApprovalTypes.PERSONAL_SIGN,
  ApprovalTypes.ETH_SIGN_TYPED_DATA].
  includes(requestType);
}

export function isStakingConfirmation(requestType) {
  return [
  TransactionType.stakingDeposit,
  TransactionType.stakingUnstake,
  TransactionType.stakingClaim].
  includes(requestType);
}