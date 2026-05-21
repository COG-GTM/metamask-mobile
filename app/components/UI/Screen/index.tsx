import React, { PureComponent, ReactNode } from 'react';
import { SafeAreaView, View } from 'react-native';
import { baseStyles } from '../../../styles/common';

interface ScreenProps {
  children?: ReactNode;
}

export default class Screen extends PureComponent<ScreenProps> {
  render(): React.ReactNode {
    return (
      <View style={baseStyles.flexGrow}>
        <SafeAreaView style={baseStyles.flexGrow}>
          {this.props.children}
        </SafeAreaView>
      </View>
    );
  }
}
