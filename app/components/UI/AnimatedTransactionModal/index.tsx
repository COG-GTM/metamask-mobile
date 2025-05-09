import React, { PureComponent } from 'react';
import { StyleSheet, Animated, Easing, LayoutChangeEvent, ViewStyle } from 'react-native';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';

interface StylesType {
  root: ViewStyle;
  transactionEdit: ViewStyle;
  transactionReview: ViewStyle;
}

const createStyles = (colors: Colors): StylesType =>
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

type TranslationName = 'reviewToEdit' | 'editToAdvanced' | 'reviewToData';
type ValueType = 'modal' | 'saveButton' | TranslationName;
type AnimationTime = 'start' | 'end';
type OriginComponent = 'dapp' | 'wallet';
type AdvancedFrom = 'edit' | 'review';
type Mode = 'review' | 'edit';

interface AnimateParams {
  modalEndValue: number;
  xTranslationName: TranslationName;
  xTranslationEndValue: number;
}

interface AnimatedTransactionModalProps {
  /**
   * Changes the mode to 'review'
   */
  review: () => void;
  /**
   * Called when a user changes modes
   */
  onModeChange: (mode: Mode) => void;
  /**
   * Whether or not basic gas estimates have been fetched
   */
  ready?: boolean;
  /**
   * Children components
   */
  children: React.ReactNode | React.ReactNode[];
}

interface AnimatedTransactionModalState {
  originComponent: OriginComponent;
  modalValue: Animated.Value;
  width: number;
  rootHeight: number | null;
  customGasHeight: number;
  transactionReviewDataHeight: number | null;
  hideGasSelectors: boolean;
  hideData: boolean;
  advancedCustomGas: boolean;
  toAdvancedFrom: AdvancedFrom;
  mode: Mode;
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

  xTranslationMappings: Record<TranslationName, Animated.Value> = {
    reviewToEdit: this.reviewToEditValue,
    editToAdvanced: this.editToAdvancedValue,
    reviewToData: this.reviewToDataValue,
  };

  state: AnimatedTransactionModalState = {
    originComponent:
      React.Children.toArray(this.props.children).length > 1
        ? 'dapp'
        : 'wallet',
    modalValue:
      React.Children.toArray(this.props.children).length > 1
        ? new Animated.Value(1)
        : new Animated.Value(0),
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

  review = (): void => {
    this.props.review();
    this.onModeChange('review');
  };

  onModeChange = (mode: Mode): void => {
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
    this.props.onModeChange(mode);
  };

  animate = ({ modalEndValue, xTranslationName, xTranslationEndValue }: AnimateParams): void => {
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
    xTranslationName: TranslationName,
    xTranslationEndValue: number,
    animationTime: AnimationTime
  ): void => {
    //data view is hidden by default because when we switch from review to edit, since view is nested in review, it also gets transformed. It's shown if it's the animation's destination.
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

  generateTransform = (valueType: ValueType, outRange: number[]): { transform: { translateY: Animated.AnimatedInterpolation<number> }[] } | { transform: { translateX: Animated.AnimatedInterpolation<number> }[] } => {
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
    else if (valueType === 'reviewToData') value = this.reviewToDataValue;
    else {
      value = this.reviewToEditValue;
    }
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
    //70 is the fixed height + margin of the error message in advanced custom gas. It expands 70 units vertically to accomodate it
    return 70 / ((rootHeight || 0) - customGasHeight);
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

  render = () => {
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
    const colors = this.context.colors || mockTheme.colors;
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
            {React.cloneElement(components[0] as React.ReactElement, {
              ...(components[0] as React.ReactElement).props,
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

        {ready && (
          <Animated.View style={[styles.transactionEdit, gasTransformStyle]}>
            {React.cloneElement(gasComponent as React.ReactElement, {
              ...(gasComponent as React.ReactElement).props,
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
