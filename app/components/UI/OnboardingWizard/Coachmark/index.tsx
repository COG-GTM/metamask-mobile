import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import {
  colors as importedColors,
  fontStyles,
} from '../../../../styles/common';
import { strings } from '../../../../../locales/i18n';
import { useTheme } from '../../../../util/theme';
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

type TopIndicatorPosition =
  | false
  | 'topCenter'
  | 'topLeft'
  | 'topLeftCorner'
  | 'topRight'
  | 'topRightCorner';

type BottomIndicatorPosition =
  | false
  | 'bottomCenter'
  | 'bottomLeft'
  | 'bottomLeftCorner'
  | 'bottomRight';

interface CoachmarkProps {
  coachmarkStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  content?: React.ReactNode;
  title?: string;
  currentStep?: number;
  onNext?: () => void;
  onBack?: () => void;
  action?: boolean;
  topIndicatorPosition?: TopIndicatorPosition;
  bottomIndicatorPosition?: BottomIndicatorPosition;
  onClose?: () => void;
}

const createStyles = (colors: Theme['colors']) =>
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
    } as TextStyle,
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });

const Coachmark: React.FC<CoachmarkProps> = ({
  coachmarkStyle,
  style,
  content,
  title,
  currentStep,
  onNext,
  onBack,
  action,
  topIndicatorPosition,
  bottomIndicatorPosition,
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      isInteraction: false,
    }).start();

    return () => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        isInteraction: false,
      }).start();
    };
  }, [opacity]);

  const handleNext = useCallback(() => {
    onNext?.();
  }, [onNext]);

  const handleBack = useCallback(() => {
    onBack?.();
  }, [onBack]);

  const getIndicatorStyle = useCallback(
    (position: TopIndicatorPosition) => {
      const positions: Record<string, ViewStyle> = {
        topCenter: styles.topCenter,
        topLeft: styles.topLeft,
        topRight: styles.topRight,
        topLeftCorner: styles.topLeftCorner,
        topRightCorner: styles.topRightCorner,
      };
      return position ? positions[position] : styles.topCenter;
    },
    [styles],
  );

  const getBottomIndicatorStyle = useCallback(
    (position: BottomIndicatorPosition) => {
      const positions: Record<string, ViewStyle> = {
        bottomCenter: styles.bottomCenter,
        bottomLeft: styles.bottomLeft,
        bottomLeftCorner: styles.bottomLeftCorner,
        bottomRight: styles.bottomRight,
      };
      return position ? positions[position] : styles.bottomCenter;
    },
    [styles],
  );

  const renderProgressButtons = useCallback(() => (
    <View style={styles.progress}>
      <View style={styles.progessContainer}>
        {currentStep !== 0 && (
          <Text style={styles.stepCounter}>{currentStep}/6</Text>
        )}
      </View>

      <Button
        variant={ButtonVariants.Primary}
        size={ButtonSize.Sm}
        onPress={handleNext}
        label={strings('onboarding_wizard_new.coachmark.progress_next')}
        style={[styles.progressButton, styles.rightProgessButton]}
        testID={OnboardingWizardModalSelectorsIDs.GOT_IT_BUTTON}
      />
    </View>
  ), [currentStep, handleNext, styles]);

  const renderActionButtons = useCallback(() => (
    <View style={styles.actions}>
      <Button
        size={ButtonSize.Sm}
        width={ButtonWidthTypes.Full}
        onPress={handleBack}
        label={strings('onboarding_wizard_new.coachmark.action_back')}
        style={styles.actionButtonPrimary}
        variant={ButtonVariants.Primary}
        testID={OnboardingWizardModalSelectorsIDs.NO_THANKS_BUTTON}
      />

      <Button
        size={ButtonSize.Sm}
        width={ButtonWidthTypes.Full}
        onPress={handleNext}
        label={strings('onboarding_wizard_new.coachmark.action_next')}
        variant={ButtonVariants.Secondary}
        style={styles.actionButtonSecondary}
        testID={OnboardingWizardModalSelectorsIDs.TAKE_TOUR_BUTTON}
      />
    </View>
  ), [handleBack, handleNext, styles]);

  const viewStyle = style || {};
  const coachmarkViewStyle = coachmarkStyle || {};

  return (
    <Animated.View style={[viewStyle, { opacity }]}>
      {topIndicatorPosition && (
        <View style={getIndicatorStyle(topIndicatorPosition)}>
          <View style={styles.triangle} />
        </View>
      )}
      <View style={[styles.coachmark, coachmarkViewStyle]}>
        <View style={styles.titleContainer}>
          {currentStep ? (
            <ButtonIcon
              iconName={IconName.Arrow2Left}
              size={ButtonIconSizes.Sm}
              onPress={handleBack}
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
        {action ? renderActionButtons() : renderProgressButtons()}
      </View>
      {bottomIndicatorPosition && (
        <View style={getBottomIndicatorStyle(bottomIndicatorPosition)}>
          <View style={styles.triangleDown} />
        </View>
      )}
    </Animated.View>
  );
};

export default Coachmark;
