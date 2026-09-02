import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Modal from 'react-native-modal';
import {
  GAS_ESTIMATE_TYPES,
  GasEstimateType,
  GasFeeEstimates,
  LegacyGasPriceEstimate,
  EthGasPriceEstimate,
} from '@metamask/gas-fee-controller';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { connect } from 'react-redux';
import { Hex } from '@metamask/utils';
import type {
  CustomEthGasPriceEstimate,
  CustomGasFee,
} from '@metamask/swaps-controller/dist/types';

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
import { RootState } from '../../../../reducers';

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
type AvailableGasFeeEstimates =
  | GasFeeEstimates
  | LegacyGasPriceEstimate
  | EthGasPriceEstimate;
type EIP1559TransactionData = Partial<
  NonNullable<ReturnType<typeof parseTransactionEIP1559>>
> & { error?: string };
type LegacyTransactionData = Partial<
  NonNullable<ReturnType<typeof parseTransactionLegacy>>
> & { error?: string };

interface StateProps {
  currentCurrency: string;
  conversionRate: number;
  primaryCurrency: string;
  chainId: Hex;
  ticker: string;
}

interface OwnProps {
  dismiss: () => void;
  gasEstimateType: GasEstimateType;
  gasFeeEstimates: AvailableGasFeeEstimates;
  defaultGasFeeOptionLegacy?: GasOption;
  defaultGasFeeOptionFeeLegacy?: GasOption;
  defaultGasFeeOptionFeeMarket?: GasOption;
  isVisible?: boolean;
  onGasUpdate: (
    customGas: CustomEthGasPriceEstimate | CustomGasFee,
    gasLimit?: string,
  ) => void;
  customGasFee?: CustomEthGasPriceEstimate | CustomGasFee | null;
  gasLimit?: string;
  customGasLimit?: string | null;
  initialGasLimit: string;
  tradeGasLimit?: string;
  isNativeAsset?: boolean;
  tradeValue?: string;
  sourceAmount?: string;
  checkEnoughEthBalance: (gasAmountHex?: string) => boolean;
  animateOnChange?: boolean;
}

type Props = StateProps & OwnProps;

interface EIP1559GasSelection {
  suggestedMaxFeePerGas: string;
  suggestedMaxPriorityFeePerGas: string;
  suggestedGasLimit: string;
  estimatedBaseFee?: string;
  suggestedEstimatedGasLimit?: string;
}

interface LegacyGasSelection {
  suggestedGasLimit: string;
  suggestedGasPrice: string;
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
}: Props) {
  const [gasSelected, setGasSelected] = useState<GasOption | null | undefined>(
    customGasFee
      ? customGasFee.selected ?? null
      : gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET
      ? defaultGasFeeOptionFeeMarket
      : defaultGasFeeOptionLegacy,
  );
  const [stopUpdateGas, setStopUpdateGas] = useState(false);
  const [hasEnoughEthBalance, setHasEnoughEthBalance] = useState(true);
  const [EIP1559TransactionDataTemp, setEIP1559TransactionDataTemp] = useState(
    {} as EIP1559TransactionData,
  );
  const [LegacyTransactionDataTemp, setLegacyTransactionDataTemp] = useState(
    {} as LegacyTransactionData,
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
      const feeMarketEstimates = gasFeeEstimates as GasFeeEstimates;
      setEIP1559TransactionDataTemp(
        parseTransactionEIP1559(
          {
            currentCurrency,
            conversionRate,
            nativeCurrency: ticker,
            selectedGasFee: {
              suggestedMaxFeePerGas:
                feeMarketEstimates[gasSelected].suggestedMaxFeePerGas,
              suggestedMaxPriorityFeePerGas:
                feeMarketEstimates[gasSelected]
                  .suggestedMaxPriorityFeePerGas,
              suggestedGasLimit: initialGasLimit,
              suggestedEstimatedGasLimit: tradeGasLimit,
              estimatedBaseFee: feeMarketEstimates.estimatedBaseFee,
              selectedOption: gasSelected,
              recommended: RECOMMENDED,
            },
            swapsParams: {
              isNativeAsset,
              tradeValue,
              sourceAmount,
            },
            contractExchangeRates: undefined,
            gasFeeEstimates: feeMarketEstimates,
          },
          { onlyGas: true },
        ),
      );
    } else {
      const legacyEstimates = gasFeeEstimates as
        | LegacyGasPriceEstimate
        | EthGasPriceEstimate;
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
                  ? (legacyEstimates as EthGasPriceEstimate).gasPrice
                  : (legacyEstimates as LegacyGasPriceEstimate)[gasSelected],
            },
            contractExchangeRates: undefined,
            multiLayerL1FeeTotal: undefined,
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
      }: EIP1559GasSelection,
      selected?: GasOption,
    ) => {
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
            contractExchangeRates: undefined,
            gasFeeEstimates: gasFeeEstimates as GasFeeEstimates,
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
    (
      { suggestedGasLimit, suggestedGasPrice }: LegacyGasSelection,
      selected?: GasOption,
    ) => {
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
            contractExchangeRates: undefined,
            multiLayerL1FeeTotal: undefined,
          },
          { onlyGas: true },
        ),
      );
    },
    [conversionRate, currentCurrency, initialGasLimit, ticker],
  );

  const saveGasEdition = useCallback(
    (selected?: GasOption) => {
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
            selected,
          } as CustomGasFee,
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
                  : EIP1559TransactionDataTemp.error
              }
              suggestedEstimateOption={defaultGasFeeOptionFeeMarket}
              gasFee={EIP1559TransactionDataTemp}
              gasOptions={gasFeeEstimates}
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
            gasFeeNative={LegacyTransactionDataTemp.transactionFee}
            gasFeeConversion={LegacyTransactionDataTemp.transactionFeeFiat}
            {...({
              gasPriceConversion:
                LegacyTransactionDataTemp.transactionFeeFiat,
            } as { gasPriceConversion?: string })}
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

const mapStateToProps = (state: RootState): StateProps => ({
  conversionRate: selectConversionRate(state) ?? 0,
  currentCurrency: selectCurrentCurrency(state) ?? '',
  ticker: selectEvmTicker(state),
  chainId: selectEvmChainId(state),
  primaryCurrency: state.settings.primaryCurrency,
});

export default connect(mapStateToProps)(GasEditModal);
