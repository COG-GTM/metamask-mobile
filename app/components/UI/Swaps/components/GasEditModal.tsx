import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Modal from 'react-native-modal';
import {
  GAS_ESTIMATE_TYPES,
  type EthGasPriceEstimate,
  type GasEstimateType,
  type GasFeeEstimates,
  type LegacyGasPriceEstimate,
} from '@metamask/gas-fee-controller';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { connect } from 'react-redux';
import type {
  CustomEthGasPriceEstimate,
  CustomGasFee,
} from '@metamask/swaps-controller/dist/types';
import type { Hex } from '@metamask/utils';
import type { RootState } from '../../../../reducers';

import Text from '../../../Base/Text';
import InfoModal from './InfoModal';
import EditGasFeeLegacy, { type LegacyGasFee } from '../../EditGasFeeLegacy';
import EditGasFee1559, {
  type EIP1559GasFee,
  type EIP1559GasLevel,
  type EIP1559GasOptions,
} from '../../EditGasFee1559';
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

type GasOption = 'low' | 'medium' | 'high';
type GasFeeEstimate =
  | GasFeeEstimates
  | LegacyGasPriceEstimate
  | EthGasPriceEstimate;

interface ParsedTransactionData {
  error?: string;
  renderableGasFeeMinNative?: string;
  renderableGasFeeMinConversion?: string;
  renderableGasFeeMaxNative?: string;
  renderableGasFeeMaxConversion?: string;
  renderableMaxPriorityFeeNative?: string;
  renderableMaxPriorityFeeConversion?: string;
  renderableMaxFeePerGasNative?: string;
  renderableMaxFeePerGasConversion?: string;
  timeEstimate?: string;
  timeEstimateColor?: string;
  timeEstimateId?: string;
  transactionFee?: string;
  transactionFeeFiat?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  suggestedGasPrice?: string;
  totalMaxHex?: { toString: (radix?: number) => string };
  totalHex?: { toString: (radix?: number) => string };
  estimatedBaseFee?: string;
  suggestedEstimatedGasLimit?: string;
}

interface LegacyGasUpdate {
  gasPrice?: string;
  selected: GasOption | null;
}

interface GasEditModalProps {
  dismiss: () => void;
  gasEstimateType: GasEstimateType;
  gasFeeEstimates: GasFeeEstimate;
  defaultGasFeeOptionLegacy?: string;
  defaultGasFeeOptionFeeMarket?: EIP1559GasLevel;
  isVisible: boolean;
  onGasUpdate: (
    gas: Partial<CustomGasFee> | LegacyGasUpdate,
    gasLimit?: string,
  ) => void;
  customGasFee?: CustomEthGasPriceEstimate | CustomGasFee | null;
  initialGasLimit: string;
  tradeGasLimit?: string;
  isNativeAsset: boolean;
  tradeValue: string;
  sourceAmount: string;
  checkEnoughEthBalance: (value?: string) => boolean;
  currentCurrency: string;
  conversionRate: number | null | undefined;
  primaryCurrency: string;
  chainId: Hex;
  ticker: string;
  animateOnChange: boolean;
}

const isGasOption = (value: string): value is GasOption =>
  value === 'low' || value === 'medium' || value === 'high';

