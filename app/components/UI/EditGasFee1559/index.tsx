/* eslint-disable react/display-name */
import React, { useState, ReactNode } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  ViewStyle,
  TextStyle,
} from 'react-native';
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
import BigNumber from 'bignumber.js';
import FadeAnimationView from '../FadeAnimationView';
import { MetaMetricsEvents } from '../../../core/Analytics';

import TimeEstimateInfoModal from '../TimeEstimateInfoModal';
import useModalHandler from '../../Base/hooks/useModalHandler';
import AppConstants from '../../../core/AppConstants';
import { useTheme } from '../../../util/theme';
import {
  GAS_LIMIT_INCREMENT,
  GAS_PRICE_INCREMENT as GAS_INCREMENT,
  GAS_LIMIT_MIN,
  GAS_PRICE_MIN as GAS_MIN,
} from '../../../util/gasUtils';
import { useMetrics } from '../../../components/hooks/useMetrics';
import { Theme } from '../../../util/theme/models';

interface Styles {
  root: ViewStyle;
  wrapper: ViewStyle;
  customGasHeader: ViewStyle;
  newGasFeeHeader: ViewStyle;
  headerContainer: ViewStyle;
  headerText: TextStyle;
  headerTitle: ViewStyle;
  saveButton: ViewStyle;
  labelTextContainer: ViewStyle;
  hitSlop: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
  labelInfo: TextStyle;
  advancedOptionsContainer: ViewStyle;
  advancedOptionsInputsContainer: ViewStyle;
  rangeInputContainer: ViewStyle;
  advancedOptionsButton: ViewStyle;
  advancedOptionsIcon: TextStyle;
  learnMoreLabels: ViewStyle;
  warningTextContainer: ViewStyle;
  warningText: TextStyle;
  warningContainer: ViewStyle;
  dappEditGasContainer: ViewStyle;
  subheader: ViewStyle;
  learnMoreModal: ViewStyle;
  redInfo: TextStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
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
    newGasFeeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'center',
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 22,
    },
    headerText: {
      fontSize: 48,
      flex: 1,
      textAlign: 'center',
    },
    headerTitle: {
      flexDirection: 'row',
    },
    saveButton: {
      marginBottom: 20,
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
    learnMoreLabels: {
      marginTop: 9,
    },
    warningTextContainer: {
      lineHeight: 20,
      paddingLeft: 4,
      flex: 1,
    },
    warningText: {
      lineHeight: 20,
      flex: 1,
      color: colors.text.default,
    },
    warningContainer: {
      marginBottom: 20,
    },
    dappEditGasContainer: {
      marginVertical: 20,
    },
    subheader: {
      marginBottom: 6,
    },
    learnMoreModal: {
      maxHeight: Device.getDeviceHeight() * 0.7,
    },
    redInfo: {
      marginLeft: 2,
      color: colors.error.default,
    },
  });

interface GasFee {
  suggestedGasLimit?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedMaxFeePerGas?: string;
}

interface GasOption {
  suggestedMaxPriorityFeePerGas?: string;
  suggestedMaxFeePerGas?: string;
}

interface GasOptions {
  low?: GasOption;
  medium?: GasOption;
  high?: GasOption;
  [key: string]: GasOption | undefined;
}

interface UpdateOption {
  isCancel?: boolean;
  showAdvanced?: boolean;
  maxPriortyFeeThreshold?: string;
  maxFeeThreshold?: string;
}

interface Recommended {
  name?: string;
  render?: ReactNode;
}

interface ExtendOptions {
  [key: string]: object;
}

interface AnalyticsParams {
  [key: string]: unknown;
}

