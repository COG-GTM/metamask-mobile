import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Modal from 'react-native-modal';
import { useSelector } from 'react-redux';
import { selectGasFeeEstimates } from '../../../../../../../../selectors/confirmTransaction';
import { selectGasFeeControllerEstimateType } from '../../../../../../../../selectors/gasFeeController';
import { selectPrimaryCurrency } from '../../../../../../../../selectors/settings';
import { useAppThemeFromContext } from '../../../../../../../../util/theme';
import { RootState } from '../../../../../../../../reducers';
import EditGasFee1559 from '../../../../components/EditGasFee1559Update';
import EditGasFeeLegacy from '../../../../components/EditGasFeeLegacyUpdate';
import createStyles from './CustomGasModal.styles';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GasData = any;

interface ValidateAmountArgs {
  transaction: GasData;
  total: string;
}

interface CustomGasModalProps {
  /**
   * Selected gas option (low, medium, high)
   */
  gasSelected: string;
  /**
   * If the values should animate upon update or not
   */
  animateOnChange?: boolean;
  /**
   * Boolean to determine if the animation is happening
   */
  isAnimating: boolean;
  /**
   * Whether only the gas view should be displayed
   */
  onlyGas?: boolean;
  /**
   * Function to validate the amount for the given transaction/total
   */
  validateAmount: (args: ValidateAmountArgs) => string | undefined;
  /**
   * Whether the transaction is legacy (non EIP1559)
   */
  legacy: boolean;
  /**
   * Legacy gas data object
   */
  legacyGasData: GasData;
  /**
   * EIP1559 gas data object
   */
  EIP1559GasData: GasData;
  /**
   * EIP1559 gas transaction object
   */
  EIP1559GasTxn: GasData;
  /**
   * Function called when the gas selection changes
   */
  onGasChanged: (gasValue: string) => void;
  /**
   * Function called when the gas selection is canceled
   */
  onGasCanceled: (gasValue: string) => void;
  /**
   * Function to update the gas state on the parent
   */
  updateGasState: (args: GasData) => void;
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

  const transaction = useSelector((state: RootState) => state.transaction);
  const gasFeeEstimate = useSelector(selectGasFeeEstimates);
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
    (gasTxn: GasData, gasObj: GasData) => {
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
    (gasTxn: GasData, gasObj: GasData) => {
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
      (gasFeeEstimate as GasData)[selectedGas]?.suggestedMaxPriorityFeePerGas,
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
            primaryCurrency={primaryCurrency as string}
            chainId={chainId}
            onCancel={onCancelGas}
            onSave={onSaveEIP1559GasOption}
            animateOnChange={animateOnChange}
            isAnimating={isAnimating}
            analyticsParams={getGasAnalyticsParams()}
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