const toGasOption = (value: string | null | undefined): GasOption | null =>
  value && isGasOption(value) ? value : null;

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
  const defaultGasOption =
    gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET
      ? defaultGasFeeOptionFeeMarket
      : defaultGasFeeOptionLegacy;
  const [gasSelected, setGasSelected] = useState<GasOption | null>(() => {
    if (customGasFee) {
      return customGasFee.selected ?? null;
    }

    return defaultGasOption && isGasOption(defaultGasOption)
      ? defaultGasOption
      : null;
  });
  const [stopUpdateGas, setStopUpdateGas] = useState(false);
  const [hasEnoughEthBalance, setHasEnoughEthBalance] = useState(true);
  const [EIP1559TransactionDataTemp, setEIP1559TransactionDataTemp] =
    useState<ParsedTransactionData>({});
  const [LegacyTransactionDataTemp, setLegacyTransactionDataTemp] =
    useState<ParsedTransactionData>({});
  const [
    isGasFeeRecommendationVisible,
    ,
    showGasFeeRecommendation,
    hideGasFeeRecommendation,
  ] = useModalHandler(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    setGasSelected(customGasFee?.selected ?? null);
  }, [customGasFee]);

  useEffect(() => {
    if (
      EIP1559TransactionDataTemp &&
      Object.keys(EIP1559TransactionDataTemp).length > 0
    ) {
      setHasEnoughEthBalance(
        checkEnoughEthBalance(
          EIP1559TransactionDataTemp?.totalMaxHex?.toString(16),
        ),
      );
    } else if (
      LegacyTransactionDataTemp &&
      Object.keys(LegacyTransactionDataTemp).length > 0
    ) {
      setHasEnoughEthBalance(
        checkEnoughEthBalance(
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
          {
            currentCurrency,
            conversionRate,
            nativeCurrency: ticker,
            selectedGasFee: {
              suggestedMaxFeePerGas:
                (gasFeeEstimates as GasFeeEstimates)[
                  gasSelected
                ].suggestedMaxFeePerGas,
              suggestedMaxPriorityFeePerGas:
                (gasFeeEstimates as GasFeeEstimates)[
                  gasSelected
                ].suggestedMaxPriorityFeePerGas,
              suggestedGasLimit: initialGasLimit,
              suggestedEstimatedGasLimit: tradeGasLimit,
              estimatedBaseFee: (gasFeeEstimates as GasFeeEstimates)
                .estimatedBaseFee,
              selectedOption: gasSelected,
              recommended: RECOMMENDED,
            },
            swapsParams: {
              isNativeAsset,
              tradeValue,
              sourceAmount,
            },
            gasFeeEstimates,
          } as Parameters<typeof parseTransactionEIP1559>[0],
          { onlyGas: true },
        ),
      );
    } else {
      setLegacyTransactionDataTemp(
        parseTransactionLegacy(
          {
            currentCurrency,
            conversionRate,
            ticker,
            selectedGasFee: {
              suggestedGasLimit: initialGasLimit,
              suggestedGasPrice:
                gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE
                  ? (gasFeeEstimates as EthGasPriceEstimate).gasPrice
                  : (gasFeeEstimates as LegacyGasPriceEstimate)[gasSelected],
            },
          } as Parameters<typeof parseTransactionLegacy>[0],
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
      }: ParsedTransactionData,
      selectedOption: string | null,
    ) => {
      const selected = toGasOption(selectedOption);
      if (!selected) {
        setStopUpdateGas(true);
      }
      setGasSelected(selected);
      setEIP1559TransactionDataTemp(
        parseTransactionEIP1559(
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
          } as Parameters<typeof parseTransactionEIP1559>[0],
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
    (
      { suggestedGasLimit, suggestedGasPrice }: ParsedTransactionData,
      selectedOption: string | null,
    ) => {
      const selected = toGasOption(selectedOption);
      setStopUpdateGas(!selected);
      setGasSelected(selected);
      setLegacyTransactionDataTemp(
        parseTransactionLegacy(
          {
            currentCurrency,
            conversionRate,
            ticker,
            selectedGasFee: {
              suggestedGasLimit: selected ? initialGasLimit : suggestedGasLimit,
              suggestedGasPrice,
            },
          } as Parameters<typeof parseTransactionLegacy>[0],
          { onlyGas: true },
        ),
      );
    },
    [conversionRate, currentCurrency, initialGasLimit, ticker],
  );

  const saveGasEdition = useCallback(
    (selectedOption: string | null | undefined) => {
      const selected = toGasOption(selectedOption);
      if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
        const {
          suggestedMaxFeePerGas: maxFeePerGas,
          suggestedMaxPriorityFeePerGas: maxPriorityFeePerGas,
          estimatedBaseFee,
          suggestedGasLimit,
        } = EIP1559TransactionDataTemp;
        onGasUpdate(
          {
            maxFeePerGas,
            maxPriorityFeePerGas,
            estimatedBaseFee,
            selected: selected ?? undefined,
          },
          suggestedGasLimit,
        );
      } else {
        const { suggestedGasPrice: gasPrice, suggestedGasLimit } =
          LegacyTransactionDataTemp;
        onGasUpdate(
          {
            gasPrice,
            selected,
          },
          suggestedGasLimit,
        );
      }
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
    dismiss();
  }, [customGasFee, dismiss, gasEstimateType]);

  const feeMarketGasOptions = useMemo<EIP1559GasOptions>(() => {
    const { low, medium, high } = gasFeeEstimates as GasFeeEstimates;
    return { low, medium, high };
  }, [gasFeeEstimates]);

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
              selected={gasSelected ?? undefined}
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
                  : EIP1559TransactionDataTemp.error
              }
              suggestedEstimateOption={defaultGasFeeOptionFeeMarket}
              gasFee={EIP1559TransactionDataTemp as EIP1559GasFee}
              gasOptions={feeMarketGasOptions}
              onChange={calculateTempGasFee}
              gasFeeNative={
                EIP1559TransactionDataTemp.renderableGasFeeMinNative
              }
              gasFeeConversion={
                EIP1559TransactionDataTemp.renderableGasFeeMinConversion
              }
              gasFeeMaxNative={
                EIP1559TransactionDataTemp.renderableGasFeeMaxNative
              }
              gasFeeMaxConversion={
                EIP1559TransactionDataTemp.renderableGasFeeMaxConversion
              }
              maxPriorityFeeNative={
                EIP1559TransactionDataTemp.renderableMaxPriorityFeeNative
              }
              maxPriorityFeeConversion={
                EIP1559TransactionDataTemp.renderableMaxPriorityFeeConversion
              }
              maxFeePerGasNative={
                EIP1559TransactionDataTemp.renderableMaxFeePerGasNative
              }
              maxFeePerGasConversion={
                EIP1559TransactionDataTemp.renderableMaxFeePerGasConversion
              }
              primaryCurrency={primaryCurrency}
              chainId={chainId}
              timeEstimate={EIP1559TransactionDataTemp.timeEstimate}
              timeEstimateColor={EIP1559TransactionDataTemp.timeEstimateColor}
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
                        style={undefined}
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
            selected={gasSelected ?? undefined}
            ignoreOptions={[GAS_OPTIONS.LOW]}
            warningMinimumEstimateOption={GAS_OPTIONS.MEDIUM}
            gasFee={LegacyTransactionDataTemp as LegacyGasFee}
            gasEstimateType={gasEstimateType}
            gasOptions={
              gasFeeEstimates as LegacyGasPriceEstimate | EthGasPriceEstimate
            }
            onChange={calculateTempGasFeeLegacy}
            gasFeeNative={LegacyTransactionDataTemp.transactionFee}
            gasFeeConversion={LegacyTransactionDataTemp.transactionFeeFiat}
            error={
              !hasEnoughEthBalance
                ? strings('transaction.insufficient')
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

const mapStateToProps = (state: RootState) => ({
  conversionRate: selectConversionRate(state),
  currentCurrency: selectCurrentCurrency(state),
  ticker: selectEvmTicker(state),
  chainId: selectEvmChainId(state),
  primaryCurrency: state.settings.primaryCurrency,
});

export default connect(mapStateToProps)(GasEditModal);
