

import { useTransactionMetadataRequest } from '../transactions/useTransactionMetadataRequest';
import {
  MMM_ORIGIN,
  REDESIGNED_TRANSFER_TYPES,
  FLAT_TRANSACTION_CONFIRMATIONS } from
'../../constants/confirmations';

export const useFlatConfirmation = () => {
  const transactionMetadata = useTransactionMetadataRequest();

  const isFlatConfirmation = FLAT_TRANSACTION_CONFIRMATIONS.includes(
    transactionMetadata?.type
  );

  if (
  REDESIGNED_TRANSFER_TYPES.includes(
    transactionMetadata?.type
  ) &&
  transactionMetadata?.origin === MMM_ORIGIN)
  {
    return { isFlatConfirmation: true };
  }

  return { isFlatConfirmation };
};