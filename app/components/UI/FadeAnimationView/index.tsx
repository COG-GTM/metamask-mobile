import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

const TIME = 3900; // 3900/6 = 650 for each

interface FadeAnimationViewProps {
  /**
   * Component to render
   */
  children?: React.ReactNode;
  /**
   * Style of the container view
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Time for the animation
   */
  animationTime?: number;
  /**
   * Value to watch for changes to start animation
   */
  valueToWatch?: string | number;
  /**
   * Function to call when update animation starts
   */
  onAnimationStart?: () => void;
  /**
   * Function to call when update animation ends
   */
  onAnimationEnd?: () => void;
  /**
   * If the values should animate upon update or not
   */
  animateOnChange?: boolean;
}

const FadeAnimationView: React.FC<FadeAnimationViewProps> = ({
  children,
  style,
  animationTime = TIME,
  valueToWatch,
  onAnimationStart,
  onAnimationEnd,
  animateOnChange,
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current; // Initial value for opacity: 1
  const [value, setValue] = useState(valueToWatch);
  const [lastChildren, setLastChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);

  const animationEnded = useCallback(() => {
    onAnimationEnd?.();
    setValue(valueToWatch);
    setLastChildren(children);
    setIsAnimating(false);
  }, [children, onAnimationEnd, valueToWatch]);

  const animationStarted = useCallback(() => {
    onAnimationStart?.();
  }, [onAnimationStart]);

  const animate = useCallback(() => {
    animationStarted();

    const animationParams = {
      time: animationTime / 6,
      useNativeDriver: true,
    };
    const animationValueZero = 0;
    const animationValueAlmost = 0.8;
    const animationValueFinal = 1;

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: animationValueZero,
        duration: animationParams.time,
        useNativeDriver: animationParams.useNativeDriver,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueAlmost,
        duration: animationParams.time,
        useNativeDriver: animationParams.useNativeDriver,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueZero,
        duration: animationParams.time,
        useNativeDriver: animationParams.useNativeDriver,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueAlmost,
        duration: animationParams.time,
        useNativeDriver: animationParams.useNativeDriver,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueZero,
        duration: animationParams.time,
        useNativeDriver: animationParams.useNativeDriver,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueFinal,
        duration: animationParams.time,
        useNativeDriver: animationParams.useNativeDriver,
      }),
    ]).start(() => {
      animationEnded();
    });
  }, [animationEnded, animationStarted, animationTime, fadeAnim]);

  useEffect(() => {
    if (!value) {
      setValue(valueToWatch);
      return;
    }
    if (!isAnimating) {
      if (animateOnChange && valueToWatch && value && value !== valueToWatch) {
        animate();
        setIsAnimating(true);
        setValue(valueToWatch);
        return;
      }
      setLastChildren(children);
    }
  }, [animate, animateOnChange, children, isAnimating, value, valueToWatch]);

  return (
    <Animated.View
      style={[
        style,
        { opacity: fadeAnim }, // Bind opacity to animated value
      ]}
      pointerEvents={isAnimating ? 'none' : undefined}
    >
      {isAnimating ? lastChildren : children}
    </Animated.View>
  );
};

export default FadeAnimationView;
