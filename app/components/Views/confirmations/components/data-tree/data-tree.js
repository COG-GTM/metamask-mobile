import React from 'react';
import { StyleSheet, View } from 'react-native';


import DataField from './data-field';



const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column'
  }
});

const DataTree = ({
  data,
  chainId,
  depth = 0,
  primaryType,
  tokenDecimals






}) =>
<View style={styles.container}>
    {Object.keys(data).map((dataKey, index) => {
    const datum = data[dataKey];
    return (
      <DataField
        chainId={chainId}
        depth={depth}
        label={dataKey}
        key={`${dataKey}-${index}`}
        primaryType={primaryType}
        tokenDecimals={tokenDecimals}
        {...datum} />);


  })}
  </View>;


export default DataTree;