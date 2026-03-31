import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Modal from 'react-native-modal';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { connect } from 'react-redux';

import Text from '../../../Base/Text';
import InfoModal from './InfoModal';
import EditGasFeeLegacy from '../../EditGasFeeLegacy';
import EditGasFee1559 from '../../EditGasFee1559';
import {
  parseTransactionEIP1559,
  parseTransactionLegacy,
} from '../../../../util/transactions';
import useModalHandler from '../../../Base/hooks/useModalHandler';
import { strings } from '../../../../../locales/i18n';
import AppConstants from '../../../../core/AppConstants';
import { useTheme } from '../../../../util/theme';
import {
  selectEvmChainId,
  selectEvmTicker,
} from '../../../../selectors/networkController';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../../selectors/currencyRateController';

const GAS_OPTIONS = AppConstants.GAS_OPTIONS;

const styles = StyleSheet.create({
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  keyboardAwareWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  text: {
    lineHeight: 20,
  },
});

const RECOMMENDED = GAS_OPTIONS.HIGH;

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface GasEditModalProps {
  dismiss?: () => void;
  gasEstimateType?: string;
  gasFeeEstimates?: Record<string, any>;
  defaultGasFeeOptionFeeMarket?: string;
  defaultGasFeeOptionLegacy?: string;
  isVisible?: boolean;
  onGasUpdate?: (gas: any, gasLimit?: string) => void;
  customGasFee?: Record<string, any>;
  initialGasLimit?: string;
  tradeGasLimit?: string;
  isNativeAsset?: boolean;
  tradeValue?: string;
  sourceAmount?: string;
  checkEnoughEthBalance?: (hex: string) => boolean;
  currentCurrency?: string;
  conversionRate?: number;
  primaryCurrency?: string;
  chainId?: string;
  ticker?: string;
  animateOnChange?: boolean;
}

