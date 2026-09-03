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
import HorizontalSelector, {
  type OptionType,
} from '../../Base/HorizontalSelector';
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
import type { Colors } from '../../../util/theme/models';

interface GasFee {
  suggestedGasLimit?: string;
  suggestedGasPrice?: string;
  [key: string]: string | number | undefined;
}

interface RecommendedOption {
  name?: string;
  render?: React.ReactNode;
}

interface OwnProps {
  selected?: string;
  gasFee: GasFee;
  gasOptions: Record<string, string> & { gasPrice?: string };
  onChange: (gas: GasFee, selectedOption: string | null) => void;
  onCancel: () => void;
  onSave: (selectedOption: string | undefined) => void;
  gasFeeNative: string;
  gasFeeConversion: string;
  primaryCurrency: string;
  chainId: string;
  gasEstimateType: string;
  error?: string | boolean | React.ReactNode;
  warning?: string | boolean | React.ReactNode;
  ignoreOptions?: string[];
  extendOptions?: Record<string, Partial<OptionType>>;
  recommended?: RecommendedOption;
  warningMinimumEstimateOption: string;
  onUpdatingValuesStart?: () => void;
  onUpdatingValuesEnd?: () => void;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  analyticsParams?: Record<string, string | number | boolean | undefined>;
  view: string;
}

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
    warningContainer: {},
    warningText: {
      lineHeight: 20,
      color: colors.text.default,
    },
  });

/**
 * The EditGasFeeLegacy component will be deprecated in favor of EditGasFeeLegacyUpdate as part of the gas polling refactor code that moves gas fee modifications to `app/core/GasPolling`. When the refactoring is completed, the EditGasFeeLegacyUpdate will be renamed EditGasFeeLegacy and this component will be removed. The EditGasFeeLegacyUpdate is currently being used in the Update Transaction(Speed Up/Cancel) flow.
 */

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
  warningMinimumEstimateOption,
  onUpdatingValuesStart,
  onUpdatingValuesEnd,
  animateOnChange,
  isAnimating,
  analyticsParams,
  view,
}: OwnProps) => {
  const onlyAdvanced = gasEstimateType !== GAS_ESTIMATE_TYPES.LEGACY;
  const [showRangeInfoModal, setShowRangeInfoModal] = useState<
    'gas_limit' | 'gas_price' | null
  >(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(
    !selected || onlyAdvanced,
  );
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    selected,
  );
  const [gasPriceError, setGasPriceError] = useState<string | undefined>();
  const { colors } = useTheme();
  const { trackEvent, createEventBuilder } = useMetrics();
  const styles = createStyles(colors);

  const getAnalyticsParams = () => {
    try {
      return {
        ...analyticsParams,
        chain_id: getDecimalChainId(chainId),
        function_type: view,
        gas_mode: selectedOption ? 'Basic' : 'Advanced',
        speed_set: selectedOption || undefined,
      };
    } catch (_error) {
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
    setShowAdvancedOptions(
      (currentShowAdvancedOptions) => !currentShowAdvancedOptions,
    );
  };

  const save = () => {
    trackEvent(
      createEventBuilder(MetaMetricsEvents.GAS_FEE_CHANGED)
        .addProperties(getAnalyticsParams())
        .build(),
    );

    onSave(selectedOption);
  };

  const changeGas = (gas: GasFee, selectedOptionValue: string | null) => {
    setSelectedOption(selectedOptionValue as string | undefined);
    onChange(gas, selectedOptionValue);
  };

  const changedGasPrice = (value: string) => {
    const lowerValue = new BigNumber(
      gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY
        ? gasOptions?.[warningMinimumEstimateOption]
        : (gasOptions?.gasPrice as string),
    );
    const higherValue = new BigNumber(
      gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY
        ? (gasOptions?.high as string)
        : (gasOptions?.gasPrice as string),
    ).multipliedBy(new BigNumber(1.5));

    const valueBN = new BigNumber(value);

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

  const changedGasLimit = (value: string) => {
    const newGas = { ...gasFee, suggestedGasLimit: value };

    changeGas(newGas, null);
  };

  const selectOption = (option: string) => {
    setGasPriceError('');
    setSelectedOption(option);
    changeGas({ ...gasFee, suggestedGasPrice: gasOptions[option] }, option);
  };

  const shouldIgnore = (option: string) =>
    ignoreOptions.find((item) => item === option);

  const renderLabel = (
    selectedValue: boolean,
    disabled: boolean,
    label: string,
  ) => (
    <Text bold primary={selectedValue && !disabled}>
      {label}
    </Text>
  );

  const renderOptions = (): OptionType[] =>
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
          style={styles.warningContainer}
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
          style={styles.warningContainer}
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

  const isMainnet = isMainnetByChainId(chainId);
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
            {renderWarning as unknown as React.ReactNode}
            {renderError as unknown as React.ReactNode}
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
                    selected={selectedOption}
                    onPress={selectOption}
                    options={renderOptions as unknown as OptionType[]}
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

EditGasFeeLegacy.defaultProps = {
  warningMinimumEstimateOption: AppConstants.GAS_OPTIONS.LOW,
};

export default EditGasFeeLegacy as React.ComponentType<OwnProps>;
