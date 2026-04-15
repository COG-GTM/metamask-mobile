import React, { useCallback, useState } from 'react';
import {
  LayoutAnimation,
  Platform,

  TouchableOpacity,
  UIManager,
  View } from

'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming } from
'react-native-reanimated';
import Icon, {
  IconName,
  IconSize } from
'../../../../../../component-library/components/Icons/Icon';
import Text, {
  TextVariant } from
'../../../../../../component-library/components/Texts/Text';
import { useStyles } from '../../../../../../component-library/hooks';
import styleSheet from './info-section-accordion.styles';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}




































const ANIMATION_DURATION_MS = 300;

const InfoRowAccordion = ({
  header,
  children,
  initiallyExpanded = false,
  style,
  headerStyle,
  contentStyle,
  onStateChange,
  testID
}) => {
  const { styles } = useStyles(styleSheet, {});
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const rotationValue = useSharedValue(initiallyExpanded ? 1 : 0);

  const toggleAccordion = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        ANIMATION_DURATION_MS,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );

    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    rotationValue.value = withTiming(newExpandedState ? 1 : 0, {
      duration: ANIMATION_DURATION_MS
    });
    onStateChange?.(newExpandedState);
  }, [isExpanded, onStateChange, rotationValue]);

  const arrowStyle = useAnimatedStyle(() => {
    const rotation = interpolate(rotationValue.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotate: `${rotation}deg` }]
    };
  });

  return (
    <View style={[styles.container, style]} testID={testID}>
      <TouchableOpacity
        style={[styles.header, headerStyle]}
        onPress={toggleAccordion}
        activeOpacity={0.7}
        testID={`${testID}-header`}>
        
        {typeof header === 'string' ?
        <Animated.Text>
            <Text variant={TextVariant.BodyMDMedium}>{header}</Text>
          </Animated.Text> :

        header
        }
        <Animated.View style={[styles.iconContainer, arrowStyle]}>
          <Icon
            name={IconName.ArrowDown}
            size={IconSize.Sm}
            color={styles.icon.color}
            testID={`${testID}-arrow`} />
          
        </Animated.View>
      </TouchableOpacity>
      {isExpanded &&
      <View style={[styles.content, contentStyle]}>{children}</View>
      }
    </View>);

};

export default InfoRowAccordion;