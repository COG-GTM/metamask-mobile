/* eslint-disable react/display-name */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import BigNumber from 'bignumber.js';
import Text from '../../Base/Text';
import StyledButton from '../StyledButton';
import RangeInput from '../../Base/RangeInput';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import InfoModal from '../Swaps/components/InfoModal';
import Icon from 'react-native-vector-icons/Ionicons';
import { strings } from '../../../../locales/i18n';
import Alert, { AlertType } from '../../Base/Alert';
import HorizontalSelector from '../../Base/HorizontalSelector';
import Device from '../../../util/device';
import { getDecimalChainId, isMainnetByChainId } from '../../../util/networks';
import FadeAnimationView from '../FadeAnimationView';
import { MetaMetricsEvents } from '../../../core/Analytics';

import AppConstants from '../../../core/AppConstants';
import { useTheme } from '../../../util/theme';
import {
  GAS_LIMIT_INCREMENT,
  GAS_PRICE_INCREMENT,
  GAS_LIMIT_MIN,
  GAS_PRICE_MIN,
} from '../../../util/gasUtils';
import { useMetrics } from '../../../components/hooks/useMetrics';
import { Colors } from '../../../util/theme/models';
import { JsonMap } from '../../../core/Analytics/MetaMetrics.types';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.background.default,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      minHeight: 200,
      maxHeight: '95%',
      paddingTop: 24,
      paddingBottom: Device.isIphoneX() ? 32 : 24,
    },
    wrapper: {
      paddingHorizontal: 24,
    },
    customGasHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      paddingBottom: 20,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 22,
    },
    headerText: {
      fontSize: 48,
    },
    headerTitle: {
      flexDirection: 'row',
    },
    headerTitleSide: {
      flex: 1,
    },
    labelTextContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    hitSlop: {
      top: 10,
      left: 10,
      bottom: 10,
      right: 10,
    },
    labelInfo: {
      color: colors.text.muted,
    },
    advancedOptionsContainer: {
      marginTop: 25,
      marginBottom: 30,
    },
    advancedOptionsInputsContainer: {
      marginTop: 14,
    },
    rangeInputContainer: {
      marginBottom: 20,
    },
    advancedOptionsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    advancedOptionsIcon: {
      paddingTop: 1,
      marginLeft: 5,
    },
    warningTextContainer: {
      paddingLeft: 4,
      lineHeight: 20,
      textAlign: 'center',
    },
    warningText: {
      lineHeight: 20,
      color: colors.text.default,
    },
  });

/**
 * The EditGasFeeLegacy component will be deprecated in favor of EditGasFeeLegacyUpdate as part of the gas polling refactor code that moves gas fee modifications to `app/core/GasPolling`. When the refactoring is completed, the EditGasFeeLegacyUpdate will be renamed EditGasFeeLegacy and this component will be removed. The EditGasFeeLegacyUpdate is currently being used in the Update Transaction(Speed Up/Cancel) flow.
 */

// The JavaScript implementation renders these functions without calling them,
// which React ignores; they are kept as-is to preserve the rendered output
const asNode = (renderFunction: () => React.ReactNode) =>
  renderFunction as unknown as React.ReactNode;

/**
 * Gas price estimates keyed by option name. Callers pass the gas fee
 * controller estimates, which also hold non-string entries for other estimate
 * types.
 */
type GasOptions = Record<string, unknown>;

const gasPriceFor = (
  gasOptions: GasOptions | undefined,
  option: string,
): string | undefined => {
  const estimate = gasOptions?.[option];
  return typeof estimate === 'string' ? estimate : undefined;
};

interface GasFee {
  maxWaitTimeEstimate?: number;
  minWaitTimeEstimate?: number;
  suggestedGasLimit?: string;
  suggestedGasPrice?: string;
}

interface RecommendedOption {
  name?: string;
  render?: React.ReactNode;
}

type RangeInfoModalName = 'gas_limit' | 'gas_price' | null;

type HorizontalSelectorOptions = React.ComponentProps<
  typeof HorizontalSelector
>['options'];

