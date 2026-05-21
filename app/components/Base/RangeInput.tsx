import React, { useCallback, useRef, useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import Text from './Text';
import BigNumber from 'bignumber.js';
import { useTheme } from '../../util/theme';

const createStyles = (colors: Record<string, Record<string, string>>) =>
  StyleSheet.create({
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      flexWrap: 'wrap',
    },
    rangeInputContainer: (error) => ({
      borderColor: error ? colors.error.default : colors.border.default,
      borderWidth: 1,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 42,
    }),
    input: (error) => ({
      height: 38,
      minWidth: 10,
      paddingRight: 6,
      color: error ? colors.error.default : colors.text.default,
    }),
    buttonContainerLeft: {
      marginLeft: 17,
      flex: 1,
    },
    buttonContainerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginRight: 17,
      flex: 1,
    },
    button: {
      borderRadius: 100,
      borderWidth: 2,
      borderColor: colors.primary.default,
      height: 20,
      width: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      paddingTop: 1,
      paddingLeft: 0.5,
      color: colors.primary.default,
    },
    hitSlop: {
      top: 10,
      left: 10,
      bottom: 10,
      right: 10,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorContainer: {
      marginTop: 8,
      color: colors.error.default,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorText: {
      color: colors.text.default,
    },
    errorIcon: {
      paddingRight: 4,
      color: colors.error.default,
    },
    conversionEstimation: {
      paddingLeft: 2,
      marginRight: 14,
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
    },
  });

interface Props {
  leftLabelComponent?: React.ReactNode;
  rightLabelComponent?: React.ReactNode;
  value: number | string;
  unit?: string;
  increment?: number | BigNumber;
  onChangeValue: (value: string) => void;
  inputInsideLabel?: boolean;
  error?: string;
  min?: number | BigNumber;
  max?: number | BigNumber;
  name?: string;
}

const RangeInput = ({
  leftLabelComponent,
  rightLabelComponent,
  value,
  unit,
  increment = 1,
  onChangeValue,
  inputInsideLabel,
  error,
  min,
  max,
  name,
}: Props) => {
  const textInput = useRef(null);
  const [errorState, setErrorState] = useState();
  const { colors, themeAppearance } = useTheme();
  const styles = createStyles(colors);

  const handleClickUnit = useCallback(() => {
    textInput?.current?.focus?.();
  }, []);

  const changeValue = useCallback(
    (newValue: string, dontEmptyError?: boolean) => {
      if (!dontEmptyError) setErrorState('');
      const cleanValue = newValue?.replace?.(',', '.');
      if (cleanValue && new BigNumber(cleanValue).isNaN()) {
        setErrorState(`${name} must be a number`);
        return;
      }

      onChangeValue?.(cleanValue);
    },
    [name, onChangeValue],
  );

  const increaseNumber = useCallback(() => {
    const newValue = new BigNumber(value).plus(new BigNumber(increment));
    if (!new BigNumber(max).isNaN() && newValue.gt(max)) return;
    changeValue(newValue.toString());
  }, [changeValue, increment, max, value]);

  const decreaseNumber = useCallback(() => {
    const newValue = new BigNumber(value).minus(new BigNumber(increment));
    if (!new BigNumber(min).isNaN() && newValue.lt(min)) return;
    changeValue(newValue.toString());
  }, [changeValue, increment, min, value]);

  const renderLabelComponent = useCallback((component) => {
    if (!component) return null;
    if (typeof component === 'string')
      return (
        <Text noMargin black bold>
          {component}
        </Text>
      );
    return component;
  }, []);

  const checkLimits = useCallback(() => {
    if (new BigNumber(value || 0).lt(min)) {
      setErrorState(`${name} must be at least ${min}`);
      return changeValue(min.toString(), true);
    }
    if (new BigNumber(value || 0).gt(max)) {
      setErrorState(`${name} must be at most ${max}`);
      return changeValue(max.toString());
    }
  }, [changeValue, max, min, name, value]);

  useEffect(() => {
    if (textInput?.current?.isFocused?.()) return;
    checkLimits();
  }, [checkLimits]);

  const hasError = Boolean(error) || Boolean(errorState);

  return (
    <View>
      <View style={styles.labelContainer}>
        {renderLabelComponent(leftLabelComponent)}
        {renderLabelComponent(rightLabelComponent)}
      </View>

      <View style={styles.rangeInputContainer(Boolean(error))}>
        <View style={styles.buttonContainerLeft}>
          <TouchableOpacity
            style={styles.button}
            hitSlop={styles.hitSlop}
            onPress={decreaseNumber}
          >
            <FontAwesomeIcon name="minus" size={10} style={styles.buttonText} />
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input(Boolean(error))}
            onChangeText={changeValue}
            onBlur={checkLimits}
            value={value}
            keyboardType="numeric"
            ref={textInput}
            keyboardAppearance={themeAppearance}
          />
          {!!unit && (
            <Text onPress={handleClickUnit} black={!error} red={Boolean(error)}>
              {unit}
            </Text>
          )}
        </View>
        <View style={styles.buttonContainerRight}>
          <Text
            style={styles.conversionEstimation}
            adjustsFontSizeToFit
            numberOfLines={2}
          >
            {inputInsideLabel}
          </Text>
          <TouchableOpacity
            style={styles.button}
            hitSlop={styles.hitSlop}
            onPress={increaseNumber}
          >
            <FontAwesomeIcon name="plus" size={10} style={styles.buttonText} />
          </TouchableOpacity>
        </View>
      </View>
      {hasError && (
        <View style={styles.errorContainer}>
          <FontAwesomeIcon
            name="exclamation-circle"
            size={14}
            style={styles.errorIcon}
          />
          <Text red noMargin small style={styles.errorText}>
            {error || errorState}
          </Text>
        </View>
      )}
    </View>
  );
};



export default RangeInput;
