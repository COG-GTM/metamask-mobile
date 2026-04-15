import { useMemo } from 'react';
import useBlockaidAlerts from './useBlockaidAlerts';
import useDomainMismatchAlerts from './useDomainMismatchAlerts';
import { useInsufficientBalanceAlert } from './useInsufficientBalanceAlert';



function useSignatureAlerts() {
  const domainMismatchAlerts = useDomainMismatchAlerts();

  return useMemo(() => [...domainMismatchAlerts], [domainMismatchAlerts]);
}

function useTransactionAlerts() {
  const insufficientBalanceAlert = useInsufficientBalanceAlert();

  return useMemo(
    () => [...insufficientBalanceAlert],
    [insufficientBalanceAlert]
  );
}
export default function useConfirmationAlerts() {
  const blockaidAlerts = useBlockaidAlerts();
  const signatureAlerts = useSignatureAlerts();
  const transactionAlerts = useTransactionAlerts();

  return useMemo(
    () => [
    ...blockaidAlerts,
    ...signatureAlerts,
    ...transactionAlerts],

    [
    blockaidAlerts,
    signatureAlerts,
    transactionAlerts]

  );
}