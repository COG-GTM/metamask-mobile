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
import { RootState } from '../../../../reducers';
import { SwapsToken } from '../utils';

interface ApprovalTransaction {
  data: string;
  [key: string]: unknown;
}

interface OwnProps {
  approvalTransaction?: ApprovalTransaction;
  editQuoteTransactionsVisible?: boolean;
  onCancelEditQuoteTransactions: () => void;
  setApprovalTransaction: (transaction?: ApprovalTransaction) => void;
  sourceToken: SwapsToken;
  minimumSpendLimit: string;
  chainId: string;
}

interface StateProps {
  originalApprovalTransaction?: ApprovalTransaction;
}

type Props = OwnProps & StateProps;

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

function ApprovalTransactionEditionModal({
  originalApprovalTransaction,
  approvalTransaction,
  editQuoteTransactionsVisible,
  onCancelEditQuoteTransactions,
  setApprovalTransaction,
  sourceToken,
  minimumSpendLimit,
  chainId,
}: Props) {
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
    (newApprovalCustomValue: string) =>
      setApprovalCustomValue(newApprovalCustomValue),
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
        sourceToken.decimals as number,
        swapsUtils.getSwapsContractAddress(chainId as `0x${string}`),
        customApprovalTransaction as object,
      );
      setCustomApprovalTransaction(newApprovalTransaction);
      setApprovalTransaction(newApprovalTransaction);
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
    setApprovalTransaction(newApprovalTx);
    if (newApprovalTx) {
      const decodedApprovalAmount = decodeApproveData(
        newApprovalTx.data,
      ).encodedAmount;
      const amountDec = hexToBN(decodedApprovalAmount).toString(10);
      setApprovalTransactionAmount(
        fromTokenMinimalUnitString(amountDec, sourceToken.decimals as number),
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
            tokenSymbol={sourceToken.symbol as string}
            spendLimitCustomValue={approvalCustomValue}
            originalApproveAmount={approvalTransactionAmount}
            onSetApprovalAmount={onSetApprovalAmount}
            onSpendLimitCustomValueChange={onSpendLimitCustomValueChange}
            onPressSpendLimitUnlimitedSelected={
              onPressSpendLimitUnlimitedSelected
            }
            onPressSpendLimitCustomSelected={onPressSpendLimitCustomSelected}
            toggleEditPermission={onCancelEditQuoteTransactions}
          />
        )}
      </KeyboardAwareScrollView>
    </Modal>
  );
}

const mapStateToProps = (state: RootState): StateProps => ({
  originalApprovalTransaction: selectSwapsApprovalTransaction(
    state,
  ) as ApprovalTransaction,
});

export default connect(mapStateToProps)(ApprovalTransactionEditionModal);
