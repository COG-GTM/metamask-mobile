import { ApprovalType } from '@metamask/controller-utils';
import {

  TransactionType } from
'@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {

  selectConfirmationRedesignFlags } from
'../../../../selectors/featureFlagController/confirmations';
import { isHardwareAccount } from '../../../../util/address';
import { isStakingConfirmation } from '../utils/confirm';
import useApprovalRequest from './useApprovalRequest';
import { useTransactionMetadataRequest } from './transactions/useTransactionMetadataRequest';
import {
  REDESIGNED_SIGNATURE_TYPES,
  REDESIGNED_TRANSACTION_TYPES,
  REDESIGNED_TRANSFER_TYPES } from
'../constants/confirmations';

function isRedesignedSignature({
  approvalRequestType,
  confirmationRedesignFlags



}) {
  return (
    confirmationRedesignFlags?.signatures &&
    approvalRequestType &&
    REDESIGNED_SIGNATURE_TYPES.includes(approvalRequestType));

}

function isRedesignedTransaction({
  approvalRequestType,
  confirmationRedesignFlags,
  fromAddress,
  transactionMetadata





}) {
  const isTransactionTypeRedesigned = REDESIGNED_TRANSACTION_TYPES.includes(
    transactionMetadata?.type
  );

  if (
  !isTransactionTypeRedesigned ||
  approvalRequestType !== ApprovalType.Transaction ||
  !transactionMetadata ||
  isHardwareAccount(fromAddress))
  {
    return false;
  }

  if (isStakingConfirmation(transactionMetadata?.type)) {
    return confirmationRedesignFlags?.staking_confirmations;
  }

  if (transactionMetadata?.type === TransactionType.contractInteraction) {
    return confirmationRedesignFlags?.contract_interaction;
  }

  if (
  REDESIGNED_TRANSFER_TYPES.includes(
    transactionMetadata?.type
  ))
  {
    return confirmationRedesignFlags?.transfer;
  }

  return false;
}

export const useConfirmationRedesignEnabled = () => {
  const { approvalRequest } = useApprovalRequest();
  const fromAddress = approvalRequest?.requestData?.from;
  const transactionMetadata = useTransactionMetadataRequest();
  const confirmationRedesignFlags = useSelector(
    selectConfirmationRedesignFlags
  );

  const approvalRequestType = approvalRequest?.type;

  const isRedesignedEnabled = useMemo(
    () =>
    isRedesignedSignature({
      approvalRequestType,
      confirmationRedesignFlags
    }) ||
    isRedesignedTransaction({
      approvalRequestType,
      confirmationRedesignFlags,
      fromAddress,
      transactionMetadata
    }),
    [
    approvalRequestType,
    confirmationRedesignFlags,
    fromAddress,
    transactionMetadata]

  );

  return { isRedesignedEnabled };
};