function GasEditModal({
  dismiss,
  gasEstimateType,
  gasFeeEstimates,
  defaultGasFeeOptionLegacy = GAS_OPTIONS.MEDIUM,
  defaultGasFeeOptionFeeMarket = GAS_OPTIONS.HIGH,
  isVisible,
  onGasUpdate,
  customGasFee,
  initialGasLimit,
  tradeGasLimit,
  isNativeAsset,
  tradeValue,
  sourceAmount,
  checkEnoughEthBalance,
  currentCurrency,
  conversionRate,
  primaryCurrency,
  chainId,
  ticker,
  animateOnChange,
}: GasEditModalProps) {
  const [gasSelected, setGasSelected] = useState(
    customGasFee
      ? customGasFee.selected ?? null
      : gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET
      ? defaultGasFeeOptionFeeMarket
      : defaultGasFeeOptionLegacy,
  );
  const [stopUpdateGas, setStopUpdateGas] = useState(false);
  const [hasEnoughEthBalance, setHasEnoughEthBalance] = useState(true);
  const [EIP1559TransactionDataTemp, setEIP1559TransactionDataTemp] = useState(
    {},
  );
  const [LegacyTransactionDataTemp, setLegacyTransactionDataTemp] = useState(
    {},
  );
  const [
    isGasFeeRecommendationVisible,
    ,
    showGasFeeRecommendation,
    hideGasFeeRecommendation,
  ] = useModalHandler(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    setGasSelected(customGasFee?.selected);
  }, [customGasFee]);

  useEffect(() => {
    if (
      EIP1559TransactionDataTemp &&
      Object.keys(EIP1559TransactionDataTemp).length > 0
    ) {
      setHasEnoughEthBalance(
        // @ts-expect-error Legacy JS code needs type refinement
        checkEnoughEthBalance(
          // @ts-expect-error Legacy JS code needs type refinement
          EIP1559TransactionDataTemp?.totalMaxHex?.toString(16),
        ),
      );
    } else if (
      LegacyTransactionDataTemp &&
      Object.keys(LegacyTransactionDataTemp).length > 0
    ) {
      setHasEnoughEthBalance(
        // @ts-expect-error Legacy JS code needs type refinement
        checkEnoughEthBalance(
          // @ts-expect-error Legacy JS code needs type refinement
          LegacyTransactionDataTemp?.totalHex?.toString(16),
        ),
      );
    }
  }, [
    EIP1559TransactionDataTemp,
    LegacyTransactionDataTemp,
    checkEnoughEthBalance,
  ]);

  useEffect(() => {
    if (stopUpdateGas || !gasSelected) {
      return;
    }
    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      setEIP1559TransactionDataTemp(
        parseTransactionEIP1559(
          // @ts-expect-error Legacy JS code needs type refinement
          {
            currentCurrency,
            conversionRate,
            nativeCurrency: ticker,
            selectedGasFee: {
              suggestedMaxFeePerGas:
                // @ts-expect-error Legacy JS code needs type refinement
                gasFeeEstimates[gasSelected].suggestedMaxFeePerGas,
              suggestedMaxPriorityFeePerGas:
                // @ts-expect-error Legacy JS code needs type refinement
                gasFeeEstimates[gasSelected].suggestedMaxPriorityFeePerGas,
              suggestedGasLimit: initialGasLimit,
              suggestedEstimatedGasLimit: tradeGasLimit,
              // @ts-expect-error Legacy JS code needs type refinement
              estimatedBaseFee: gasFeeEstimates.estimatedBaseFee,
              selectedOption: gasSelected,
              recommended: RECOMMENDED,
            },
            swapsParams: {
              isNativeAsset,
              tradeValue,
              sourceAmount,
            },
            gasFeeEstimates,
          },
          { onlyGas: true },
        ),
      );
    } else {
      setLegacyTransactionDataTemp(
        parseTransactionLegacy(
          // @ts-expect-error Legacy JS code needs type refinement
          {
            currentCurrency,
            conversionRate,
            ticker,
            selectedGasFee: {
              suggestedGasLimit: initialGasLimit,
              suggestedGasPrice:
                gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE
                  // @ts-expect-error Legacy JS code needs type refinement
                  ? gasFeeEstimates.gasPrice
                  // @ts-expect-error Legacy JS code needs type refinement
                  : gasFeeEstimates[gasSelected],
            },
          },
          { onlyGas: true },
        ),
      );
    }
  }, [
    conversionRate,
    currentCurrency,
    gasEstimateType,
    gasFeeEstimates,
    gasSelected,
    initialGasLimit,
    isNativeAsset,
    sourceAmount,
    stopUpdateGas,
    ticker,
    tradeGasLimit,
    tradeValue,
  ]);

  const calculateTempGasFee = useCallback(
    (
      {
        suggestedMaxFeePerGas,
        suggestedMaxPriorityFeePerGas,
        suggestedGasLimit,
        estimatedBaseFee,
        suggestedEstimatedGasLimit,
      }: any,
      selected: any,
    ) => {
      if (!selected) {
        setStopUpdateGas(true);
      }
      setGasSelected(selected);
      setEIP1559TransactionDataTemp(
        parseTransactionEIP1559(
          // @ts-expect-error Legacy JS code needs type refinement
          {
            currentCurrency,
            conversionRate,
            nativeCurrency: ticker,
            selectedGasFee: {
              suggestedMaxFeePerGas,
              suggestedMaxPriorityFeePerGas,
              suggestedGasLimit: selected ? initialGasLimit : suggestedGasLimit,
              suggestedEstimatedGasLimit,
              estimatedBaseFee,
              selectedOption: selected,
              recommended: RECOMMENDED,
            },
            swapsParams: {
              isNativeAsset,
              tradeValue,
              sourceAmount,
            },
            gasFeeEstimates,
          },
          { onlyGas: true },
        ),
      );
      if (selected) {
        setStopUpdateGas(false);
      }
    },
    [
      conversionRate,
      currentCurrency,
      gasFeeEstimates,
      initialGasLimit,
      isNativeAsset,
      sourceAmount,
      tradeValue,
      ticker,
    ],
  );

  const calculateTempGasFeeLegacy = useCallback(
    ({ suggestedGasLimit, suggestedGasPrice }: any, selected: any) => {
      setStopUpdateGas(!selected);
      setGasSelected(selected);
      setLegacyTransactionDataTemp(
        parseTransactionLegacy(
          // @ts-expect-error Legacy JS code needs type refinement
          {
            currentCurrency,
            conversionRate,
            ticker,
            selectedGasFee: {
              suggestedGasLimit: selected ? initialGasLimit : suggestedGasLimit,
              suggestedGasPrice,
            },
          },
          { onlyGas: true },
        ),
      );
    },
    [conversionRate, currentCurrency, initialGasLimit, ticker],
  );

  const saveGasEdition = useCallback(
    (selected: any) => {
      if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
        const {
          // @ts-expect-error Legacy JS code needs type refinement
          suggestedMaxFeePerGas: maxFeePerGas,
          // @ts-expect-error Legacy JS code needs type refinement
          suggestedMaxPriorityFeePerGas: maxPriorityFeePerGas,
          // @ts-expect-error Legacy JS code needs type refinement
          estimatedBaseFee,
          // @ts-expect-error Legacy JS code needs type refinement
          suggestedGasLimit,
        } = EIP1559TransactionDataTemp;
        // @ts-expect-error Legacy JS code needs type refinement
        onGasUpdate(
          {
            maxFeePerGas,
            maxPriorityFeePerGas,
            estimatedBaseFee,
            selected,
          },
          suggestedGasLimit,
        );
      } else {
        // @ts-expect-error Legacy JS code needs type refinement
        const { suggestedGasPrice: gasPrice, suggestedGasLimit } =
          LegacyTransactionDataTemp;
        // @ts-expect-error Legacy JS code needs type refinement
        onGasUpdate(
          {
            gasPrice,
            selected,
          },
          suggestedGasLimit,
        );
      }
      // @ts-expect-error Legacy JS code needs type refinement
      dismiss();
    },
    [
      EIP1559TransactionDataTemp,
      LegacyTransactionDataTemp,
      dismiss,
      gasEstimateType,
      onGasUpdate,
    ],
  );

  const cancelGasEdition = useCallback(() => {
    setGasSelected(
      customGasFee
        ? customGasFee.selected ?? null
        : gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET
        ? GAS_OPTIONS.HIGH
        : GAS_OPTIONS.MEDIUM,
    );
    // @ts-expect-error Legacy JS code needs type refinement
    dismiss();
  }, [customGasFee, dismiss, gasEstimateType]);

  const onGasAnimationStart = useCallback(() => setIsAnimating(true), []);
  const onGasAnimationEnd = useCallback(() => setIsAnimating(false), []);

  return (
    <Modal
      isVisible={isVisible}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.bottomModal}
      backdropColor={colors.overlay.default}
      backdropOpacity={1}
      animationInTiming={600}
      animationOutTiming={600}
      onBackdropPress={cancelGasEdition}
      onBackButtonPress={cancelGasEdition}
      onSwipeComplete={cancelGasEdition}
      swipeDirection={'down'}
      propagateSwipe
    >
      <KeyboardAwareScrollView
        contentContainerStyle={styles.keyboardAwareWrapper}
      >
        {gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ? (
          <>
            <EditGasFee1559
              selected={gasSelected}
              ignoreOptions={[GAS_OPTIONS.LOW]}
              extendOptions={{ [GAS_OPTIONS.MEDIUM]: { error: true } }}
              warningMinimumEstimateOption={GAS_OPTIONS.MEDIUM}
              warning={
                gasSelected === GAS_OPTIONS.MEDIUM
                  ? strings('swaps.medium_selected_warning')
                  : undefined
              }
              error={
                !hasEnoughEthBalance
                  ? strings('transaction.insufficient')
                  // @ts-expect-error Legacy JS code needs type refinement
                  : EIP1559TransactionDataTemp.error
              }
              suggestedEstimateOption={defaultGasFeeOptionFeeMarket}
              gasFee={EIP1559TransactionDataTemp}
              gasOptions={gasFeeEstimates}
              onChange={calculateTempGasFee}
              gasFeeNative={
                // @ts-expect-error Legacy JS code needs type refinement
                EIP1559TransactionDataTemp.renderableGasFeeMinNative
              }
              gasFeeConversion={
                // @ts-expect-error Legacy JS code needs type refinement
                EIP1559TransactionDataTemp.renderableGasFeeMinConversion
              }
              gasFeeMaxNative={
                // @ts-expect-error Legacy JS code needs type refinement
                EIP1559TransactionDataTemp.renderableGasFeeMaxNative
              }
              gasFeeMaxConversion={
                // @ts-expect-error Legacy JS code needs type refinement
                EIP1559TransactionDataTemp.renderableGasFeeMaxConversion
              }
              maxPriorityFeeNative={
                // @ts-expect-error Legacy JS code needs type refinement
                EIP1559TransactionDataTemp.renderableMaxPriorityFeeNative
              }
              maxPriorityFeeConversion={
                // @ts-expect-error Legacy JS code needs type refinement
                EIP1559TransactionDataTemp.renderableMaxPriorityFeeConversion
              }
              maxFeePerGasNative={
                // @ts-expect-error Legacy JS code needs type refinement
                EIP1559TransactionDataTemp.renderableMaxFeePerGasNative
              }
              maxFeePerGasConversion={
                // @ts-expect-error Legacy JS code needs type refinement
                EIP1559TransactionDataTemp.renderableMaxFeePerGasConversion
              }
              primaryCurrency={primaryCurrency}
              chainId={chainId}
              // @ts-expect-error Legacy JS code needs type refinement
              timeEstimate={EIP1559TransactionDataTemp.timeEstimate}
              // @ts-expect-error Legacy JS code needs type refinement
              timeEstimateColor={EIP1559TransactionDataTemp.timeEstimateColor}
              // @ts-expect-error Legacy JS code needs type refinement
              timeEstimateId={EIP1559TransactionDataTemp.timeEstimateId}
              onCancel={cancelGasEdition}
              onSave={saveGasEdition}
              recommended={{
                name: GAS_OPTIONS.HIGH,
                // eslint-disable-next-line react/display-name
                render: () => (
                  <TouchableOpacity onPress={showGasFeeRecommendation}>
                    <Text noMargin link bold small centered>
                      {`${strings('swaps.recommended')} `}
                      <MaterialCommunityIcon
                        name="information"
                        size={14}
                        // @ts-expect-error Legacy JS code needs type refinement
                        style={styles.labelInfo}
                      />
                    </Text>
                  </TouchableOpacity>
                ),
              }}
              view="Swaps"
              animateOnChange={animateOnChange}
              isAnimating={isAnimating}
              onUpdatingValuesStart={onGasAnimationStart}
              onUpdatingValuesEnd={onGasAnimationEnd}
            />
            <InfoModal
              isVisible={isVisible && isGasFeeRecommendationVisible}
              toggleModal={hideGasFeeRecommendation}
              title={strings('swaps.recommended_gas')}
              body={
                <Text style={styles.text}>
                  {strings('swaps.high_recommendation')}
                </Text>
              }
            />
          </>
        ) : (
          <EditGasFeeLegacy
            selected={gasSelected}
            ignoreOptions={[GAS_OPTIONS.LOW]}
            warningMinimumEstimateOption={GAS_OPTIONS.MEDIUM}
            gasFee={LegacyTransactionDataTemp}
            gasEstimateType={gasEstimateType}
            gasOptions={gasFeeEstimates}
            onChange={calculateTempGasFeeLegacy}
            // @ts-expect-error Legacy JS code needs type refinement
            gasFeeNative={LegacyTransactionDataTemp.transactionFee}
            // @ts-expect-error Legacy JS code needs type refinement
            gasFeeConversion={LegacyTransactionDataTemp.transactionFeeFiat}
            // @ts-expect-error Legacy JS code needs type refinement
            gasPriceConversion={LegacyTransactionDataTemp.transactionFeeFiat}
            error={
              !hasEnoughEthBalance
                ? strings('transaction.insufficient')
                // @ts-expect-error Legacy JS code needs type refinement
                : LegacyTransactionDataTemp.error
            }
            primaryCurrency={primaryCurrency}
            chainId={chainId}
            onCancel={cancelGasEdition}
            onSave={saveGasEdition}
            view="Swaps"
            animateOnChange={animateOnChange}
            isAnimating={isAnimating}
            onUpdatingValuesStart={onGasAnimationStart}
            onUpdatingValuesEnd={onGasAnimationEnd}
          />
        )}
      </KeyboardAwareScrollView>
    </Modal>
  );
}

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: any) => ({
  conversionRate: selectConversionRate(state),
  currentCurrency: selectCurrentCurrency(state),
  ticker: selectEvmTicker(state),
  chainId: selectEvmChainId(state),
  primaryCurrency: state.settings.primaryCurrency,
});

// @ts-expect-error Legacy JS code needs type refinement
export default connect(mapStateToProps)(GasEditModal);
