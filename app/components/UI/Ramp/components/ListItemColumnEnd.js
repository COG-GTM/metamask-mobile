import React from 'react';
import { StyleSheet } from 'react-native';
import ListItemColumn from '../../../../component-library/components/List/ListItemColumn';


const styles = StyleSheet.create({
  alignEnd: {
    alignItems: 'flex-end'
  }
});

const ListItemColumnEnd = ({
  style,
  ...props
}) =>
<ListItemColumn
  style={{
    ...(typeof style === 'object' ? style : {}),
    ...styles.alignEnd
  }}
  {...props} />;



export default ListItemColumnEnd;