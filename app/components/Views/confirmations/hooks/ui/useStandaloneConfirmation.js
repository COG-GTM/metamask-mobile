
import { useTransactionMetadataRequest } from '../transactions/useTransactionMetadataRequest';
import {
  MMM_ORIGIN,
  REDESIGNED_TRANSFER_TYPES,
  STANDALONE_TRANSACTION_CONFIRMATIONS } from
'../../constants/confirmations';

export const useStandaloneConfirmation = () => {
  const transactionMetadata = useTransactionMetadataRequest();

  const isStandaloneConfirmation =
  STANDALONE_TRANSACTION_CONFIRMATIONS.includes(
    transactionMetadata?.type
  );

  if (
  REDESIGNED_TRANSFER_TYPES.includes(
    transactionMetadata?.type
  ) &&
  transactionMetadata?.origin === MMM_ORIGIN)
  {
    return { isStandaloneConfirmation: true };
  }

  return { isStandaloneConfirmation };
};