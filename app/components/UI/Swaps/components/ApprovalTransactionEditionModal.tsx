/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface ApprovalTransactionEditionModalProps {
  approvalTransaction?: Record<string, any>;
  chainId?: string;
  editQuoteTransactionsVisible?: boolean;
  minimumSpendLimit: string;
  onCancelEditQuoteTransactions?: (...args: any[]) => any;
  originalApprovalTransaction?: Record<string, any>;
  setApprovalTransaction?: (...args: any[]) => any;
  sourceToken?: Record<string, any>;
}
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { swapsUtils } from '@metamask/swaps-controller';

import EditPermission from '../../../Views/confirmations/legacy/components/ApproveTransactionReview/EditPermission';
import { fromTokenMinimalUnitString, hexToBN } from '../../../../util/number';
import {
  decodeApproveData,
  generateTxWithNewTokenAllowance,
} from '../../../../util/transactions';
import { useTheme } from '../../../../util/theme';
import Logger from '../../../../util/Logger';
import { selectSwapsApprovalTransaction } from '../../../../reducers/swaps';

const styles: any = StyleSheet.create({
  keyboardAwareWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
});

function ApprovalTransactionEditionModal({
  originalApprovalTransaction,
  approvalTransaction,
  editQuoteTransactionsVisible,
  onCancelEditQuoteTransactions,
  setApprovalTransaction,
  sourceToken,
  minimumSpendLimit,
  chainId,
}: ApprovalTransactionEditionModalProps) {
  /* Approval transaction if any */
  const [customApprovalTransaction, setCustomApprovalTransaction] =
    useState<any>(approvalTransaction);
  const [approvalTransactionAmount, setApprovalTransactionAmount] =
    useState<any>('');
  const [approvalCustomValue, setApprovalCustomValue] =
    useState<any>(minimumSpendLimit);
  const [spendLimitUnlimitedSelected, setSpendLimitUnlimitedSelected] =
    useState<any>(true);
  const { colors } = useTheme();

  const onSpendLimitCustomValueChange = useCallback(
    (approvalCustomValue: any) => setApprovalCustomValue(approvalCustomValue),
    [],
  );

  const onPressSpendLimitUnlimitedSelected = useCallback(
    () => setSpendLimitUnlimitedSelected(true),
    [],
  );

  const onPressSpendLimitCustomSelected = useCallback(
    () => setSpendLimitUnlimitedSelected(false),
    [],
  );

  const onSetApprovalAmount = useCallback(() => {
    try {
      const newApprovalTransaction = generateTxWithNewTokenAllowance(
        spendLimitUnlimitedSelected
          ? approvalTransactionAmount
          : approvalCustomValue,
        // @ts-expect-error -- legacy JavaScript UI type boundary
        sourceToken.decimals,
        // @ts-expect-error -- legacy JavaScript UI type boundary
        swapsUtils.getSwapsContractAddress(chainId),
        customApprovalTransaction,
      );
      setCustomApprovalTransaction(newApprovalTransaction);
      // @ts-expect-error -- legacy JavaScript UI type boundary
      setApprovalTransaction(newApprovalTransaction);
      // @ts-expect-error -- legacy JavaScript UI type boundary
      onCancelEditQuoteTransactions();
    } catch (err) {
      Logger.log('Failed to setTransactionObject', err);
    }
  }, [
    setApprovalTransaction,
    spendLimitUnlimitedSelected,
    approvalTransactionAmount,
    approvalCustomValue,
    customApprovalTransaction,
    sourceToken,
    chainId,
    onCancelEditQuoteTransactions,
  ]);

  useEffect(() => {
    const newApprovalTx = spendLimitUnlimitedSelected
      ? originalApprovalTransaction
      : customApprovalTransaction;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    setApprovalTransaction(newApprovalTx);
    if (newApprovalTx) {
      const approvalTransactionAmount = decodeApproveData(
        newApprovalTx.data,
      ).encodedAmount;
      const amountDec = hexToBN(approvalTransactionAmount).toString(10);
      setApprovalTransactionAmount(
        // @ts-expect-error -- legacy JavaScript UI type boundary
        fromTokenMinimalUnitString(amountDec, sourceToken.decimals),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    originalApprovalTransaction,
    setApprovalTransaction,
    spendLimitUnlimitedSelected,
    customApprovalTransaction,
  ]);

  return (
    <Modal
      isVisible={editQuoteTransactionsVisible}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.bottomModal}
      backdropColor={colors.overlay.default}
      backdropOpacity={1}
      animationInTiming={600}
      animationOutTiming={600}
      onBackdropPress={onCancelEditQuoteTransactions}
      onBackButtonPress={onCancelEditQuoteTransactions}
      onSwipeComplete={onCancelEditQuoteTransactions}
      swipeDirection={'down'}
      propagateSwipe
    >
      <KeyboardAwareScrollView
        contentContainerStyle={styles.keyboardAwareWrapper}
      >
        {Boolean(customApprovalTransaction) && (
          <EditPermission
            host={'Swaps'}
            minimumSpendLimit={minimumSpendLimit}
            spendLimitUnlimitedSelected={spendLimitUnlimitedSelected}
            // @ts-expect-error -- legacy JavaScript UI type boundary
            tokenSymbol={sourceToken.symbol}
            spendLimitCustomValue={approvalCustomValue}
            originalApproveAmount={approvalTransactionAmount}
            onSetApprovalAmount={onSetApprovalAmount}
            onSpendLimitCustomValueChange={onSpendLimitCustomValueChange}
            onPressSpendLimitUnlimitedSelected={
              onPressSpendLimitUnlimitedSelected
            }
            onPressSpendLimitCustomSelected={onPressSpendLimitCustomSelected}
            // @ts-expect-error -- legacy JavaScript UI type boundary
            toggleEditPermission={onCancelEditQuoteTransactions}
          />
        )}
      </KeyboardAwareScrollView>
    </Modal>
  );
}

const mapStateToProps = (state: any) => ({
  originalApprovalTransaction: selectSwapsApprovalTransaction(state),
});

export default connect(mapStateToProps)(ApprovalTransactionEditionModal);
