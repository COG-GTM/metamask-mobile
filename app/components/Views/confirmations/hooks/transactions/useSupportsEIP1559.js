import { useSelector } from 'react-redux';
import {
  TransactionEnvelopeType } from

'@metamask/transaction-controller';

import { checkNetworkAndAccountSupports1559 } from '../../../../../selectors/networkController';


export function useSupportsEIP1559(transactionMeta) {
  const { networkClientId } = transactionMeta;
  const isLegacyTxn =
  transactionMeta?.txParams?.type === TransactionEnvelopeType.legacy;
  const networkSupportsEIP1559 = useSelector((state) =>
  checkNetworkAndAccountSupports1559(state, networkClientId)
  );

  const supportsEIP1559 = networkSupportsEIP1559 && !isLegacyTxn;

  return { supportsEIP1559 };
}