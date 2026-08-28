import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  colors as importedColors,
  fontStyles,
} from '../../../../styles/common';
import StyledButton from '../../StyledButton';
import { strings } from '../../../../../locales/i18n';
import { useTheme } from '../../../../util/theme';
import { Colors } from '../../../../util/theme/models';
import ButtonIcon, {
  ButtonIconSizes,
} from '../../../../component-library/components/Buttons/ButtonIcon';
import {
  IconName,
  IconColor,
} from '../../../../component-library/components/Icons/Icon';
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

const createStyles = (colors: Colors) =>
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
      fontFamily: getFontFamily(TextVariant.BodyMD),
      color: colors.info.inverse,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });

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

interface Props {
  /**
   * Custom coachmark style to apply
   */
  coachmarkStyle?: StyleProp<ViewStyle>;
  /**
   * Custom animated view style to apply
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Content object
   */
  content?: React.ReactNode;
  /**
   * Title text
   */
  title?: string;
  /**
   * Current onboarding wizard step
   */
  currentStep?: number;
  /**
   * Callback to be called when next is pressed
   */
  onNext?: (...args: never[]) => void;
  /**
   * Callback to be called when back is pressed
   */
  onBack?: (...args: never[]) => void;
  /**
   * Whether action buttons have to be rendered
   */
  action?: boolean;
  /**
   * Top indicator position
   */
  topIndicatorPosition?: TopIndicatorPosition;
  /**
   * Bottom indicator position
   */
  bottomIndicatorPosition?: BottomIndicatorPosition;
  /**
   * Callback called when closing on boarding wizard
   */
  onClose?: (...args: never[]) => void;
}

const Coachmark = ({
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
}: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  /**
   * Calls props onNext
   */
  const handleNext = useCallback(() => {
    onNext?.();
  }, [onNext]);

  /**
   * Calls props onBack
   */
  const handleBack = useCallback(() => {
    onBack?.();
  }, [onBack]);

  /**
   * Gets top indicator style according to 'topIndicatorPosition'
   *
   * @param position - Indicator position
   * @returns Corresponding style object
   */
  const getIndicatorStyle = (
    position: TopIndicatorPosition,
  ): StyleProp<ViewStyle> => {
    const positions: Record<string, ViewStyle> = {
      topCenter: styles.topCenter,
      topLeft: styles.topLeft,
      topRight: styles.topRight,
      topLeftCorner: styles.topLeftCorner,
      topRightCorner: styles.topRightCorner,
      [String(undefined)]: styles.topCenter,
    };
    return positions[String(position)];
  };

  /**
   * Gets bottom indicator style according to 'bottomIndicatorPosition'
   *
   * @param position - Indicator position
   * @returns Corresponding style object
   */
  const getBotttomIndicatorStyle = (
    position: BottomIndicatorPosition,
  ): StyleProp<ViewStyle> => {
    const positions: Record<string, ViewStyle> = {
      bottomCenter: styles.bottomCenter,
      bottomLeft: styles.bottomLeft,
      bottomLeftCorner: styles.bottomLeftCorner,
      bottomRight: styles.bottomRight,
      [String(undefined)]: styles.bottomCenter,
    };
    return positions[String(position)];
  };

  /**
   * Returns progress bar, back and next buttons. According to currentStep
   *
   * @returns Corresponding view object
   */
  const renderProgressButtons = () => (
    <View style={styles.progress}>
      <View style={styles.progessContainer}>
        {currentStep !== 0 && (
          <Text style={styles.stepCounter}>{currentStep}/6</Text>
        )}
      </View>

      <StyledButton
        containerStyle={[styles.progressButton, styles.rightProgessButton]}
        type={'inverse'}
        onPress={handleNext}
        testID={OnboardingWizardModalSelectorsIDs.GOT_IT_BUTTON}
      >
        {strings('onboarding_wizard_new.coachmark.progress_next')}
      </StyledButton>
    </View>
  );

  /**
   * Returns horizontal action buttons
   *
   * @returns Corresponding view object
   */
  const renderActionButtons = () => (
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
  );

  return (
    <Animated.View style={[style || {}, { opacity }]}>
      {topIndicatorPosition && (
        <View style={getIndicatorStyle(topIndicatorPosition)}>
          <View style={styles.triangle} />
        </View>
      )}
      <View style={[styles.coachmark, coachmarkStyle || {}]}>
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
            onPress={onClose as (() => void) | undefined}
            iconColor={IconColor.Inverse}
          />
        </View>
        {content}
        {action ? renderActionButtons() : renderProgressButtons()}
      </View>
      {bottomIndicatorPosition && (
        <View style={getBotttomIndicatorStyle(bottomIndicatorPosition)}>
          <View style={styles.triangleDown} />
        </View>
      )}
    </Animated.View>
  );
};

export default Coachmark;
