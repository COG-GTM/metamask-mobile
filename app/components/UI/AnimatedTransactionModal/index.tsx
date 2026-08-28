import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
import Device from '../../../util/device';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.background.default,
      minHeight: 200,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Device.isIphoneX() ? 24 : 0,
    },
    transactionEdit: {
      position: 'absolute',
      width: '100%',
      height: '100%',
    },
    transactionReview: {
      paddingTop: 24,
    },
  });

//This is a placeholder to represent the custom gas modal.
//TODO this custom gas modal needs to be removed from the animated tx modal.
const customGasHeightPlaceHolder = 400;

type XTranslationName = 'reviewToEdit' | 'editToAdvanced' | 'reviewToData';

interface AnimateParams {
  modalEndValue: number;
  xTranslationName: XTranslationName;
  xTranslationEndValue: number;
}

interface Props {
  /**
   * Changes the mode to 'review'
   */
  review?: () => void;
  /**
   * Called when a user changes modes
   */
  onModeChange?: (mode: string) => void;
  /**
   * Whether or not basic gas estimates have been fetched
   */
  ready?: boolean;
  /**
   * Children components
   */
  children: React.ReactNode;
}

/**
 * Component that handles most of the animation/transition logic
 */
const AnimatedTransactionModal = ({
  review: reviewProp,
  onModeChange: onModeChangeProp,
  ready,
  children,
}: Props) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [originComponent] = useState(
    React.Children.toArray(children).length > 1 ? 'dapp' : 'wallet',
  );
  const modalValueRef = useRef(
    React.Children.toArray(children).length > 1
      ? new Animated.Value(1)
      : new Animated.Value(0),
  );
  const [width] = useState(Device.getDeviceWidth());
  const [rootHeight, setRootHeight] = useState<number | null>(null);
  const [customGasHeight, setCustomGasHeight] = useState(
    customGasHeightPlaceHolder,
  );
  const [transactionReviewDataHeight, setTransactionReviewDataHeight] =
    useState<number | null>(null);
  const [hideGasSelectors, setHideGasSelectors] = useState(false);
  const [hideData, setHideData] = useState(true);
  const [advancedCustomGas, setAdvancedCustomGas] = useState(false);
  const [toAdvancedFrom, setToAdvancedFrom] = useState('edit');

  const reviewToEditValue = useRef(new Animated.Value(0));
  const reviewToDataValue = useRef(new Animated.Value(0));
  const editToAdvancedValue = useRef(new Animated.Value(0));

  const xTranslationMappings: Record<XTranslationName, Animated.Value> = {
    reviewToEdit: reviewToEditValue.current,
    editToAdvanced: editToAdvancedValue.current,
    reviewToData: reviewToDataValue.current,
  };

  const hideComponents = (
    xTranslationName: XTranslationName,
    xTranslationEndValue: number,
    animationTime: 'start' | 'end',
  ) => {
    //data view is hidden by default because when we switch from review to edit, since view is nested in review, it also gets transformed. It's shown if it's the animation's destination.
    if (xTranslationName === 'editToAdvanced') {
      setHideGasSelectors(
        xTranslationEndValue === 1 && animationTime === 'end',
      );
    }
    if (xTranslationName === 'reviewToData') {
      setHideData(xTranslationEndValue === 0 && animationTime === 'end');
    }
  };

  const animate = ({
    modalEndValue,
    xTranslationName,
    xTranslationEndValue,
  }: AnimateParams) => {
    hideComponents(xTranslationName, xTranslationEndValue, 'start');
    Animated.parallel([
      Animated.timing(modalValueRef.current, {
        toValue: modalEndValue,
        duration: 250,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(xTranslationMappings[xTranslationName], {
        toValue: xTranslationEndValue,
        duration: 250,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideComponents(xTranslationName, xTranslationEndValue, 'end');
    });
  };

  const getAnimatedModalValueForAdvancedCG = () => {
    if (originComponent === 'wallet') return 1;
    //70 is the fixed height + margin of the error message in advanced custom gas. It expands 70 units vertically to accomodate it
    return 70 / ((rootHeight ?? 0) - customGasHeight);
  };

  const onModeChange = (mode: string) => {
    if (mode === 'edit') {
      setToAdvancedFrom('review');
      animate({
        modalEndValue: advancedCustomGas
          ? getAnimatedModalValueForAdvancedCG()
          : 0,
        xTranslationName: 'reviewToEdit',
        xTranslationEndValue: 1,
      });
    } else {
      animate({
        modalEndValue: 1,
        xTranslationName: 'reviewToEdit',
        xTranslationEndValue: 0,
      });
    }
    onModeChangeProp?.(mode);
  };

  const review = () => {
    reviewProp?.();
    onModeChange('review');
  };

  const toggleAdvancedCustomGas = (toggle = false) => {
    setAdvancedCustomGas(toggle ? true : !advancedCustomGas);
    setToAdvancedFrom('edit');
  };

  const generateTransform = (valueType: string, outRange: number[]) => {
    if (valueType === 'modal' || valueType === 'saveButton') {
      return {
        transform: [
          {
            translateY: modalValueRef.current.interpolate({
              inputRange: [
                0,
                valueType === 'saveButton'
                  ? getAnimatedModalValueForAdvancedCG()
                  : 1,
              ],
              outputRange: outRange,
            }),
          },
        ],
      };
    }
    let value: Animated.Value = reviewToEditValue.current;
    if (valueType === 'editToAdvanced') value = editToAdvancedValue.current;
    else if (valueType === 'reviewToData') value = reviewToDataValue.current;
    return {
      transform: [
        {
          translateX: value.interpolate({
            inputRange: [0, 1],
            outputRange: outRange,
          }),
        },
      ],
    };
  };

  const saveRootHeight = (event: LayoutChangeEvent) =>
    setRootHeight(event.nativeEvent.layout.height);

  const saveCustomGasHeight = (event: LayoutChangeEvent) =>
    setCustomGasHeight(event.nativeEvent.layout.height);

  const saveTransactionReviewDataHeight = (event: LayoutChangeEvent) => {
    if (!transactionReviewDataHeight) {
      setTransactionReviewDataHeight(event.nativeEvent.layout.height);
    }
  };

  const getTransformValue = () => (rootHeight ?? 0) - customGasHeight;

  const components = React.Children.toArray(children) as React.ReactElement[];
  let gasTransformStyle;
  let modalTransformStyle;
  let gasComponent: React.ReactElement;
  if (originComponent === 'dapp') {
    gasTransformStyle = generateTransform('reviewToEdit', [width, 0]);
    modalTransformStyle = generateTransform('modal', [getTransformValue(), 0]);
    gasComponent = components[1];
  } else {
    gasTransformStyle = generateTransform('reviewToEdit', [0, -width]);
    modalTransformStyle = generateTransform('modal', [70, 0]);
    gasComponent = components[0];
  }

  return (
    <Animated.View
      style={[
        styles.root,
        modalTransformStyle,
        originComponent === 'wallet' && { height: customGasHeight + 70 },
      ]}
      onLayout={saveRootHeight}
    >
      {originComponent === 'dapp' && (
        <Animated.View
          style={[
            generateTransform('reviewToEdit', [0, -width]),
            styles.transactionReview,
          ]}
        >
          {React.cloneElement(components[0], {
            ...components[0].props,
            customGasHeight,
            hideData,
            generateTransform,
            animate,
            saveTransactionReviewDataHeight,
            onModeChange,
          })}
        </Animated.View>
      )}

      {ready && (
        <Animated.View style={[styles.transactionEdit, gasTransformStyle]}>
          {React.cloneElement(gasComponent, {
            ...gasComponent.props,
            advancedCustomGas,
            hideGasSelectors,
            toAdvancedFrom,
            onModeChange,
            toggleAdvancedCustomGas,
            saveCustomGasHeight,
            animate,
            generateTransform,
            getAnimatedModalValueForAdvancedCG,
            review,
          })}
        </Animated.View>
      )}
    </Animated.View>
  );
};

export default AnimatedTransactionModal;
