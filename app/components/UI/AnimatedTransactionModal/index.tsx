import React, { PureComponent, ReactNode } from 'react';
import { StyleSheet, Animated, Easing, LayoutChangeEvent } from 'react-native';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Theme } from '@metamask/design-tokens';

const createStyles = (colors: Theme['colors']) =>
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

const customGasHeightPlaceHolder = 400;

interface AnimatedTransactionModalProps {
  review?: () => void;
  onModeChange?: (mode: string) => void;
  ready?: boolean;
  children: ReactNode;
}

interface AnimatedTransactionModalState {
  originComponent: 'dapp' | 'wallet';
  modalValue: Animated.Value;
  width: number;
  rootHeight: number | null;
  customGasHeight: number;
  transactionReviewDataHeight: number | null;
  hideGasSelectors: boolean;
  hideData: boolean;
  advancedCustomGas: boolean;
  toAdvancedFrom: string;
  mode: string;
}

interface AnimateParams {
  modalEndValue: number;
  xTranslationName: 'reviewToEdit' | 'editToAdvanced' | 'reviewToData';
  xTranslationEndValue: number;
}

/**
 * PureComponent that handles most of the animation/transition logic
 */
class AnimatedTransactionModal extends PureComponent<
  AnimatedTransactionModalProps,
  AnimatedTransactionModalState
> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  reviewToEditValue = new Animated.Value(0);
  reviewToDataValue = new Animated.Value(0);
  editToAdvancedValue = new Animated.Value(0);

  xTranslationMappings: Record<string, Animated.Value> = {
    reviewToEdit: this.reviewToEditValue,
    editToAdvanced: this.editToAdvancedValue,
    reviewToData: this.reviewToDataValue,
  };

  constructor(props: AnimatedTransactionModalProps) {
    super(props);
    const childrenCount = React.Children.toArray(props?.children).length;
    this.state = {
      originComponent: childrenCount > 1 ? 'dapp' : 'wallet',
      modalValue: childrenCount > 1 ? new Animated.Value(1) : new Animated.Value(0),
      width: Device.getDeviceWidth(),
      rootHeight: null,
      customGasHeight: customGasHeightPlaceHolder,
      transactionReviewDataHeight: null,
      hideGasSelectors: false,
      hideData: true,
      advancedCustomGas: false,
      toAdvancedFrom: 'edit',
      mode: 'review',
    };
  }

  review = (): void => {
    this.props.review?.();
    this.onModeChange('review');
  };

  onModeChange = (mode: string): void => {
    if (mode === 'edit') {
      this.setState({ toAdvancedFrom: 'review' });
      this.animate({
        modalEndValue: this.state.advancedCustomGas
          ? this.getAnimatedModalValueForAdvancedCG()
          : 0,
        xTranslationName: 'reviewToEdit',
        xTranslationEndValue: 1,
      });
    } else {
      this.animate({
        modalEndValue: 1,
        xTranslationName: 'reviewToEdit',
        xTranslationEndValue: 0,
      });
    }
    this.props.onModeChange?.(mode);
  };

  animate = ({
    modalEndValue,
    xTranslationName,
    xTranslationEndValue,
  }: AnimateParams): void => {
    const { modalValue } = this.state;
    this.hideComponents(xTranslationName, xTranslationEndValue, 'start');
    Animated.parallel([
      Animated.timing(modalValue, {
        toValue: modalEndValue,
        duration: 250,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(this.xTranslationMappings[xTranslationName], {
        toValue: xTranslationEndValue,
        duration: 250,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start(() => {
      this.hideComponents(xTranslationName, xTranslationEndValue, 'end');
    });
  };

  toggleAdvancedCustomGas = (toggle = false): void => {
    const { advancedCustomGas } = this.state;
    this.setState({
      advancedCustomGas: toggle ? true : !advancedCustomGas,
      toAdvancedFrom: 'edit',
    });
  };

  hideComponents = (
    xTranslationName: string,
    xTranslationEndValue: number,
    animationTime: 'start' | 'end',
  ): void => {
    if (xTranslationName === 'editToAdvanced') {
      this.setState({
        hideGasSelectors: xTranslationEndValue === 1 && animationTime === 'end',
      });
    }
    if (xTranslationName === 'reviewToData') {
      this.setState({
        hideData: xTranslationEndValue === 0 && animationTime === 'end',
      });
    }
  };

  generateTransform = (
    valueType: string,
    outRange: number[],
  ): { transform: { translateY: Animated.AnimatedInterpolation<number> }[] } | { transform: { translateX: Animated.AnimatedInterpolation<number> }[] } => {
    const { modalValue } = this.state;
    if (valueType === 'modal' || valueType === 'saveButton') {
      return {
        transform: [
          {
            translateY: modalValue.interpolate({
              inputRange: [
                0,
                valueType === 'saveButton'
                  ? this.getAnimatedModalValueForAdvancedCG()
                  : 1,
              ],
              outputRange: outRange,
            }),
          },
        ],
      };
    }
    let value: Animated.Value;
    if (valueType === 'reviewToEdit') value = this.reviewToEditValue;
    else if (valueType === 'editToAdvanced') value = this.editToAdvancedValue;
    else value = this.reviewToDataValue;
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

  getAnimatedModalValueForAdvancedCG = (): number => {
    const { rootHeight, customGasHeight, originComponent } = this.state;
    if (originComponent === 'wallet') return 1;
    if (!rootHeight) return 1;
    return 70 / (rootHeight - customGasHeight);
  };

  saveRootHeight = (event: LayoutChangeEvent): void =>
    this.setState({ rootHeight: event.nativeEvent.layout.height });

  saveCustomGasHeight = (event: LayoutChangeEvent): void =>
    this.setState({ customGasHeight: event.nativeEvent.layout.height });

  saveTransactionReviewDataHeight = (event: LayoutChangeEvent): void => {
    if (!this.state.transactionReviewDataHeight) {
      this.setState({
        transactionReviewDataHeight: event.nativeEvent.layout.height,
      });
    }
  };

  getTransformValue = (): number => {
    const { rootHeight, customGasHeight } = this.state;
    return (rootHeight || 0) - customGasHeight;
  };

  render = (): React.ReactElement => {
    const {
      width,
      hideData,
      originComponent,
      customGasHeight,
      advancedCustomGas,
      hideGasSelectors,
      toAdvancedFrom,
    } = this.state;
    const { ready, children } = this.props;
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);
    const components = React.Children.toArray(children);
    let gasTransformStyle;
    let modalTransformStyle;
    let gasComponent;
    if (originComponent === 'dapp') {
      gasTransformStyle = this.generateTransform('reviewToEdit', [width, 0]);
      modalTransformStyle = this.generateTransform('modal', [
        this.getTransformValue(),
        0,
      ]);
      gasComponent = components[1];
    } else {
      gasTransformStyle = this.generateTransform('reviewToEdit', [0, -width]);
      modalTransformStyle = this.generateTransform('modal', [70, 0]);
      gasComponent = components[0];
    }

    return (
      <Animated.View
        style={[
          styles.root,
          modalTransformStyle,
          originComponent === 'wallet' && { height: customGasHeight + 70 },
        ]}
        onLayout={this.saveRootHeight}
      >
        {originComponent === 'dapp' && (
          <Animated.View
            style={[
              this.generateTransform('reviewToEdit', [0, -width]),
              styles.transactionReview,
            ]}
          >
            {React.isValidElement(components[0]) &&
              React.cloneElement(components[0] as React.ReactElement, {
                customGasHeight,
                hideData,
                generateTransform: this.generateTransform,
                animate: this.animate,
                saveTransactionReviewDataHeight:
                  this.saveTransactionReviewDataHeight,
                onModeChange: this.onModeChange,
              })}
          </Animated.View>
        )}

        {ready && gasComponent && (
          <Animated.View style={[styles.transactionEdit, gasTransformStyle]}>
            {React.isValidElement(gasComponent) &&
              React.cloneElement(gasComponent as React.ReactElement, {
                advancedCustomGas,
                hideGasSelectors,
                toAdvancedFrom,
                onModeChange: this.onModeChange,
                toggleAdvancedCustomGas: this.toggleAdvancedCustomGas,
                saveCustomGasHeight: this.saveCustomGasHeight,
                animate: this.animate,
                generateTransform: this.generateTransform,
                getAnimatedModalValueForAdvancedCG:
                  this.getAnimatedModalValueForAdvancedCG,
                review: this.review,
              })}
          </Animated.View>
        )}
      </Animated.View>
    );
  };
}

export default AnimatedTransactionModal;
