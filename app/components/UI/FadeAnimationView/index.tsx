import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { FadeAnimationViewProps } from './index.types';

const TIME = 3900; // 3900/6 = 650 for each

const FadeAnimationView = ({
  children,
  style,
  animationTime = TIME,
  valueToWatch,
  onAnimationStart,
  onAnimationEnd,
  animateOnChange,
}: Readonly<FadeAnimationViewProps>): JSX.Element => {
  const fadeAnim = useRef(new Animated.Value(1)).current; // Initial value for opacity: 1
  const [value, setValue] = useState<string | number | undefined>(valueToWatch);
  const [lastChildren, setLastChildren] = useState<React.ReactNode>(children);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

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
        ...animationParams,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueAlmost,
        ...animationParams,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueZero,
        ...animationParams,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueAlmost,
        ...animationParams,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueZero,
        ...animationParams,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueFinal,
        ...animationParams,
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
    <Animated.View // Special animatable View
      style={{
        ...(style as ViewStyle),
        opacity: fadeAnim, // Bind opacity to animated value
      }}
      pointerEvents={isAnimating ? 'none' : undefined}
    >
      {isAnimating ? lastChildren : children}
    </Animated.View>
  );
};

export default FadeAnimationView;
