import React from 'react';
import { useConfirmationRedesignEnabled } from '../../Views/confirmations/hooks/useConfirmationRedesignEnabled';

export enum TransactionModalType {
  Transaction = 'transaction',
  Dapp = 'dapp',
}

export interface TransactionApprovalProps {
  transactionType?: TransactionModalType;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  onComplete: () => void;
  // QRState and isSigningQRObject are no longer needed with the redesigned confirmation system
}

const TransactionApprovalInternal = (_props: TransactionApprovalProps) => {
  const { isRedesignedEnabled } = useConfirmationRedesignEnabled();

  // With confirmation redesign enabled, all transaction approvals are handled
  // by the new confirmation system. This component now serves as a compatibility
  // layer and will return null as the new system handles everything.
  if (isRedesignedEnabled) {
    return null;
  }

  // Fallback for cases where redesign is not enabled (should not happen with
  // current feature flag configuration)
  return null;
};

// Note: QR hardware awareness is now handled by the new confirmation system
// This component is kept for backwards compatibility but no longer processes
// transactions directly
export const TransactionApproval = TransactionApprovalInternal;
