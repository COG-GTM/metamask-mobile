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
import type { RootState } from '../../../../reducers';
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
  labelInfo: {},
});

const RECOMMENDED = GAS_OPTIONS.HIGH;

interface GasFeeEstimateOption {
  suggestedMaxFeePerGas: string;
  suggestedMaxPriorityFeePerGas: string;
}

interface GasFeeEstimates {
  low: GasFeeEstimateOption;
  medium: GasFeeEstimateOption;
  high: GasFeeEstimateOption;
  estimatedBaseFee: string;
  gasPrice?: string;
  [key: string]: GasFeeEstimateOption | string | undefined;
}

interface CustomGasFee {
  selected?: string | null;
  [key: string]: unknown;
}

interface TransactionData {
  totalMaxHex?: { toString: (radix?: number) => string };
  totalHex?: { toString: (radix?: number) => string };
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  estimatedBaseFee?: string;
  suggestedGasLimit?: string;
  suggestedGasPrice?: string;
  error?: string;
  renderableGasFeeMinNative?: string;
  renderableGasFeeMinConversion?: string;
  renderableGasFeeMaxNative?: string;
  renderableGasFeeMaxConversion?: string;
  renderableMaxPriorityFeeNative?: string;
  renderableMaxPriorityFeeConversion?: string;
  renderableMaxFeePerGasNative?: string;
  renderableMaxFeePerGasConversion?: string;
  timeEstimate?: string | null;
  timeEstimateColor?: string;
  timeEstimateId?: string;
  transactionFee?: string;
  transactionFeeFiat?: string;
}

interface EIP1559GasInput {
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  estimatedBaseFee?: string;
  suggestedEstimatedGasLimit?: string;
}

interface LegacyGasInput {
  suggestedGasLimit?: string;
  suggestedGasPrice?: string;
}

interface EditGasFeeGasFee {
  suggestedGasLimit?: string;
  suggestedGasPrice?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedMaxFeePerGas?: string;
  [key: string]: string | number | undefined;
}

type EditGasFee1559Options = Record<string, EditGasFeeGasFee>;
type EditGasFeeLegacyOptions = Record<string, string> & {
  gasPrice?: string;
};

interface CustomGasUpdate {
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedBaseFee?: string;
  gasPrice?: string;
  selected?: string | null;
  [key: string]: unknown;
}

interface OwnProps {
  /**
   * Function to dismiss modal
   */
  dismiss?: () => void;
  /**
   * Estimate type returned by the gas fee controller, can be fee-market, legacy, eth_gasPrice or none
   */
  gasEstimateType?: string;
  /**
   * Gas fee estimates returned by the gas fee controller
   */
  gasFeeEstimates: GasFeeEstimates;
  /**
   * Default gas option ('low', 'medium' or 'high') to for fee-market estimate type
   * This is used to show a warning below this option
   */
  defaultGasFeeOptionFeeMarket?: string;
  /**
   * Default gas option ('low', 'medium' or 'high') to for legacy estimate types
   * This is used to show a warning below this option
   */
  defaultGasFeeOptionLegacy?: string;
  /**
   * Wether this modal is visible
   */
  isVisible?: boolean;
  /**
   * Function that handles user saving the gas editors
   * It is called with arguments (customGas, )
   */
  onGasUpdate?: (customGas: CustomGasUpdate, gasLimit: string) => void;
  /**
   * usedCustomGas from Swaps Controller
   */
  customGasFee?: CustomGasFee;
  /**
   * Initial gas limit of the selected quote trade
   */
  initialGasLimit?: string;
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency?: ReturnType<typeof selectCurrentCurrency>;
  /**
   * ETH to current currency conversion rate
   */
  conversionRate?: ReturnType<typeof selectConversionRate>;
  /**
   * Gas limit of trade estimation
   */
  tradeGasLimit?: string;
  /**
   * Primary currency, either ETH or Fiat
   */
  primaryCurrency?: string;
  /**
   * Chain Id
   */
  chainId?: ReturnType<typeof selectEvmChainId>;
  /**
   * Current network ticker
   */
  ticker?: ReturnType<typeof selectEvmTicker>;
  /**
   * Function to check if user has enough balance
   */
  checkEnoughEthBalance?: (totalHex?: string) => boolean;
  /**
   * Wether the swap is from native asset
   */
  isNativeAsset?: boolean;
  /**
   * Value of the trade
   */
  tradeValue?: string;
  /**
   * Amount of the swap
   */
  sourceAmount?: string;
  /**
   * If the values should animate upon update or not
   */
  animateOnChange?: boolean;
}

