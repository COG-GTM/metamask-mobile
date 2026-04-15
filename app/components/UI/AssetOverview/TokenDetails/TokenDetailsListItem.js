import React from 'react';
import { View } from 'react-native';
import Text, {
  TextColor,
  TextVariant } from
'../../../../component-library/components/Texts/Text';








const TokenDetailsListItem = ({
  label,
  value,
  style,
  children
}) =>
<View style={style}>
    <Text color={TextColor.Alternative} variant={TextVariant.BodyMDMedium}>
      {label}
    </Text>
    {children ||
  <Text variant={TextVariant.BodySM} color={TextColor.Default}>
        {value}
      </Text>
  }
  </View>;


export default TokenDetailsListItem;