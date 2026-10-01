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
import { RootState } from '../../../../../../../../reducers';

interface GasTransaction {
  error?: string;
  totalHex?: string;
  totalMaxHex?: string;
  suggestedGasLimit?: string;
  [key: string]: unknown;
}

interface GasObject {
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  [key: string]: unknown;
}

interface CustomGasModalProps {
  gasSelected: string;
  animateOnChange: boolean;
  isAnimating: boolean;
  onlyGas: boolean;
  validateAmount: (params: { transaction: unknown; total: string }) => string;
  legacy: boolean;
  legacyGasData: GasObject;
  EIP1559GasData: GasObject;
  EIP1559GasTxn: GasTransaction;
  onGasChanged: (gasSelected: string) => void;
  onGasCanceled: (gasSelected: string) => void;
  updateGasState: (params: {
    gasTxn: GasTransaction;
    gasObj: GasObject;
    gasSelect?: string;
    txnType: boolean;
  }) => void;
}

const CustomGasModal = ({
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
}: CustomGasModalProps) => {
  const { colors } = useAppThemeFromContext();
  const styles = createStyles();

  const transaction = useSelector(
    (state: RootState) => state.transaction,
  );
  const gasFeeEstimate = useSelector(selectGasFeeEstimates) as Record<
    string,
    { suggestedMaxPriorityFeePerGas?: string } | undefined
  >;
  const primaryCurrency = useSelector(selectPrimaryCurrency);
  const chainId = transaction?.chainId;
  const selectedAsset = useSelector(
    (state: RootState) => state.transaction.selectedAsset,
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
    (gasTxn: GasTransaction, gasObj: GasObject) => {
      gasTxn.error = validateAmount({
        transaction: updatedTransactionFrom,
        total: gasTxn.totalHex as string,
      });
      setLegacyGasObj(gasObj);
      setError(gasTxn?.error ?? '');
      updateGasState({ gasTxn, gasObj, txnType: legacy });
    },
    [validateAmount, updatedTransactionFrom, legacy, updateGasState],
  );

  const onSaveEIP1559GasOption = useCallback(
    (gasTxn: GasTransaction, gasObj: GasObject) => {
      gasTxn.error = validateAmount({
        transaction: updatedTransactionFrom,
        total: gasTxn.totalMaxHex as string,
      });

      setEIP1559Txn(gasTxn);
      setEIP1559GasObj(gasObj);
      setError(gasTxn?.error ?? '');
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
      (eip1559GasObj?.[selectedGas] as GasObject | undefined)
        ?.suggestedMaxFeePerGas,
    suggestedMaxPriorityFeePerGas:
      eip1559GasObj?.suggestedMaxPriorityFeePerGas ||
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
          <EditGasFeeLegacy
            onCancel={onCancelGas}
            onSave={
              onSaveLegacyGasOption as React.ComponentProps<
                typeof EditGasFeeLegacy
              >['onSave']
            }
            animateOnChange={animateOnChange}
            isAnimating={isViewAnimating}
            analyticsParams={
              getGasAnalyticsParams() as unknown as React.ComponentProps<
                typeof EditGasFeeLegacy
              >['analyticsParams']
            }
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
            gasOptions={
              gasFeeEstimate as unknown as React.ComponentProps<
                typeof EditGasFee1559
              >['gasOptions']
            }
            onChange={onChangeGas}
            primaryCurrency={primaryCurrency as string}
            chainId={chainId}
            onCancel={onCancelGas}
            onSave={onSaveEIP1559GasOption}
            animateOnChange={animateOnChange}
            isAnimating={isAnimating}
            analyticsParams={
              getGasAnalyticsParams() as unknown as React.ComponentProps<
                typeof EditGasFee1559
              >['analyticsParams']
            }
            view={'SendTo (Confirm)'}
            selectedGasObject={
              eip1559GasObject as React.ComponentProps<
                typeof EditGasFee1559
              >['selectedGasObject']
            }
            onlyGas={onlyGas}
            error={error}
          />
        )}
      </KeyboardAwareScrollView>
    </Modal>
  );
};

export default CustomGasModal;
