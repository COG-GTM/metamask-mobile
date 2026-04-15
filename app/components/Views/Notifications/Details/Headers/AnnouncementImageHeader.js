import React from 'react';
import { View } from 'react-native';

import RemoteImage from '../../../../Base/RemoteImage';
import useStyles from '../useStyles';



export default function AnnouncementImageHeader(
props)
{
  const { styles } = useStyles();
  return (
    <View style={styles.headerImageContainer}>
      <RemoteImage
        source={{ uri: props.imageUrl }}
        style={styles.headerImageFull}
        placeholderStyle={styles.headerImageFullPlaceholder} />
      
    </View>);

}