interface EditGasFee1559Props {
  selected?: string | null;
  gasFee: GasFee;
  gasOptions?: GasOptions;
  onChange: (gas: GasFee, selectedOption: string | null) => void;
  onCancel: () => void;
  onSave: (selectedOption: string | null) => void;
  gasFeeNative?: string;
  gasFeeConversion?: string;
  gasFeeMaxNative?: string;
  gasFeeMaxConversion?: string;
  maxPriorityFeeNative?: string;
  maxPriorityFeeConversion?: string;
  maxFeePerGasNative?: string;
  maxFeePerGasConversion?: string;
  primaryCurrency?: string;
  chainId?: string;
  timeEstimate?: string;
  timeEstimateColor?: string;
  timeEstimateId?: string;
  error?: string | boolean | ReactNode;
  warning?: string | boolean | ReactNode;
  dappSuggestedGas?: boolean;
  ignoreOptions?: string[];
  updateOption?: UpdateOption;
  extendOptions?: ExtendOptions;
  recommended?: Recommended;
  warningMinimumEstimateOption?: string;
  suggestedEstimateOption?: string;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  onUpdatingValuesStart?: () => void;
  onUpdatingValuesEnd?: () => void;
  analyticsParams?: AnalyticsParams;
  view: string;
}

const EditGasFee1559: React.FC<EditGasFee1559Props> = ({
  selected,
  gasFee,
  gasOptions,
  onChange,
  onCancel,
  onSave,
  gasFeeNative,
  gasFeeConversion,
  gasFeeMaxNative,
  gasFeeMaxConversion,
  maxPriorityFeeNative,
  maxPriorityFeeConversion,
  maxFeePerGasNative,
  maxFeePerGasConversion,
  primaryCurrency,
  chainId,
  timeEstimate,
  timeEstimateColor,
  timeEstimateId,
  error,
  warning,
  dappSuggestedGas,
  ignoreOptions = [],
  updateOption,
  extendOptions = {},
  recommended,
  warningMinimumEstimateOption = AppConstants.GAS_OPTIONS.LOW,
  suggestedEstimateOption = AppConstants.GAS_OPTIONS.MEDIUM,
  animateOnChange,
  isAnimating,
  onUpdatingValuesStart,
  onUpdatingValuesEnd,
  analyticsParams,
  view,
}) => {
  const [showInfoModal, setShowInfoModal] = useState<string | boolean | null>(
    false,
  );
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(!selected);
  const [maxPriorityFeeError, setMaxPriorityFeeError] = useState<string | null>(
    null,
  );
  const [maxFeeError, setMaxFeeError] = useState<string | null>(null);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(
    selected || null,
  );
  const [showInputs, setShowInputs] = useState(!dappSuggestedGas);
  const [
    isVisibleTimeEstimateInfoModal,
    ,
    showTimeEstimateInfoModal,
    hideTimeEstimateInfoModal,
  ] = useModalHandler(false);
  const { colors } = useTheme();
  const { trackEvent, createEventBuilder } = useMetrics();

  const styles = createStyles(colors);

  const getAnalyticsParams = (): AnalyticsParams => {
    try {
      return {
        ...analyticsParams,
        chain_id: getDecimalChainId(chainId || ''),
        function_type: view,
        gas_mode: selectedOption ? 'Basic' : 'Advanced',
        speed_set: selectedOption || undefined,
      };
    } catch {
      return {};
    }
  };

  const toggleAdvancedOptions = (): void => {
    if (!showAdvancedOptions) {
      trackEvent(
        createEventBuilder(MetaMetricsEvents.GAS_ADVANCED_OPTIONS_CLICKED)
          .addProperties(getAnalyticsParams())
          .build(),
      );
    }
    setShowAdvancedOptions((prev) => !prev);
  };

  const toggleLearnMoreModal = (): void => {
    setShowLearnMoreModal((prev) => !prev);
  };

  const save = (): void => {
    trackEvent(
      createEventBuilder(MetaMetricsEvents.GAS_FEE_CHANGED)
        .addProperties(getAnalyticsParams())
        .build(),
    );

    onSave(selectedOption);
  };

  const changeGas = (gas: GasFee, option: string | null): void => {
    setSelectedOption(option);
    onChange(gas, option);
  };

  const changedMaxPriorityFee = (value: string): void => {
    const lowerValue = new BigNumber(
      gasOptions?.[warningMinimumEstimateOption]?.suggestedMaxPriorityFeePerGas ||
        '',
    );
    const higherValue = new BigNumber(
      gasOptions?.high?.suggestedMaxPriorityFeePerGas || '',
    ).multipliedBy(new BigNumber(1.5));
    const updateFloor = new BigNumber(updateOption?.maxPriortyFeeThreshold || '');

    const valueBN = new BigNumber(value);

    if (updateFloor && !updateFloor.isNaN() && valueBN.lt(updateFloor)) {
      setMaxPriorityFeeError(
        updateOption?.isCancel
          ? strings('edit_gas_fee_eip1559.max_priority_fee_cancel_low', {
              cancel_value: updateFloor.toString(),
            })
          : strings('edit_gas_fee_eip1559.max_priority_fee_speed_up_low', {
              speed_up_floor_value: updateFloor.toString(),
            }),
      );
    } else if (!lowerValue.isNaN() && valueBN.lt(lowerValue)) {
      setMaxPriorityFeeError(
        strings('edit_gas_fee_eip1559.max_priority_fee_low'),
      );
    } else if (!higherValue.isNaN() && valueBN.gt(higherValue)) {
      setMaxPriorityFeeError(
        strings('edit_gas_fee_eip1559.max_priority_fee_high'),
      );
    } else {
      setMaxPriorityFeeError('');
    }

    const newGas = { ...gasFee, suggestedMaxPriorityFeePerGas: value };

    changeGas(newGas, null);
  };

  const changedMaxFeePerGas = (value: string): void => {
    const lowerValue = new BigNumber(
      gasOptions?.[warningMinimumEstimateOption]?.suggestedMaxFeePerGas || '',
    );
    const higherValue = new BigNumber(
      gasOptions?.high?.suggestedMaxFeePerGas || '',
    ).multipliedBy(new BigNumber(1.5));
    const updateFloor = new BigNumber(updateOption?.maxFeeThreshold || '');

    const valueBN = new BigNumber(value);

    if (updateFloor && !updateFloor.isNaN() && valueBN.lt(updateFloor)) {
      setMaxFeeError(
        updateOption?.isCancel
          ? strings('edit_gas_fee_eip1559.max_fee_cancel_low', {
              cancel_value: updateFloor.toString(),
            })
          : strings('edit_gas_fee_eip1559.max_fee_speed_up_low', {
              speed_up_floor_value: updateFloor.toString(),
            }),
      );
    } else if (!lowerValue.isNaN() && valueBN.lt(lowerValue)) {
      setMaxFeeError(strings('edit_gas_fee_eip1559.max_fee_low'));
    } else if (!higherValue.isNaN() && valueBN.gt(higherValue)) {
      setMaxFeeError(strings('edit_gas_fee_eip1559.max_fee_high'));
    } else {
      setMaxFeeError('');
    }

    const newGas = { ...gasFee, suggestedMaxFeePerGas: value };
    changeGas(newGas, null);
  };

  const changedGasLimit = (value: string): void => {
    const newGas = { ...gasFee, suggestedGasLimit: value };
    changeGas(newGas, null);
  };

  const selectOption = (option: string): void => {
    setSelectedOption(option);
    setMaxFeeError('');
    setMaxPriorityFeeError('');
    changeGas({ ...gasOptions?.[option] }, option);
  };

  const shouldIgnore = (option: string): boolean =>
    ignoreOptions.some((item) => item === option);

  const renderLabel = (
    isSelected: boolean,
    disabled: boolean,
    label: string,
  ): ReactNode => (
    <Text bold primary={isSelected && !disabled}>
      {label}
    </Text>
  );

  const renderOptions = (): Array<{
    name: string;
    label: ReactNode;
    topLabel?: ReactNode;
    [key: string]: unknown;
  }> =>
    [
      {
        name: AppConstants.GAS_OPTIONS.LOW,
        label: strings('edit_gas_fee_eip1559.low'),
      },
      {
        name: AppConstants.GAS_OPTIONS.MEDIUM,
        label: strings('edit_gas_fee_eip1559.market'),
      },
      {
        name: AppConstants.GAS_OPTIONS.HIGH,
        label: strings('edit_gas_fee_eip1559.aggressive'),
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

  const isMainnet = isMainnetByChainId(chainId || '');
  const nativeCurrencySelected = primaryCurrency === 'ETH' || !isMainnet;
  let gasFeePrimary: string | undefined;
  let gasFeeMaxPrimary: string | undefined;
  let maxFeePerGasPrimary: string | undefined;
  let maxPriorityFeePerGasPrimary: string | undefined;
  let gasFeeMaxSecondary: string | undefined;
  if (nativeCurrencySelected) {
    gasFeePrimary = gasFeeNative;
    gasFeeMaxPrimary = gasFeeMaxNative;
    gasFeeMaxSecondary = gasFeeMaxConversion;
    maxFeePerGasPrimary = maxFeePerGasNative;
    maxPriorityFeePerGasPrimary = maxPriorityFeeNative;
  } else {
    gasFeePrimary = gasFeeConversion;
    gasFeeMaxPrimary = gasFeeMaxConversion;
    gasFeeMaxSecondary = gasFeeMaxNative;
    maxFeePerGasPrimary = maxFeePerGasConversion;
    maxPriorityFeePerGasPrimary = maxPriorityFeeConversion;
  }

  const valueToWatch = `${gasFeeNative}${gasFeeMaxNative}`;

  const renderInputs = (): ReactNode => (
    <View>
      <FadeAnimationView
        valueToWatch={valueToWatch}
        animateOnChange={animateOnChange}
        onAnimationStart={onUpdatingValuesStart}
        onAnimationEnd={onUpdatingValuesEnd}
      >
        <View>
          <HorizontalSelector
            selected={selectedOption}
            onPress={selectOption}
            options={renderOptions()}
          />
        </View>
        <View style={styles.advancedOptionsContainer}>
          <TouchableOpacity
            disabled={updateOption?.showAdvanced}
            onPress={toggleAdvancedOptions}
            style={styles.advancedOptionsButton}
          >
            <Text noMargin link bold>
              {strings('edit_gas_fee_eip1559.advanced_options')}
            </Text>
            <Text noMargin link bold style={styles.advancedOptionsIcon}>
              <Icon name={`arrow-${showAdvancedOptions ? 'up' : 'down'}`} />
            </Text>
          </TouchableOpacity>
          {(showAdvancedOptions || updateOption?.showAdvanced) && (
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
                        onPress={() => setShowInfoModal('gas_limit')}
                      >
                        <MaterialCommunityIcon
                          name="information"
                          size={14}
                          style={styles.labelInfo}
                        />
                      </TouchableOpacity>
                    </View>
                  }
                  min={GAS_LIMIT_MIN}
                  value={gasFee.suggestedGasLimit}
                  onChangeValue={changedGasLimit}
                  name={strings('edit_gas_fee_eip1559.gas_limit')}
                  increment={GAS_LIMIT_INCREMENT}
                />
              </View>
              <View style={styles.rangeInputContainer}>
                <RangeInput
                  leftLabelComponent={
                    <View style={styles.labelTextContainer}>
                      <Text black bold noMargin>
                        {strings('edit_gas_fee_eip1559.max_priority_fee')}{' '}
                      </Text>

                      <TouchableOpacity
                        hitSlop={styles.hitSlop}
                        onPress={() => setShowInfoModal('max_priority_fee')}
                      >
                        <MaterialCommunityIcon
                          name="information"
                          size={14}
                          style={styles.labelInfo}
                        />
                      </TouchableOpacity>
                    </View>
                  }
                  rightLabelComponent={
                    <Text noMargin small grey>
                      <Text bold reset>
                        {strings('edit_gas_fee_eip1559.estimate')}:
                      </Text>{' '}
                      {
                        gasOptions?.[suggestedEstimateOption]
                          ?.suggestedMaxPriorityFeePerGas
                      }{' '}
                      GWEI
                    </Text>
                  }
                  value={gasFee.suggestedMaxPriorityFeePerGas}
                  name={strings('edit_gas_fee_eip1559.max_priority_fee')}
                  unit={'GWEI'}
                  min={GAS_MIN}
                  increment={GAS_INCREMENT}
                  inputInsideLabel={
                    maxPriorityFeePerGasPrimary &&
                    `≈ ${maxPriorityFeePerGasPrimary}`
                  }
                  error={maxPriorityFeeError}
                  onChangeValue={changedMaxPriorityFee}
                />
              </View>
              <View style={styles.rangeInputContainer}>
                <RangeInput
                  leftLabelComponent={
                    <View style={styles.labelTextContainer}>
                      <Text
                        black={!maxFeeError}
                        red={Boolean(maxFeeError)}
                        bold
                        noMargin
                      >
                        {strings('edit_gas_fee_eip1559.max_fee')}{' '}
                      </Text>

                      <TouchableOpacity
                        hitSlop={styles.hitSlop}
                        onPress={() => setShowInfoModal('max_fee')}
                      >
                        <MaterialCommunityIcon
                          name="information"
                          size={14}
                          style={styles.labelInfo}
                        />
                      </TouchableOpacity>
                    </View>
                  }
                  rightLabelComponent={
                    <Text noMargin small grey>
                      <Text bold reset>
                        {strings('edit_gas_fee_eip1559.estimate')}:
                      </Text>{' '}
                      {
                        gasOptions?.[suggestedEstimateOption]
                          ?.suggestedMaxFeePerGas
                      }{' '}
                      GWEI
                    </Text>
                  }
                  value={gasFee.suggestedMaxFeePerGas}
                  name={strings('edit_gas_fee_eip1559.max_fee')}
                  unit={'GWEI'}
                  min={GAS_MIN}
                  increment={GAS_INCREMENT}
                  error={maxFeeError}
                  onChangeValue={changedMaxFeePerGas}
                  inputInsideLabel={
                    maxFeePerGasPrimary && `≈ ${maxFeePerGasPrimary}`
                  }
                />
              </View>
            </View>
          )}
        </View>
      </FadeAnimationView>
      <View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={toggleLearnMoreModal}
        >
          <Text link centered>
            {strings('edit_gas_fee_eip1559.learn_more.title')}
          </Text>
        </TouchableOpacity>
        <StyledButton
          type={'confirm'}
          onPress={save}
          disabled={Boolean(error) || isAnimating}
        >
          {updateOption
            ? strings('edit_gas_fee_eip1559.submit')
            : strings('edit_gas_fee_eip1559.save')}
        </StyledButton>
      </View>
    </View>
  );

  const renderWarning = (): ReactNode => {
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

  const renderError = (): ReactNode => {
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

  const renderDisplayTitle = (): string => {
    if (updateOption)
      return updateOption.isCancel
        ? strings('edit_gas_fee_eip1559.cancel_transaction')
        : strings('edit_gas_fee_eip1559.speed_up_transaction');
    return strings('edit_gas_fee_eip1559.edit_priority');
  };

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
                  {renderDisplayTitle()}
                </Text>
                <Icon
                  name={'arrow-back'}
                  size={24}
                  color={colors.background.default}
                />
              </View>
              {updateOption && (
                <View style={styles.newGasFeeHeader}>
                  <Text black bold noMargin>
                    {strings('edit_gas_fee_eip1559.new_gas_fee')}{' '}
                  </Text>

                  <TouchableOpacity
                    hitSlop={styles.hitSlop}
                    onPress={() => setShowInfoModal('new_gas_fee')}
                  >
                    <MaterialCommunityIcon
                      name="information"
                      size={14}
                      style={styles.labelInfo}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {renderWarning()}
            {renderError()}
            <FadeAnimationView
              style={styles.headerContainer}
              valueToWatch={valueToWatch}
              animateOnChange={animateOnChange}
            >
              <View style={styles.headerTitle}>
                <Text
                  black
                  style={styles.headerText}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  noMargin
                >
                  ~{gasFeePrimary}
                </Text>
              </View>
              <Text big black style={styles.subheader} noMargin>
                <Text bold black noMargin>
                  {strings('edit_gas_fee_eip1559.max_fee')}:{' '}
                </Text>
                {gasFeeMaxPrimary} ({gasFeeMaxSecondary})
              </Text>
              <View style={styles.labelTextContainer}>
                <Text
                  green={
                    timeEstimateColor === 'green' ||
                    timeEstimateId === AppConstants.GAS_TIMES.VERY_LIKELY
                  }
                  red={timeEstimateColor === 'red'}
                  bold
                >
                  {timeEstimate}
                </Text>
                {(timeEstimateId === AppConstants.GAS_TIMES.MAYBE ||
                  timeEstimateId === AppConstants.GAS_TIMES.UNKNOWN) && (
                  <TouchableOpacity
                    hitSlop={styles.hitSlop}
                    onPress={showTimeEstimateInfoModal}
                  >
                    <MaterialCommunityIcon
                      name="information"
                      size={14}
                      style={styles.redInfo}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </FadeAnimationView>
            {!showInputs ? (
              <View style={styles.dappEditGasContainer}>
                <StyledButton
                  type={'orange'}
                  onPress={() => setShowInputs(true)}
                >
                  {strings('edit_gas_fee_eip1559.edit_suggested_gas_fee')}
                </StyledButton>
              </View>
            ) : (
              renderInputs()
            )}
            <InfoModal
              isVisible={Boolean(showInfoModal)}
              title={
                showInfoModal === 'gas_limit'
                  ? strings('edit_gas_fee_eip1559.gas_limit')
                  : showInfoModal === 'max_priority_fee'
                    ? strings('edit_gas_fee_eip1559.max_priority_fee')
                    : showInfoModal === 'max_fee'
                      ? strings('edit_gas_fee_eip1559.max_fee')
                      : showInfoModal === 'new_gas_fee'
                        ? strings('edit_gas_fee_eip1559.new_gas_fee')
                        : null
              }
              toggleModal={() => setShowInfoModal(null)}
              body={
                <View>
                  <Text grey infoModal>
                    {showInfoModal === 'gas_limit' &&
                      strings('edit_gas_fee_eip1559.learn_more_gas_limit')}
                    {showInfoModal === 'max_priority_fee' &&
                      strings(
                        'edit_gas_fee_eip1559.learn_more_max_priority_fee',
                      )}
                    {showInfoModal === 'max_fee' &&
                      strings('edit_gas_fee_eip1559.learn_more_max_fee')}
                    {showInfoModal === 'new_gas_fee' &&
                    updateOption &&
                    updateOption.isCancel
                      ? strings(
                          'edit_gas_fee_eip1559.learn_more_cancel_gas_fee',
                        )
                      : strings('edit_gas_fee_eip1559.learn_more_new_gas_fee')}
                  </Text>
                </View>
              }
            />
            <InfoModal
              isVisible={showLearnMoreModal}
              title={strings('edit_gas_fee_eip1559.learn_more.title')}
              toggleModal={toggleLearnMoreModal}
              propagateSwipe
              body={
                <View style={styles.learnMoreModal}>
                  <ScrollView>
                    <TouchableWithoutFeedback>
                      <View>
                        <Text noMargin grey infoModal>
                          {strings('edit_gas_fee_eip1559.learn_more.intro')}
                        </Text>
                        <Text
                          noMargin
                          primary
                          infoModal
                          bold
                          style={styles.learnMoreLabels}
                        >
                          {strings('edit_gas_fee_eip1559.learn_more.low_label')}
                        </Text>
                        <Text noMargin grey infoModal>
                          {strings('edit_gas_fee_eip1559.learn_more.low_text')}
                        </Text>
                        <Text
                          noMargin
                          primary
                          infoModal
                          bold
                          style={styles.learnMoreLabels}
                        >
                          {strings(
                            'edit_gas_fee_eip1559.learn_more.market_label',
                          )}
                        </Text>
                        <Text noMargin grey infoModal>
                          {strings(
                            'edit_gas_fee_eip1559.learn_more.market_text',
                          )}
                        </Text>
                        <Text
                          noMargin
                          primary
                          infoModal
                          bold
                          style={styles.learnMoreLabels}
                        >
                          {strings(
                            'edit_gas_fee_eip1559.learn_more.aggressive_label',
                          )}
                        </Text>
                        <Text noMargin grey infoModal>
                          {strings(
                            'edit_gas_fee_eip1559.learn_more.aggressive_text',
                          )}
                        </Text>
                      </View>
                    </TouchableWithoutFeedback>
                  </ScrollView>
                </View>
              }
            />
            <TimeEstimateInfoModal
              isVisible={isVisibleTimeEstimateInfoModal}
              timeEstimateId={timeEstimateId}
              onHideModal={hideTimeEstimateInfoModal}
            />
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

export default EditGasFee1559;
