import React, { PureComponent, ReactNode } from 'react';
import { SafeAreaView, View } from 'react-native';
import { baseStyles } from '../../../styles/common';

interface ScreenProps {
  /**
   * Content to wrap inside this view
   */
  children?: ReactNode;
}

/**
 * Base view component providing consistent styling meant to wrap other views
 */
export default class Screen extends PureComponent<ScreenProps> {
  render() {
    return (
      <View style={baseStyles.flexGrow}>
        <SafeAreaView style={baseStyles.flexGrow}>
          {this.props.children}
        </SafeAreaView>
      </View>
    );
  }
}
