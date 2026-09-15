import React, {
  ComponentProps,
  ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Eip1559GasFee } from '@metamask/gas-fee-controller';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Modal from 'react-native-modal';
import { useSelector } from 'react-redux';
import { selectGasFeeEstimates } from '../../../../../../../../selectors/confirmTransaction';
import { selectGasFeeControllerEstimateType } from '../../../../../../../../selectors/gasFeeController';
import { selectPrimaryCurrency } from '../../../../../../../../selectors/settings';
import { useAppThemeFromContext } from '../../../../../../../../util/theme';
import EditGasFee1559Update from '../../../../components/EditGasFee1559Update';
import {
  GasFeeEstimateLevel,
  GasFeeEstimateOptions,
  SelectedGasObject,
} from '../../../../components/EditGasFee1559Update/types';
import EditGasFeeLegacyUpdate from '../../../../components/EditGasFeeLegacyUpdate';
import {
  EditLegacyGasTransaction,
  LegacyGasObject,
} from '../../../../components/EditGasFeeLegacyUpdate/types';
import { GasTransaction } from '../../../../components/TransactionReview/TransactionReviewEIP1559Update/types';
import createStyles from './CustomGasModal.styles';
import { CustomGasModalProps } from './CustomGasModal.types';
import { RootState } from '../../../../../../../../reducers';

type EIP1559GasData = NonNullable<CustomGasModalProps['EIP1559GasData']>;

type LegacyGasTxn = EditLegacyGasTransaction & {
  totalHex?: string;
  error?: string;
};

type EIP1559GasTxnUpdate = GasTransaction & {
  error?: string;
};

// The gas editors are untyped JS components whose inferred props are all
// required; they tolerate omitted props at runtime, so treat them as optional.
const EditGasFee1559 = EditGasFee1559Update as ComponentType<
  Partial<ComponentProps<typeof EditGasFee1559Update>>
>;
const EditGasFeeLegacy = EditGasFeeLegacyUpdate as ComponentType<
  Partial<ComponentProps<typeof EditGasFeeLegacyUpdate>>
>;

type EIP1559GasObj = Partial<EIP1559GasData> & GasFeeEstimateOptions;

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
  // The transaction slice is indexed as `unknown`; chainId is set as a hex string.
  const chainId = transaction?.chainId as string | undefined;
  const selectedAsset = useSelector(
    (state: RootState) => state.transaction.selectedAsset,
  );
  const gasEstimateType = useSelector(selectGasFeeControllerEstimateType);

  const [selectedGas, setSelectedGas] = useState(gasSelected);
  const [eip1559Txn, setEIP1559Txn] = useState<GasTransaction | undefined>(
    EIP1559GasTxn,
  );
  const [legacyGasObj, setLegacyGasObj] = useState<
    LegacyGasObject | undefined
  >(legacyGasData);
  const [eip1559GasObj, setEIP1559GasObj] = useState<
    EIP1559GasObj | undefined
  >(EIP1559GasData);
  const [isViewAnimating, setIsViewAnimating] = useState<boolean>(false);
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

  const onChangeGas = (gasValue: string | null) => {
    setSelectedGas(gasValue as string);
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
    (gasTxn: LegacyGasTxn, gasObj: LegacyGasObject) => {
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
    (gasTxn: EIP1559GasTxnUpdate, gasObj: EIP1559GasObj) => {
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

  // The editor resolves any missing value from the selected estimate level.
  const eip1559GasObject = {
    suggestedMaxFeePerGas:
      eip1559GasObj?.suggestedMaxFeePerGas ||
      eip1559GasObj?.[selectedGas as GasFeeEstimateLevel]?.suggestedMaxFeePerGas,
    suggestedMaxPriorityFeePerGas:
      eip1559GasObj?.suggestedMaxPriorityFeePerGas ||
      (
        gasFeeEstimate as Partial<Record<string, Partial<Eip1559GasFee>>>
      )[selectedGas]?.suggestedMaxPriorityFeePerGas,
    suggestedGasLimit:
      eip1559GasObj?.suggestedGasLimit || eip1559Txn?.suggestedGasLimit,
  } as SelectedGasObject;

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
            gasOptions={gasFeeEstimate as GasFeeEstimateOptions}
            onChange={onChangeGas}
            primaryCurrency={primaryCurrency}
            chainId={chainId}
            onCancel={onCancelGas}
            onSave={onSaveEIP1559GasOption}
            animateOnChange={animateOnChange}
            isAnimating={isAnimating}
            analyticsParams={getGasAnalyticsParams()}
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