interface EditGasFeeLegacyProps {
  /**
   * Gas option selected (low, medium, high)
   */
  selected?: string | null;
  /**
   * Gas fee currently active
   */
  gasFee: GasFee;
  /**
   * Gas fee options to select from
   */
  gasOptions?: GasOptions;
  /**
   * Function called when user selected or changed the gas
   */
  onChange?: (gas: GasFee, selectedOption: string | null) => void;
  /**
   * Function called when user cancels
   */
  onCancel?: () => void;
  /**
   * Function called when user saves the new gas
   */
  onSave?: (selectedOption?: string | null) => void;
  /**
   * Gas fee in native currency
   */
  gasFeeNative?: string;
  /**
   * Gas fee converted to chosen currency
   */
  gasFeeConversion?: string;
  /**
   * Primary currency, either ETH or Fiat
   */
  primaryCurrency?: string;
  /**
   * A string representing the network chainId
   */
  chainId?: string;
  /**
   * Estimate type returned by the gas fee controller, can be market-fee, legacy or eth_gasPrice
   */
  gasEstimateType?: string;
  /**
   * Error message to show
   */
  error?: React.ReactNode;
  /**
   * Warning message to show
   */
  warning?: React.ReactNode;
  /**
   * Ignore option array
   */
  ignoreOptions?: string[];
  /**
   * Extend options object. Object has option keys and properties will be spread
   */
  extendOptions?: Record<string, { error?: boolean; disabled?: boolean }>;
  /**
   * Recommended object with type and render function
   */
  recommended?: RecommendedOption;
  /**
   * Estimate option to compare with for too low warning
   */
  warningMinimumEstimateOption?: string;
  /**
   * Function to call when update animation starts
   */
  onUpdatingValuesStart?: () => void;
  /**
   * Function to call when update animation ends
   */
  onUpdatingValuesEnd?: () => void;
  /**
   * If the values should animate upon update or not
   */
  animateOnChange?: boolean;
  /**
   * Boolean to determine if the animation is happening
   */
  isAnimating?: boolean;
  /**
   * Extra analytics params to be send with the gas analytics
   */
  analyticsParams?: JsonMap;
  /**
   * (For analytics purposes) View (Approve, Transfer, Confirm) where this component is being used
   */
  view: string;
}

