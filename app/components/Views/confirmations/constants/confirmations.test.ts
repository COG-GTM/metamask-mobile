import { ApprovalType } from '@metamask/controller-utils';
import { TransactionType } from '@metamask/transaction-controller';

import {
  FLAT_TRANSACTION_CONFIRMATIONS,
  MMM_ORIGIN,
  REDESIGNED_SIGNATURE_TYPES,
  REDESIGNED_TRANSACTION_TYPES,
  REDESIGNED_TRANSFER_TYPES,
  STANDALONE_TRANSACTION_CONFIRMATIONS,
} from './confirmations';

describe('confirmations constants', () => {
  it('exposes the expected origin string', () => {
    expect(MMM_ORIGIN).toBe('Metamask Mobile');
  });

  it('lists the redesigned signature approval types', () => {
    expect(REDESIGNED_SIGNATURE_TYPES).toStrictEqual([
      ApprovalType.EthSignTypedData,
      ApprovalType.PersonalSign,
    ]);
  });

  it('lists the redesigned transaction types (staking + transfer/contract)', () => {
    expect(REDESIGNED_TRANSACTION_TYPES).toStrictEqual([
      TransactionType.stakingDeposit,
      TransactionType.stakingUnstake,
      TransactionType.stakingClaim,
      TransactionType.contractInteraction,
      TransactionType.simpleSend,
      TransactionType.tokenMethodTransfer,
      TransactionType.tokenMethodTransferFrom,
    ]);
  });

  it('lists only transfer transaction types in REDESIGNED_TRANSFER_TYPES', () => {
    expect(REDESIGNED_TRANSFER_TYPES).toStrictEqual([
      TransactionType.simpleSend,
      TransactionType.tokenMethodTransfer,
      TransactionType.tokenMethodTransferFrom,
    ]);
  });

  it('lists only staking types in FLAT_TRANSACTION_CONFIRMATIONS', () => {
    expect(FLAT_TRANSACTION_CONFIRMATIONS).toStrictEqual([
      TransactionType.stakingDeposit,
      TransactionType.stakingUnstake,
      TransactionType.stakingClaim,
    ]);
  });

  it('lists only staking types in STANDALONE_TRANSACTION_CONFIRMATIONS', () => {
    expect(STANDALONE_TRANSACTION_CONFIRMATIONS).toStrictEqual([
      TransactionType.stakingDeposit,
      TransactionType.stakingUnstake,
      TransactionType.stakingClaim,
    ]);
  });
});
