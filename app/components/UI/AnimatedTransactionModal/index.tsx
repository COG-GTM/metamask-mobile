import React, { PureComponent } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any) =>
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

/**
 * PureComponent that handles most of the animation/transition logic
 */
interface AnimatedTransactionModalProps {
  review?: () => void;
  onModeChange?: (mode: string) => void;
  ready?: boolean;
  children: React.ReactNode;
}

interface AnimatedTransactionModalState {
  originComponent: string;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modalValue: any;
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
  state = {
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

  xTranslationMappings = {
    reviewToEdit: this.reviewToEditValue,
    editToAdvanced: this.editToAdvancedValue,
    reviewToData: this.reviewToDataValue,
  };

  review = () => {
    // @ts-expect-error Legacy JS code needs type refinement
    this.props.review();
    this.onModeChange('review');
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onModeChange = (mode: any) => {
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
    // @ts-expect-error Legacy JS code needs type refinement
    this.props.onModeChange(mode);
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animate = ({ modalEndValue, xTranslationName, xTranslationEndValue }: any) => {
    const { modalValue } = this.state;
    this.hideComponents(xTranslationName, xTranslationEndValue, 'start');
    Animated.parallel([
      Animated.timing(modalValue, {
        toValue: modalEndValue,
        duration: 250,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      // @ts-expect-error Legacy JS code needs type refinement
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

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hideComponents = (xTranslationName: any, xTranslationEndValue: any, animationTime: any) => {
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

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateTransform = (valueType: any, outRange: any) => {
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
    let value;
    if (valueType === 'reviewToEdit') value = this.reviewToEditValue;
    else if (valueType === 'editToAdvanced') value = this.editToAdvancedValue;
    else if (valueType === 'reviewToData') value = this.reviewToDataValue;
    return {
      transform: [
        {
          // @ts-expect-error Legacy JS code needs type refinement
          translateX: value.interpolate({
            inputRange: [0, 1],
            outputRange: outRange,
          }),
        },
      ],
    };
  };

  getAnimatedModalValueForAdvancedCG = () => {
    const { rootHeight, customGasHeight, originComponent } = this.state;
    if (originComponent === 'wallet') return 1;
    //70 is the fixed height + margin of the error message in advanced custom gas. It expands 70 units vertically to accomodate it
    // @ts-expect-error Legacy JS code needs type refinement
    return 70 / (rootHeight - customGasHeight);
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveRootHeight = (event: any) =>
    this.setState({ rootHeight: event.nativeEvent.layout.height });

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveCustomGasHeight = (event: any) =>
    this.setState({ customGasHeight: event.nativeEvent.layout.height });

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveTransactionReviewDataHeight = (event: any) =>
    !this.state.transactionReviewDataHeight &&
    this.setState({
      transactionReviewDataHeight: event.nativeEvent.layout.height,
    });

  getTransformValue = () => {
    const { rootHeight, customGasHeight } = this.state;
    // @ts-expect-error Legacy JS code needs type refinement
    return rootHeight - customGasHeight;
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
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colors = (this.context as any).colors || mockTheme.colors;
    const styles = createStyles(colors);
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const components = React.Children.toArray(children) as any[];
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
