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
import type { CustomGasModalProps, GasTxn, GasObj } from './CustomGasModal.types';
import type { RootState } from '../../../../../../../../reducers';

const CustomGasModal: React.FC<CustomGasModalProps> = ({
  gasSelected,
  animateOnChange,
  isAnimating,
  onlyGas,
  validateAmount,
  legacy,
  legacyGasData,
  EIP1559GasData,
  EIP1559GasTxn,
  onGasChanged,
  onGasCanceled,
  updateGasState,
}) => {
  const { colors } = useAppThemeFromContext();
  const styles = createStyles();

  const transaction = useSelector((state: RootState) => state.transaction);
  const gasFeeEstimate = useSelector(selectGasFeeEstimates);
  const primaryCurrency = useSelector(selectPrimaryCurrency);
  const chainId = transaction?.chainId;
  const selectedAsset = useSelector(
    (state: RootState) => state.transaction.selectedAsset,
  );
  const gasEstimateType = useSelector(selectGasFeeControllerEstimateType);

  const [selectedGas, setSelectedGas] = useState<string>(gasSelected);
  const [eip1559Txn, setEIP1559Txn] = useState<GasTxn | undefined>(
    EIP1559GasTxn,
  );
  const [legacyGasObj, setLegacyGasObj] = useState<GasObj | undefined>(
    legacyGasData,
  );
  const [eip1559GasObj, setEIP1559GasObj] = useState<GasObj | undefined>(
    EIP1559GasData,
  );
  const [isViewAnimating, setIsViewAnimating] = useState(false);
  const [error, setError] = useState<string | undefined>('');

  useEffect(() => {
    setIsViewAnimating(isAnimating);
  }, [isAnimating]);

  const onGasAnimationStart = useCallback(() => setIsViewAnimating(true), []);
  const onGasAnimationEnd = useCallback(() => setIsViewAnimating(false), []);

  const getGasAnalyticsParams = () => ({
    active_currency: { value: selectedAsset.symbol, anonymous: true },
    gas_estimate_type: gasEstimateType,
  });

  const onChangeGas = (gasValue: string) => {
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
    (gasTxn: GasTxn, gasObj: GasObj) => {
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
    (gasTxn: GasTxn, gasObj: GasObj) => {
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

  const gasFeeEstimateLoose = gasFeeEstimate as unknown as Record<
    string,
    { suggestedMaxFeePerGas?: string; suggestedMaxPriorityFeePerGas?: string } | undefined
  >;
  const eip1559GasObject = {
    suggestedMaxFeePerGas:
      eip1559GasObj?.suggestedMaxFeePerGas ||
      (eip1559GasObj?.[selectedGas] as GasObj | undefined)?.suggestedMaxFeePerGas ||
      '',
    suggestedMaxPriorityFeePerGas:
      eip1559GasObj?.suggestedMaxPriorityFeePerGas ||
      gasFeeEstimateLoose?.[selectedGas]?.suggestedMaxPriorityFeePerGas ||
      '',
    suggestedGasLimit:
      eip1559GasObj?.suggestedGasLimit ||
      eip1559Txn?.suggestedGasLimit ||
      '',
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
          <EditGasFeeLegacy
            onCancel={onCancelGas}
            onSave={onSaveLegacyGasOption}
            animateOnChange={animateOnChange ?? false}
            isAnimating={isViewAnimating}
            analyticsParams={getGasAnalyticsParams()}
            view={'SendTo (Confirm)'}
            onlyGas={false}
            selectedGasObject={legacyGasObject}
            error={error}
            onUpdatingValuesStart={onGasAnimationStart}
            onUpdatingValuesEnd={onGasAnimationEnd}
            chainId={chainId ?? ''}
          />
        ) : (
          <EditGasFee1559
            selectedGasValue={selectedGas}
            gasOptions={gasFeeEstimate as unknown as import('../../../../components/EditGasFee1559Update/types').EditGasFee1559UpdateProps['gasOptions']}
            onChange={(option) => onChangeGas(option ?? '')}
            primaryCurrency={primaryCurrency}
            chainId={chainId ?? ''}
            onCancel={onCancelGas}
            onSave={onSaveEIP1559GasOption}
            animateOnChange={animateOnChange ?? false}
            isAnimating={isAnimating}
            analyticsParams={getGasAnalyticsParams()}
            selectedGasObject={{
              suggestedMaxFeePerGas: eip1559GasObject.suggestedMaxFeePerGas,
              suggestedMaxPriorityFeePerGas: eip1559GasObject.suggestedMaxPriorityFeePerGas,
              suggestedGasLimit: eip1559GasObject.suggestedGasLimit,
            }}
            onlyGas={onlyGas}
            error={error}
            dappSuggestedGas={false}
            ignoreOptions={[]}
            warningMinimumEstimateOption={''}
            suggestedEstimateOption={''}
          />
        )}
      </KeyboardAwareScrollView>
    </Modal>
  );
};

export default CustomGasModal;
