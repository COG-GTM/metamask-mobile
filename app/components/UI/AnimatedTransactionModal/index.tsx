import React, { PureComponent, ReactNode, ReactElement } from 'react';
import { StyleSheet, Animated, Easing, LayoutChangeEvent } from 'react-native';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Theme } from '../../../util/theme/models';

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

type XTranslationName = 'reviewToEdit' | 'editToAdvanced' | 'reviewToData';

interface AnimateParams {
  modalEndValue: number;
  xTranslationName: XTranslationName;
  xTranslationEndValue: number;
}

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

class AnimatedTransactionModal extends PureComponent<AnimatedTransactionModalProps, AnimatedTransactionModalState> {
  declare context: Theme;

  state: AnimatedTransactionModalState = {
    originComponent:
      React.Children.toArray(this.props?.children).length > 1
        ? 'dapp'
        : 'wallet',
    modalValue:
      React.Children.toArray(this.props?.children).length > 1
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

  reviewToEditValue = new Animated.Value(0);
  reviewToDataValue = new Animated.Value(0);
  editToAdvancedValue = new Animated.Value(0);

  xTranslationMappings: Record<XTranslationName, Animated.Value> = {
    reviewToEdit: this.reviewToEditValue,
    editToAdvanced: this.editToAdvancedValue,
    reviewToData: this.reviewToDataValue,
  };

  review = () => {
    this.props.review?.();
    this.onModeChange('review');
  };

  onModeChange = (mode: string) => {
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

  animate = ({ modalEndValue, xTranslationName, xTranslationEndValue }: AnimateParams) => {
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

  toggleAdvancedCustomGas = (toggle = false) => {
    const { advancedCustomGas } = this.state;
    this.setState({
      advancedCustomGas: toggle ? true : !advancedCustomGas,
      toAdvancedFrom: 'edit',
    });
  };

  hideComponents = (xTranslationName: XTranslationName, xTranslationEndValue: number, animationTime: 'start' | 'end') => {
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

  generateTransform = (valueType: string, outRange: number[]) => {
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
    else value = this.reviewToEditValue;
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

  saveRootHeight = (event: LayoutChangeEvent) =>
    this.setState({ rootHeight: event.nativeEvent.layout.height });

  saveCustomGasHeight = (event: LayoutChangeEvent) =>
    this.setState({ customGasHeight: event.nativeEvent.layout.height });

  saveTransactionReviewDataHeight = (event: LayoutChangeEvent) =>
    !this.state.transactionReviewDataHeight &&
    this.setState({
      transactionReviewDataHeight: event.nativeEvent.layout.height,
    });

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
    const components = React.Children.toArray(children) as ReactElement[];
    let gasTransformStyle;
    let modalTransformStyle;
    let gasComponent: ReactElement;
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
            {React.cloneElement(components[0], {
              ...components[0].props,
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
            {React.cloneElement(gasComponent, {
              ...gasComponent.props,
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

AnimatedTransactionModal.contextType = ThemeContext;

export default AnimatedTransactionModal;
