// @ts-nocheck
import React, { PureComponent } from 'react';
import { SafeAreaView, View } from 'react-native';
import { baseStyles } from '../../../styles/common';

/**
 * Base view component providing consistent styling meant to wrap other views
 */
interface ScreenProps {
  children?: React.ReactNode;
}

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
