import React, { useState } from 'react';
import { View } from 'react-native';
import Html from 'react-native-render-html';

import useStyles from '../useStyles';



function AnnouncementDescriptionField(
props)
{
  const { styles } = useStyles();

  const [width, setWidth] = useState(0);

  return (
    <View
      style={styles.row}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      
      <Html
        source={{ html: props.description }}
        contentWidth={width}
        baseStyle={styles.announcementDescriptionText} />
      
    </View>);

}

export default AnnouncementDescriptionField;