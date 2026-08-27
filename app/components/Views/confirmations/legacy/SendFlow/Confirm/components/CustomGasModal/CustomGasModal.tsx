import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Modal from 'react-native-modal';
import { useSelector } from 'react-redux';
import { selectGasFeeEstimates } from '../../../../../../../../selectors/confirmTransaction';
import { selectGasFeeControllerEstimateType } from '../../../../../../../../selectors/gasFeeController';
import { selectPrimaryCurrency } from '../../../../../../../../selectors/settings';
import { useAppThemeFromContext } from '../../../../../../../../util/theme';
import EditGasFee1559 from '../../../../components/EditGasFee1559Update';
import EditGasFeeLegacy from '../../../../components/EditGasFeeLegacyUpdate';
import createStyles from './CustomGasModal.styles';

const CustomGasModal = ({
  // @ts-expect-error -- legacy JavaScript UI type boundary
  gasSelected,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  animateOnChange,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  isAnimating,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  onlyGas,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  validateAmount,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  legacy,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  legacyGasData,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  EIP1559GasData,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  EIP1559GasTxn,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  onGasChanged,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  onGasCanceled,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  updateGasState,
// @ts-expect-error -- legacy JavaScript UI type boundary
}): Props => {
  const { colors } = useAppThemeFromContext();
  const styles = createStyles();

  // @ts-expect-error -- legacy JavaScript UI type boundary
  const transaction = useSelector((state) => state.transaction);
  const gasFeeEstimate = useSelector(selectGasFeeEstimates);
  const primaryCurrency = useSelector(selectPrimaryCurrency);
  const chainId = transaction?.chainId;
  const selectedAsset = useSelector(
    // @ts-expect-error -- legacy JavaScript UI type boundary
    (state) => state.transaction.selectedAsset,
  );
  const gasEstimateType = useSelector(selectGasFeeControllerEstimateType);

  const [selectedGas, setSelectedGas] = useState(gasSelected);
  const [eip1559Txn, setEIP1559Txn] = useState(EIP1559GasTxn);
  const [legacyGasObj, setLegacyGasObj] = useState(legacyGasData);
  const [eip1559GasObj, setEIP1559GasObj] = useState(EIP1559GasData);
  const [isViewAnimating, setIsViewAnimating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsViewAnimating(isAnimating);
  }, [isAnimating]);

  const onGasAnimationStart = useCallback(() => setIsViewAnimating(true), []);
  const onGasAnimationEnd = useCallback(() => setIsViewAnimating(false), []);

  const getGasAnalyticsParams = () => ({
    active_currency: { value: selectedAsset.symbol, anonymous: true },
    gas_estimate_type: gasEstimateType,
  });

  // @ts-expect-error -- legacy JavaScript UI type boundary
  const onChangeGas = (gasValue) => {
    setSelectedGas(gasValue);
    onGasChanged(selectedGas);
  };

  const onCancelGas = () => {
    onGasCanceled(selectedGas);
  };

  const updatedTransactionFrom = useMemo(
    () => ({
      ...transaction,
      data: transaction?.transaction?.data,
      from: transaction?.transaction?.from,
    }),
    [transaction],
  );

  const onSaveLegacyGasOption = useCallback(
    // @ts-expect-error -- legacy JavaScript UI type boundary
    (gasTxn, gasObj) => {
      gasTxn.error = validateAmount({
        transaction: updatedTransactionFrom,
        total: gasTxn.totalHex,
      });
      setLegacyGasObj(gasObj);
      setError(gasTxn?.error);
      updateGasState({ gasTxn, gasObj, txnType: legacy });
    },
    [validateAmount, updatedTransactionFrom, legacy, updateGasState],
  );

  const onSaveEIP1559GasOption = useCallback(
    // @ts-expect-error -- legacy JavaScript UI type boundary
    (gasTxn, gasObj) => {
      gasTxn.error = validateAmount({
        transaction: updatedTransactionFrom,
        total: gasTxn.totalMaxHex,
      });

      setEIP1559Txn(gasTxn);
      setEIP1559GasObj(gasObj);
      setError(gasTxn?.error);
      updateGasState({
        gasTxn,
        gasObj,
        gasSelect: selectedGas,
        txnType: legacy,
      });
    },
    [
      validateAmount,
      selectedGas,
      updatedTransactionFrom,
      legacy,
      updateGasState,
    ],
  );

  const legacyGasObject = {
    legacyGasLimit: legacyGasObj?.legacyGasLimit,
    suggestedGasPrice: legacyGasObj?.suggestedGasPrice,
  };

  const eip1559GasObject = {
    suggestedMaxFeePerGas:
      eip1559GasObj?.suggestedMaxFeePerGas ||
      eip1559GasObj?.[selectedGas]?.suggestedMaxFeePerGas,
    suggestedMaxPriorityFeePerGas:
      eip1559GasObj?.suggestedMaxPriorityFeePerGas ||
      // @ts-expect-error -- legacy JavaScript UI type boundary
      gasFeeEstimate[selectedGas]?.suggestedMaxPriorityFeePerGas,
    suggestedGasLimit:
      eip1559GasObj?.suggestedGasLimit || eip1559Txn?.suggestedGasLimit,
  };

  return (
    <Modal
      isVisible
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.bottomModal}
      backdropColor={colors.overlay.default}
      backdropOpacity={1}
      animationInTiming={600}
      animationOutTiming={600}
      onBackdropPress={onCancelGas}
      onBackButtonPress={onCancelGas}
      onSwipeComplete={onCancelGas}
      swipeDirection={'down'}
      propagateSwipe
    >
      <KeyboardAwareScrollView
        contentContainerStyle={styles.keyboardAwareWrapper}
      >
        {legacy ? (
          // @ts-expect-error -- legacy JavaScript UI type boundary
          <EditGasFeeLegacy
            onCancel={onCancelGas}
            onSave={onSaveLegacyGasOption}
            animateOnChange={animateOnChange}
            isAnimating={isViewAnimating}
            analyticsParams={getGasAnalyticsParams()}
            view={'SendTo (Confirm)'}
            onlyGas={false}
            selectedGasObject={legacyGasObject}
            error={error}
            onUpdatingValuesStart={onGasAnimationStart}
            onUpdatingValuesEnd={onGasAnimationEnd}
            chainId={chainId}
          />
        ) : (
          <EditGasFee1559
            selectedGasValue={selectedGas}
            gasOptions={gasFeeEstimate}
            onChange={onChangeGas}
            primaryCurrency={primaryCurrency}
            chainId={chainId}
            onCancel={onCancelGas}
            onSave={onSaveEIP1559GasOption}
            animateOnChange={animateOnChange}
            isAnimating={isAnimating}
            analyticsParams={getGasAnalyticsParams()}
            // @ts-expect-error -- legacy JavaScript UI type boundary
            view={'SendTo (Confirm)'}
            selectedGasObject={eip1559GasObject}
            onlyGas={onlyGas}
            error={error}
          />
        )}
      </KeyboardAwareScrollView>
    </Modal>
  );
};

export default CustomGasModal;
