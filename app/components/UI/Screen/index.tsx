import React, { ReactNode } from 'react';
import { SafeAreaView, View } from 'react-native';
import { baseStyles } from '../../../styles/common';

interface Props {
  /**
   * Content to wrap inside this view
   */
  children?: ReactNode;
}

/**
 * Base view component providing consistent styling meant to wrap other views
 */
const Screen = ({ children }: Props) => (
  <View style={baseStyles.flexGrow}>
    <SafeAreaView style={baseStyles.flexGrow}>{children}</SafeAreaView>
  </View>
);

export default Screen;