const EditGasFeeLegacy = ({
  selected,
  gasFee,
  gasOptions,
  onChange,
  onCancel,
  onSave,
  gasFeeNative,
  gasFeeConversion,
  primaryCurrency,
  chainId,
  gasEstimateType,
  error,
  warning,
  ignoreOptions = [],
  extendOptions = {},
  recommended,
  warningMinimumEstimateOption = AppConstants.GAS_OPTIONS.LOW,
  onUpdatingValuesStart,
  onUpdatingValuesEnd,
  animateOnChange,
  isAnimating,
  analyticsParams,
  view,
}: EditGasFeeLegacyProps) => {
  const onlyAdvanced = gasEstimateType !== GAS_ESTIMATE_TYPES.LEGACY;
  const [showRangeInfoModal, setShowRangeInfoModal] = useState<
    RangeInfoModalName | boolean
  >(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(
    !selected || onlyAdvanced,
  );
  const [selectedOption, setSelectedOption] = useState<
    string | null | undefined
  >(selected);
  const [gasPriceError, setGasPriceError] = useState<string>();
  const { colors } = useTheme();
  const { trackEvent, createEventBuilder } = useMetrics();
  const styles = createStyles(colors);

  const getAnalyticsParams = () => {
    try {
      return {
        ...analyticsParams,
        chain_id: chainId ? getDecimalChainId(chainId) : undefined,
        function_type: view,
        gas_mode: selectedOption ? 'Basic' : 'Advanced',
        speed_set: selectedOption || undefined,
      };
    } catch (analyticsError) {
      return {};
    }
  };

  const toggleAdvancedOptions = () => {
    if (!showAdvancedOptions) {
      trackEvent(
        createEventBuilder(MetaMetricsEvents.GAS_ADVANCED_OPTIONS_CLICKED)
          .addProperties(getAnalyticsParams())
          .build(),
      );
    }
    setShowAdvancedOptions((currentValue) => !currentValue);
  };

  const save = () => {
    trackEvent(
      createEventBuilder(MetaMetricsEvents.GAS_FEE_CHANGED)
        .addProperties(getAnalyticsParams())
        .build(),
    );

    onSave?.(selectedOption);
  };

  const changeGas = (gas: GasFee, newSelectedOption: string | null) => {
    setSelectedOption(newSelectedOption);
    onChange?.(gas, newSelectedOption);
  };

  const changedGasPrice = (value?: string) => {
    const lowerValue = new BigNumber(
      gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY
        ? gasPriceFor(gasOptions, warningMinimumEstimateOption) ?? NaN
        : gasPriceFor(gasOptions, 'gasPrice') ?? NaN,
    );
    const higherValue = new BigNumber(
      gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY
        ? gasPriceFor(gasOptions, 'high') ?? NaN
        : gasPriceFor(gasOptions, 'gasPrice') ?? NaN,
    ).multipliedBy(new BigNumber(1.5));

    const valueBN = new BigNumber(value ?? NaN);

    if (!lowerValue.isNaN() && valueBN.lt(lowerValue)) {
      setGasPriceError(strings('edit_gas_fee_eip1559.gas_price_low'));
    } else if (!higherValue.isNaN() && valueBN.gt(higherValue)) {
      setGasPriceError(strings('edit_gas_fee_eip1559.gas_price_high'));
    } else {
      setGasPriceError('');
    }

    const newGas = { ...gasFee, suggestedGasPrice: value };

    changeGas(newGas, null);
  };

  const changedGasLimit = (value?: string) => {
    const newGas = { ...gasFee, suggestedGasLimit: value };

    changeGas(newGas, null);
  };

  const selectOption = (option: string) => {
    setGasPriceError('');
    setSelectedOption(option);
    changeGas(
      { ...gasFee, suggestedGasPrice: gasPriceFor(gasOptions, option) },
      option,
    );
  };

  const shouldIgnore = (option: string) =>
    ignoreOptions.find((item) => item === option);

  const renderLabel = (
    isSelected: boolean,
    isDisabled: boolean,
    label: string,
  ) => (
    <Text bold primary={isSelected && !isDisabled}>
      {label}
    </Text>
  );

  const renderOptions = () =>
    [
      {
        name: AppConstants.GAS_OPTIONS.LOW,
        label: strings('edit_gas_fee_eip1559.low'),
      },
      {
        name: AppConstants.GAS_OPTIONS.MEDIUM,
        label: strings('edit_gas_fee_eip1559.medium'),
      },
      {
        name: AppConstants.GAS_OPTIONS.HIGH,
        label: strings('edit_gas_fee_eip1559.high'),
      },
    ]
      .filter(({ name }) => !shouldIgnore(name))
      .map(({ name, label, ...option }) => ({
        name,
        label: renderLabel(selectedOption === name, false, label),
        topLabel: recommended?.name === name && recommended.render,
        ...option,
        ...extendOptions[name],
      }));

  const renderWarning = () => {
    if (!warning) return null;
    if (typeof warning === 'string')
      return (
        <Alert
          small
          type={AlertType.Warning}
          renderIcon={() => (
            <MaterialCommunityIcon
              name="information"
              size={20}
              color={colors.warning.default}
            />
          )}
          // `warningContainer` is not part of this component's styles, so the
          // JavaScript implementation passed `undefined` as the style
        >
          {() => (
            <View style={styles.warningTextContainer}>
              <Text black style={styles.warningText}>
                {warning}
              </Text>
            </View>
          )}
        </Alert>
      );

    return warning;
  };

  const renderError = () => {
    if (!error) return null;
    if (typeof error === 'string')
      return (
        <Alert
          small
          type={AlertType.Error}
          renderIcon={() => (
            <MaterialCommunityIcon
              name="information"
              size={20}
              color={colors.error.default}
            />
          )}
          // `warningContainer` is not part of this component's styles, so the
          // JavaScript implementation passed `undefined` as the style
        >
          {() => (
            <View style={styles.warningTextContainer}>
              <Text red style={styles.warningText}>
                {error}
              </Text>
            </View>
          )}
        </Alert>
      );

    return error;
  };

  const isMainnet = chainId !== undefined && isMainnetByChainId(chainId);
  const nativeCurrencySelected = primaryCurrency === 'ETH' || !isMainnet;
  let gasFeePrimary, gasFeeSecondary;
  if (nativeCurrencySelected) {
    gasFeePrimary = gasFeeNative;
    gasFeeSecondary = gasFeeConversion;
  } else {
    gasFeePrimary = gasFeeConversion;
    gasFeeSecondary = gasFeeNative;
  }

  const valueToWatch = gasFeeNative;

  return (
    <View style={styles.root}>
      <ScrollView style={styles.wrapper}>
        <TouchableWithoutFeedback>
          <View>
            <View>
              <View style={styles.customGasHeader}>
                <TouchableOpacity onPress={onCancel}>
                  <Icon
                    name={'arrow-back'}
                    size={24}
                    color={colors.text.default}
                  />
                </TouchableOpacity>
                <Text bold black>
                  {strings('transaction.edit_network_fee')}
                </Text>
                <Icon
                  name={'arrow-back'}
                  size={24}
                  color={colors.background.default}
                />
              </View>
            </View>
            {asNode(renderWarning)}
            {asNode(renderError)}
            <FadeAnimationView
              valueToWatch={valueToWatch}
              animateOnChange={animateOnChange}
              onAnimationStart={onUpdatingValuesStart}
              onAnimationEnd={onUpdatingValuesEnd}
            >
              <View style={styles.headerContainer}>
                <View style={styles.headerTitle}>
                  <View style={styles.headerTitleSide}>
                    <Text right black style={styles.headerText}>
                      ~
                    </Text>
                  </View>
                  <Text black style={styles.headerText}>
                    {gasFeePrimary}
                  </Text>
                  <View style={styles.headerTitleSide} />
                </View>
                <Text big black>
                  <Text bold black>
                    {gasFeeSecondary}
                  </Text>
                </Text>
              </View>
              {!onlyAdvanced && (
                <View>
                  <HorizontalSelector
                    selected={selectedOption ?? undefined}
                    onPress={selectOption}
                    // The JavaScript implementation passes the render function
                    // itself rather than calling it
                    options={
                      renderOptions as unknown as HorizontalSelectorOptions
                    }
                  />
                </View>
              )}
              <View style={styles.advancedOptionsContainer}>
                {!onlyAdvanced && (
                  <TouchableOpacity
                    onPress={toggleAdvancedOptions}
                    style={styles.advancedOptionsButton}
                  >
                    <Text noMargin link bold>
                      {strings('edit_gas_fee_eip1559.advanced_options')}
                    </Text>
                    <Text noMargin link bold style={styles.advancedOptionsIcon}>
                      <Icon
                        name={`arrow-${showAdvancedOptions ? 'up' : 'down'}`}
                      />
                    </Text>
                  </TouchableOpacity>
                )}
                {showAdvancedOptions && (
                  <View style={styles.advancedOptionsInputsContainer}>
                    <View style={styles.rangeInputContainer}>
                      <RangeInput
                        leftLabelComponent={
                          <View style={styles.labelTextContainer}>
                            <Text black bold noMargin>
                              {strings('edit_gas_fee_eip1559.gas_limit')}{' '}
                            </Text>

                            <TouchableOpacity
                              hitSlop={styles.hitSlop}
                              onPress={() => setShowRangeInfoModal('gas_limit')}
                            >
                              <MaterialCommunityIcon
                                name="information"
                                size={14}
                                style={styles.labelInfo}
                              />
                            </TouchableOpacity>
                          </View>
                        }
                        value={gasFee.suggestedGasLimit}
                        onChangeValue={changedGasLimit}
                        min={GAS_LIMIT_MIN}
                        name={strings('edit_gas_fee_eip1559.gas_limit')}
                        increment={GAS_LIMIT_INCREMENT}
                      />
                    </View>
                    <View style={styles.rangeInputContainer}>
                      <RangeInput
                        leftLabelComponent={
                          <View style={styles.labelTextContainer}>
                            <Text black bold noMargin>
                              {strings('edit_gas_fee_eip1559.gas_price')}{' '}
                            </Text>

                            <TouchableOpacity
                              hitSlop={styles.hitSlop}
                              onPress={() => setShowRangeInfoModal('gas_price')}
                            >
                              <MaterialCommunityIcon
                                name="information"
                                size={14}
                                style={styles.labelInfo}
                              />
                            </TouchableOpacity>
                          </View>
                        }
                        value={gasFee.suggestedGasPrice}
                        name={strings('edit_gas_fee_eip1559.gas_price')}
                        unit={'GWEI'}
                        increment={GAS_PRICE_INCREMENT}
                        min={GAS_PRICE_MIN}
                        inputInsideLabel={
                          gasFeeConversion && `≈ ${gasFeeConversion}`
                        }
                        onChangeValue={changedGasPrice}
                        error={gasPriceError}
                      />
                    </View>
                  </View>
                )}
              </View>
            </FadeAnimationView>
            <View>
              <StyledButton
                type={'confirm'}
                onPress={save}
                disabled={Boolean(error) || isAnimating}
              >
                {strings('edit_gas_fee_eip1559.save')}
              </StyledButton>
            </View>
            <InfoModal
              isVisible={Boolean(showRangeInfoModal)}
              title={
                showRangeInfoModal === 'gas_limit'
                  ? strings('edit_gas_fee_eip1559.gas_limit')
                  : showRangeInfoModal === 'gas_price'
                  ? strings('edit_gas_fee_eip1559.gas_price')
                  : null
              }
              toggleModal={() => setShowRangeInfoModal(null)}
              body={
                <View>
                  <Text grey infoModal>
                    {showRangeInfoModal === 'gas_limit' &&
                      strings(
                        'edit_gas_fee_eip1559.learn_more_gas_limit_legacy',
                      )}
                    {showRangeInfoModal === 'gas_price' &&
                      strings('edit_gas_fee_eip1559.learn_more_gas_price')}
                  </Text>
                </View>
              }
            />
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

export default EditGasFeeLegacy;
