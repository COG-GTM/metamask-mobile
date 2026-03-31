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

const styles = StyleSheet.create({
  keyboardAwareWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
});

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ApprovalTransactionEditionModalProps {
  originalApprovalTransaction?: Record<string, any>;
  approvalTransaction?: Record<string, any>;
  editQuoteTransactionsVisible?: boolean;
  onCancelEditQuoteTransactions?: () => void;
  setApprovalTransaction?: (tx: any) => void;
  sourceToken: { symbol?: string; decimals?: number };
  minimumSpendLimit: string;
  chainId?: string;
}

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
    useState(approvalTransaction);
  const [approvalTransactionAmount, setApprovalTransactionAmount] =
    useState('');
  const [approvalCustomValue, setApprovalCustomValue] =
    useState(minimumSpendLimit);
  const [spendLimitUnlimitedSelected, setSpendLimitUnlimitedSelected] =
    useState(true);
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
        // @ts-expect-error Legacy JS code needs type refinement
        sourceToken.decimals,
        // @ts-expect-error Legacy JS code needs type refinement
        swapsUtils.getSwapsContractAddress(chainId),
        customApprovalTransaction,
      );
      setCustomApprovalTransaction(newApprovalTransaction);
      // @ts-expect-error Legacy JS code needs type refinement
      setApprovalTransaction(newApprovalTransaction);
      // @ts-expect-error Legacy JS code needs type refinement
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
    // @ts-expect-error Legacy JS code needs type refinement
    setApprovalTransaction(newApprovalTx);
    if (newApprovalTx) {
      const approvalTransactionAmount = decodeApproveData(
        newApprovalTx.data,
      ).encodedAmount;
      const amountDec = hexToBN(approvalTransactionAmount).toString(10);
      setApprovalTransactionAmount(
        // @ts-expect-error Legacy JS code needs type refinement
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
            // @ts-expect-error Legacy JS code needs type refinement
            tokenSymbol={sourceToken.symbol}
            spendLimitCustomValue={approvalCustomValue}
            originalApproveAmount={approvalTransactionAmount}
            onSetApprovalAmount={onSetApprovalAmount}
            onSpendLimitCustomValueChange={onSpendLimitCustomValueChange}
            onPressSpendLimitUnlimitedSelected={
              onPressSpendLimitUnlimitedSelected
            }
            onPressSpendLimitCustomSelected={onPressSpendLimitCustomSelected}
            // @ts-expect-error Legacy JS code needs type refinement
            toggleEditPermission={onCancelEditQuoteTransactions}
          />
        )}
      </KeyboardAwareScrollView>
    </Modal>
  );
}

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: any) => ({
  originalApprovalTransaction: selectSwapsApprovalTransaction(state),
});

export default connect(mapStateToProps)(ApprovalTransactionEditionModal);
