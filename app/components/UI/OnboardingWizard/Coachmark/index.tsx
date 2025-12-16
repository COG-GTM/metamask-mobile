import React, { PureComponent, ReactNode } from 'react';
import { Animated, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import {
  colors as importedColors,
  fontStyles,
} from '../../../../styles/common';
import StyledButton from '../../StyledButton';
import { strings } from '../../../../../locales/i18n';
import { mockTheme, ThemeContext } from '../../../../util/theme';
import ButtonIcon, {
  ButtonIconSizes,
} from '../../../../component-library/components/Buttons/ButtonIcon';
import {
  IconName,
  IconColor,
} from '../../../../component-library/components/Icons/Icon';
import { typography } from '@metamask/design-tokens';
import {
  ButtonSize,
  ButtonVariants,
  ButtonWidthTypes,
} from '../../../../component-library/components/Buttons/Button';
import Button from '../../../../component-library/components/Buttons/Button/Button';
import { OnboardingWizardModalSelectorsIDs } from '../../../../../e2e/selectors/Onboarding/OnboardingWizardModal.selectors';
import {
  getFontFamily,
  TextVariant,
} from '../../../../component-library/components/Texts/Text';
import { Theme } from '../../../../util/theme/models';

interface Styles {
  coachmark: ViewStyle;
  progress: ViewStyle;
  actions: ViewStyle;
  actionButtonPrimary: ViewStyle;
  actionButtonSecondary: ViewStyle;
  title: TextStyle;
  triangle: ViewStyle;
  triangleDown: ViewStyle;
  progressButton: ViewStyle;
  leftProgessButton: ViewStyle;
  rightProgessButton: ViewStyle;
  topCenter: ViewStyle;
  topLeft: ViewStyle;
  topRight: ViewStyle;
  topLeftCorner: ViewStyle;
  topRightCorner: ViewStyle;
  bottomCenter: ViewStyle;
  bottomLeft: ViewStyle;
  bottomLeftCorner: ViewStyle;
  bottomRight: ViewStyle;
  circle: ViewStyle;
  solidCircle: ViewStyle;
  progessContainer: ViewStyle;
  stepCounter: TextStyle;
  titleContainer: ViewStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
  StyleSheet.create({
    coachmark: {
      backgroundColor: colors.primary.default,
      borderRadius: 8,
      padding: 20,
    },
    progress: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    actions: {
      flexDirection: 'row',
    },
    actionButtonPrimary: {
      flex: 0.5,
      borderWidth: 1,
      borderColor: colors.primary.inverse,
      marginRight: 4,
    },
    actionButtonSecondary: {
      flex: 0.5,
      backgroundColor: colors.primary.inverse,
      marginLeft: 4,
    },
    title: {
      ...fontStyles.bold,
      color: colors.primary.inverse,
      fontSize: 18,
      alignSelf: 'center',
    },
    triangle: {
      width: 0,
      height: 0,
      backgroundColor: importedColors.transparent,
      borderStyle: 'solid',
      borderLeftWidth: 15,
      borderRightWidth: 15,
      borderBottomWidth: 12,
      borderLeftColor: importedColors.transparent,
      borderRightColor: importedColors.transparent,
      borderBottomColor: colors.primary.default,
      position: 'absolute',
    },
    triangleDown: {
      width: 0,
      height: 0,
      backgroundColor: importedColors.transparent,
      borderStyle: 'solid',
      borderLeftWidth: 15,
      borderRightWidth: 15,
      borderTopWidth: 12,
      borderLeftColor: importedColors.transparent,
      borderRightColor: importedColors.transparent,
      borderTopColor: colors.primary.default,
      position: 'absolute',
    },
    progressButton: {
      width: 75,
      height: 45,
      padding: 5,
    },
    leftProgessButton: {
      left: 0,
    },
    rightProgessButton: {
      right: 0,
    },
    topCenter: {
      marginBottom: 10,
      bottom: -2,
      alignItems: 'center',
    },
    topLeft: {
      marginBottom: 10,
      bottom: -2,
      alignItems: 'flex-start',
      marginLeft: 30,
    },
    topRight: {
      marginBottom: 10,
      bottom: -2,
      alignItems: 'flex-end',
      marginRight: 38,
    },
    topLeftCorner: {
      marginBottom: 10,
      bottom: -2,
      alignItems: 'flex-start',
      marginLeft: 12,
    },
    topRightCorner: {
      marginBottom: 10,
      bottom: -2,
      alignItems: 'flex-end',
      marginRight: 12,
    },
    bottomCenter: {
      marginBottom: 10,
      top: -2,
      alignItems: 'center',
    },
    bottomLeft: {
      marginBottom: 10,
      top: -2,
      alignItems: 'flex-start',
      marginLeft: 60,
    },
    bottomLeftCorner: {
      marginBottom: 10,
      top: -2,
      alignItems: 'flex-start',
      marginLeft: 30,
    },
    bottomRight: {
      marginBottom: 10,
      top: -2,
      alignItems: 'flex-end',
      marginRight: 90,
    },
    circle: {
      width: 6,
      height: 6,
      borderRadius: 6 / 2,
      backgroundColor: colors.primary.inverse,
      opacity: 0.4,
      margin: 3,
    },
    solidCircle: {
      opacity: 1,
    },
    progessContainer: {
      flexDirection: 'row',
      alignSelf: 'center',
    },
    stepCounter: {
      ...typography.sBodyMD,
      fontFamily: getFontFamily(TextVariant.BodyMD),
      color: colors.info.inverse,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });

type TopIndicatorPosition = false | 'topCenter' | 'topLeft' | 'topLeftCorner' | 'topRight' | 'topRightCorner';
type BottomIndicatorPosition = false | 'bottomCenter' | 'bottomLeft' | 'bottomLeftCorner' | 'bottomRight';

interface CoachmarkProps {
  coachmarkStyle?: ViewStyle;
  style?: ViewStyle;
  content?: ReactNode;
  title?: string;
  currentStep?: number;
  onNext?: () => void;
  onBack?: () => void;
  action?: boolean;
  topIndicatorPosition?: TopIndicatorPosition;
  bottomIndicatorPosition?: BottomIndicatorPosition;
  onClose?: () => void;
}

interface CoachmarkState {
  ready: boolean;
}

export default class Coachmark extends PureComponent<CoachmarkProps, CoachmarkState> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  state: CoachmarkState = {
    ready: false,
  };

  opacity = new Animated.Value(0);

  componentDidMount = () => {
    Animated.timing(this.opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  };

  componentWillUnmount = () => {
    Animated.timing(this.opacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  };

  onNext = () => {
    const { onNext } = this.props;
    onNext?.();
  };

  onBack = () => {
    const { onBack } = this.props;
    onBack?.();
  };

  getStyles = (): Styles => {
    const colors = this.context.colors || mockTheme.colors;
    return createStyles(colors);
  };

  getIndicatorStyle = (topIndicatorPosition: TopIndicatorPosition): ViewStyle | undefined => {
    const styles = this.getStyles();

    const positions: Record<string, ViewStyle> = {
      topCenter: styles.topCenter,
      topLeft: styles.topLeft,
      topRight: styles.topRight,
      topLeftCorner: styles.topLeftCorner,
      topRightCorner: styles.topRightCorner,
    };
    return topIndicatorPosition ? positions[topIndicatorPosition] : styles.topCenter;
  };

  getBotttomIndicatorStyle = (bottomIndicatorPosition: BottomIndicatorPosition): ViewStyle | undefined => {
    const styles = this.getStyles();

    const positions: Record<string, ViewStyle> = {
      bottomCenter: styles.bottomCenter,
      bottomLeft: styles.bottomLeft,
      bottomLeftCorner: styles.bottomLeftCorner,
      bottomRight: styles.bottomRight,
    };
    return bottomIndicatorPosition ? positions[bottomIndicatorPosition] : styles.bottomCenter;
  };

  renderProgressButtons = (): ReactNode => {
    const { currentStep } = this.props;
    const styles = this.getStyles();
    return (
      <View style={styles.progress}>
        <View style={styles.progessContainer}>
          {currentStep !== 0 && (
            <Text style={styles.stepCounter}>{currentStep}/6</Text>
          )}
        </View>

        <StyledButton
          containerStyle={[styles.progressButton, styles.rightProgessButton]}
          type={'inverse'}
          onPress={this.onNext}
          testID={OnboardingWizardModalSelectorsIDs.GOT_IT_BUTTON}
        >
          {strings('onboarding_wizard_new.coachmark.progress_next')}
        </StyledButton>
      </View>
    );
  };

  renderActionButtons = (): ReactNode => {
    const styles = this.getStyles();

    return (
      <View style={styles.actions}>
        <Button
          size={ButtonSize.Sm}
          width={ButtonWidthTypes.Full}
          onPress={this.onBack}
          label={strings('onboarding_wizard_new.coachmark.action_back')}
          style={styles.actionButtonPrimary}
          variant={ButtonVariants.Primary}
          testID={OnboardingWizardModalSelectorsIDs.NO_THANKS_BUTTON}
        />

        <Button
          size={ButtonSize.Sm}
          width={ButtonWidthTypes.Full}
          onPress={this.onNext}
          label={strings('onboarding_wizard_new.coachmark.action_next')}
          variant={ButtonVariants.Secondary}
          style={styles.actionButtonSecondary}
          testID={OnboardingWizardModalSelectorsIDs.TAKE_TOUR_BUTTON}
        />
      </View>
    );
  };

  render() {
    const {
      content,
      title,
      topIndicatorPosition,
      bottomIndicatorPosition,
      action,
      currentStep,
      onClose,
    } = this.props;
    const style = this.props.style || {};
    const coachmarkStyle = this.props.coachmarkStyle || {};
    const styles = this.getStyles();

    return (
      <Animated.View style={[style, { opacity: this.opacity }]}>
        {topIndicatorPosition && (
          <View style={this.getIndicatorStyle(topIndicatorPosition)}>
            <View style={styles.triangle} />
          </View>
        )}
        <View style={[styles.coachmark, coachmarkStyle]}>
          <View style={styles.titleContainer}>
            {currentStep ? (
              <ButtonIcon
                iconName={IconName.Arrow2Left}
                size={ButtonIconSizes.Sm}
                onPress={this.onBack}
                iconColor={IconColor.Inverse}
                testID={OnboardingWizardModalSelectorsIDs.BACK_BUTTON}
              />
            ) : (
              <View />
            )}
            <Text style={styles.title}>{title}</Text>
            <ButtonIcon
              iconName={IconName.Close}
              size={ButtonIconSizes.Sm}
              onPress={onClose}
              iconColor={IconColor.Inverse}
            />
          </View>
          {content}
          {action ? this.renderActionButtons() : this.renderProgressButtons()}
        </View>
        {bottomIndicatorPosition && (
          <View style={this.getBotttomIndicatorStyle(bottomIndicatorPosition)}>
            <View style={styles.triangleDown} />
          </View>
        )}
      </Animated.View>
    );
  }
}
