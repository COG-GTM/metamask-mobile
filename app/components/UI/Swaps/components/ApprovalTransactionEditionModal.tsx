import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
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

interface Styles {
  keyboardAwareWrapper: ViewStyle;
  bottomModal: ViewStyle;
}

const styles: Styles = StyleSheet.create({
  keyboardAwareWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
});

interface SourceToken {
  decimals: number;
  symbol: string;
}

interface ApprovalTransaction {
  data?: string;
  to?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
}

interface ApprovalTransactionEditionModalProps {
  originalApprovalTransaction?: ApprovalTransaction;
  approvalTransaction?: ApprovalTransaction;
  editQuoteTransactionsVisible?: boolean;
  onCancelEditQuoteTransactions?: () => void;
  setApprovalTransaction?: (tx: ApprovalTransaction | undefined) => void;
  sourceToken: SourceToken;
  minimumSpendLimit: string;
  chainId?: string;
}

const ApprovalTransactionEditionModal: React.FC<ApprovalTransactionEditionModalProps> = ({
  originalApprovalTransaction,
  approvalTransaction,
  editQuoteTransactionsVisible,
  onCancelEditQuoteTransactions,
  setApprovalTransaction,
  sourceToken,
  minimumSpendLimit,
  chainId,
}) => {
  /* Approval transaction if any */
  const [customApprovalTransaction, setCustomApprovalTransaction] =
    useState<ApprovalTransaction | undefined>(approvalTransaction);
  const [approvalTransactionAmount, setApprovalTransactionAmount] =
    useState('');
  const [approvalCustomValue, setApprovalCustomValue] =
    useState(minimumSpendLimit);
  const [spendLimitUnlimitedSelected, setSpendLimitUnlimitedSelected] =
    useState(true);
  const { colors } = useTheme();

  const onSpendLimitCustomValueChange = useCallback(
    (value: string) => setApprovalCustomValue(value),
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
        sourceToken.decimals,
        swapsUtils.getSwapsContractAddress(chainId as string),
        customApprovalTransaction as ApprovalTransaction,
      );
      setCustomApprovalTransaction(newApprovalTransaction);
      setApprovalTransaction?.(newApprovalTransaction);
      onCancelEditQuoteTransactions?.();
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
    setApprovalTransaction?.(newApprovalTx);
    if (newApprovalTx?.data) {
      const decodedData = decodeApproveData(newApprovalTx.data);
      const approvalAmount = decodedData.encodedAmount;
      const amountDec = hexToBN(approvalAmount).toString(10);
      setApprovalTransactionAmount(
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
            tokenSymbol={sourceToken.symbol}
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
};

const mapStateToProps = (state: RootState) => ({
  originalApprovalTransaction: selectSwapsApprovalTransaction(state),
});

export default connect(mapStateToProps)(ApprovalTransactionEditionModal);
