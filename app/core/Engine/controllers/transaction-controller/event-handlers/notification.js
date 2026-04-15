



import NotificationManager from '../../../../NotificationManager';
import { REDESIGNED_TRANSACTION_TYPES } from '../../../../../components/Views/confirmations/constants/confirmations';

export function handleShowNotification(transactionMeta) {
  if (
  REDESIGNED_TRANSACTION_TYPES.includes(
    transactionMeta.type
  ))
  {
    NotificationManager.watchSubmittedTransaction(transactionMeta);
  }
}