interface StateProps {
  conversionRate: ReturnType<typeof selectConversionRate>;
  currentCurrency: ReturnType<typeof selectCurrentCurrency>;
  ticker: ReturnType<typeof selectEvmTicker>;
  chainId: ReturnType<typeof selectEvmChainId>;
  primaryCurrency: string;
}

type Props = OwnProps & StateProps;

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
  const [gasSelected, setGasSelected] = useState<string | null | undefined>(
    customGasFee
      ? customGasFee.selected ?? null
      : gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET
      ? defaultGasFeeOptionFeeMarket
      : defaultGasFeeOptionLegacy,
  );
  const [stopUpdateGas, setStopUpdateGas] = useState(false);
  const [hasEnoughEthBalance, setHasEnoughEthBalance] = useState(true);
  const [EIP1559TransactionDataTemp, setEIP1559TransactionDataTemp] = useState<
    Partial<TransactionData>
  >({});
  const [LegacyTransactionDataTemp, setLegacyTransactionDataTemp] = useState<
    Partial<TransactionData>
  >({});
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
        Boolean(
          checkEnoughEthBalance?.(
            EIP1559TransactionDataTemp?.totalMaxHex?.toString(16),
          ),
        ),
      );
    } else if (
      LegacyTransactionDataTemp &&
      Object.keys(LegacyTransactionDataTemp).length > 0
    ) {
      setHasEnoughEthBalance(
        Boolean(
          checkEnoughEthBalance?.(
            LegacyTransactionDataTemp?.totalHex?.toString(16),
          ),
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
      const selectedGasFeeEstimate = gasFeeEstimates[gasSelected];
      if (
        typeof selectedGasFeeEstimate !== 'object' ||
        selectedGasFeeEstimate === null
      ) {
        return;
      }
      setEIP1559TransactionDataTemp(
        parseTransactionEIP1559(
          {
            currentCurrency,
            conversionRate: conversionRate ?? undefined,
            nativeCurrency: ticker,
            selectedGasFee: {
              suggestedMaxFeePerGas:
                selectedGasFeeEstimate.suggestedMaxFeePerGas,
              suggestedMaxPriorityFeePerGas:
                selectedGasFeeEstimate.suggestedMaxPriorityFeePerGas,
              suggestedGasLimit: initialGasLimit,
              suggestedEstimatedGasLimit: tradeGasLimit,
              estimatedBaseFee: gasFeeEstimates.estimatedBaseFee,
              selectedOption: gasSelected,
              recommended: RECOMMENDED,
            },
            swapsParams: {
              isNativeAsset,
              tradeValue,
              sourceAmount,
            },
            contractExchangeRates: undefined,
            gasFeeEstimates,
          },
          { onlyGas: true },
        ) as Partial<TransactionData>,
      );
    } else {
      setLegacyTransactionDataTemp(
        parseTransactionLegacy(
          {
            currentCurrency,
            conversionRate: conversionRate ?? undefined,
            ticker,
            selectedGasFee: {
              suggestedGasLimit: initialGasLimit,
              suggestedGasPrice:
                gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE
                  ? gasFeeEstimates.gasPrice
                  : gasFeeEstimates[gasSelected],
            },
            contractExchangeRates: undefined,
            multiLayerL1FeeTotal: undefined,
          },
          { onlyGas: true },
        ) as Partial<TransactionData>,
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
      }: EIP1559GasInput,
      selected: string | null | undefined,
    ) => {
      if (!selected) {
        setStopUpdateGas(true);
      }
      setGasSelected(selected);
      setEIP1559TransactionDataTemp(
        parseTransactionEIP1559(
          {
            currentCurrency,
            conversionRate: conversionRate ?? undefined,
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
            gasFeeEstimates,
          },
          { onlyGas: true },
        ) as Partial<TransactionData>,
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
      { suggestedGasLimit, suggestedGasPrice }: LegacyGasInput,
      selected: string | null | undefined,
    ) => {
      setStopUpdateGas(!selected);
      setGasSelected(selected);
      setLegacyTransactionDataTemp(
        parseTransactionLegacy(
          {
            currentCurrency,
            conversionRate: conversionRate ?? undefined,
            ticker,
            selectedGasFee: {
              suggestedGasLimit: selected ? initialGasLimit : suggestedGasLimit,
              suggestedGasPrice,
            },
            contractExchangeRates: undefined,
            multiLayerL1FeeTotal: undefined,
          },
          { onlyGas: true },
        ) as Partial<TransactionData>,
      );
    },
    [conversionRate, currentCurrency, initialGasLimit, ticker],
  );

  const saveGasEdition = useCallback(
    (selected: string | null | undefined) => {
      if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
        const {
          suggestedMaxFeePerGas: maxFeePerGas,
          suggestedMaxPriorityFeePerGas: maxPriorityFeePerGas,
          estimatedBaseFee,
          suggestedGasLimit,
        } = EIP1559TransactionDataTemp;
        onGasUpdate?.(
          {
            maxFeePerGas,
            maxPriorityFeePerGas,
            estimatedBaseFee,
            selected,
          },
          suggestedGasLimit as string,
        );
      } else {
        const { suggestedGasPrice: gasPrice, suggestedGasLimit } =
          LegacyTransactionDataTemp;
        onGasUpdate?.(
          {
            gasPrice,
            selected,
          },
          suggestedGasLimit as string,
        );
      }
      dismiss?.();
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
    dismiss?.();
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
              gasFee={EIP1559TransactionDataTemp as unknown as EditGasFeeGasFee}
              gasOptions={gasFeeEstimates as unknown as EditGasFee1559Options}
              onChange={calculateTempGasFee}
              gasFeeNative={
                EIP1559TransactionDataTemp.renderableGasFeeMinNative as string
              }
              gasFeeConversion={
                EIP1559TransactionDataTemp.renderableGasFeeMinConversion as string
              }
              gasFeeMaxNative={
                EIP1559TransactionDataTemp.renderableGasFeeMaxNative as string
              }
              gasFeeMaxConversion={
                EIP1559TransactionDataTemp.renderableGasFeeMaxConversion as string
              }
              maxPriorityFeeNative={
                EIP1559TransactionDataTemp.renderableMaxPriorityFeeNative as string
              }
              maxPriorityFeeConversion={
                EIP1559TransactionDataTemp.renderableMaxPriorityFeeConversion as string
              }
              maxFeePerGasNative={
                EIP1559TransactionDataTemp.renderableMaxFeePerGasNative as string
              }
              maxFeePerGasConversion={
                EIP1559TransactionDataTemp.renderableMaxFeePerGasConversion as string
              }
              primaryCurrency={primaryCurrency}
              chainId={chainId}
              timeEstimate={EIP1559TransactionDataTemp.timeEstimate as string}
              timeEstimateColor={
                EIP1559TransactionDataTemp.timeEstimateColor as string
              }
              timeEstimateId={
                EIP1559TransactionDataTemp.timeEstimateId as string
              }
              onCancel={cancelGasEdition}
              onSave={saveGasEdition}
              recommended={{
                name: GAS_OPTIONS.HIGH,
                render: (
                  <TouchableOpacity onPress={showGasFeeRecommendation}>
                    <Text noMargin link bold small centered>
                      {`${strings('swaps.recommended')} `}
                      <MaterialCommunityIcon
                        name="information"
                        size={14}
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
            selected={gasSelected ?? undefined}
            ignoreOptions={[GAS_OPTIONS.LOW]}
            warningMinimumEstimateOption={GAS_OPTIONS.MEDIUM}
            gasFee={LegacyTransactionDataTemp as unknown as EditGasFeeGasFee}
            gasEstimateType={gasEstimateType ?? ''}
            gasOptions={gasFeeEstimates as unknown as EditGasFeeLegacyOptions}
            onChange={calculateTempGasFeeLegacy}
            gasFeeNative={LegacyTransactionDataTemp.transactionFee as string}
            gasFeeConversion={
              LegacyTransactionDataTemp.transactionFeeFiat as string
            }
            {...{
              gasPriceConversion: LegacyTransactionDataTemp.transactionFeeFiat,
            }}
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
  conversionRate: selectConversionRate(state),
  currentCurrency: selectCurrentCurrency(state),
  ticker: selectEvmTicker(state),
  chainId: selectEvmChainId(state),
  primaryCurrency: state.settings.primaryCurrency,
});

export default connect(mapStateToProps)(GasEditModal);
