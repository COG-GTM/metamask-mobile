import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { baseStyles } from '../../../styles/common';

interface ScreenProps {
  children?: React.ReactNode;
}

/**
 * Base view component providing consistent styling meant to wrap other views
 */
const Screen: React.FC<ScreenProps> = ({ children }) => (
  <View style={baseStyles.flexGrow}>
    <SafeAreaView style={baseStyles.flexGrow}>{children}</SafeAreaView>
  </View>
);

export default Screen;
