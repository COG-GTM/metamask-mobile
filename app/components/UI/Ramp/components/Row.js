import React from 'react';
import { StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  row: {
    marginVertical: 8
  },
  first: {
    marginTop: 0
  },
  last: {
    marginBottom: 0
  }
});







function Row({ style, first, last, ...props }) {
  return (
    <View
      style={[styles.row, first && styles.first, last && styles.last, style]}
      {...props} />);


}

export default Row;