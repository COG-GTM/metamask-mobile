import React, { useCallback, useRef, useEffect, useState, ReactNode } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import Text from './Text';
import BigNumber from 'bignumber.js';
import { useTheme } from '../../util/theme';
import { Theme } from '../../util/theme/models';

const createStyles = (colors: Theme['colors']) => {
  const rangeInputContainer = (error: boolean) => ({
    borderColor: error ? colors.error.default : colors.border.default,
    borderWidth: 1,
    borderRadius: 6,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    height: 42,
  });

  const input = (error: boolean) => ({
    height: 38,
    minWidth: 10,
    paddingRight: 6,
    color: error ? colors.error.default : colors.text.default,
  });

  return {
    ...StyleSheet.create({
      labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        flexWrap: 'wrap',
      },
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
    }),
    rangeInputContainer,
    input,
    hitSlop: {
      top: 10,
      left: 10,
      bottom: 10,
      right: 10,
    },
  };
};

interface RangeInputProps {
  rightLabelComponent?: ReactNode;
  leftLabelComponent?: ReactNode;
  value?: string;
  unit?: string;
  onChangeValue?: (value: string) => void;
  increment?: BigNumber;
  inputInsideLabel?: string;
  error?: string;
  min?: BigNumber;
  max?: BigNumber;
  name?: string;
}

const RangeInput = ({
  leftLabelComponent,
  rightLabelComponent,
  value,
  unit,
  increment = new BigNumber(1),
  onChangeValue,
  inputInsideLabel,
  error,
  min,
  max,
  name,
}: RangeInputProps) => {
  const textInput = useRef<TextInput>(null);
  const [errorState, setErrorState] = useState<string>('');
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
    const newValue = new BigNumber(value || 0).plus(new BigNumber(increment));
    if (max && !new BigNumber(max).isNaN() && newValue.gt(max)) return;
    changeValue(newValue.toString());
  }, [changeValue, increment, max, value]);

  const decreaseNumber = useCallback(() => {
    const newValue = new BigNumber(value || 0).minus(new BigNumber(increment));
    if (min && !new BigNumber(min).isNaN() && newValue.lt(min)) return;
    changeValue(newValue.toString());
  }, [changeValue, increment, min, value]);

  const renderLabelComponent = useCallback((component: ReactNode) => {
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
    if (min && new BigNumber(value || 0).lt(min)) {
      setErrorState(`${name} must be at least ${min}`);
      return changeValue(min.toString(), true);
    }
    if (max && new BigNumber(value || 0).gt(max)) {
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
