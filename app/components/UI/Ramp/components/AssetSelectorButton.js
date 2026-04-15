import React from 'react';
import { View } from 'react-native';
import Box from './Box';
import DownChevronText from './DownChevronText';
import ListItem from '../../../../component-library/components/List/ListItem';
import ListItemColumn, {
  WidthType } from
'../../../../component-library/components/List/ListItemColumn';
import Text, {
  TextVariant } from
'../../../../component-library/components/Texts/Text';












const AssetSelectorButton = ({
  label,
  assetSymbol,
  assetName,
  icon,
  onPress,
  highlighted,
  ...props
}) =>
<Box
  label={label}
  onPress={onPress}
  highlighted={highlighted}
  compact
  {...props}>
  
    <View>
      <ListItem>
        {Boolean(icon) && <ListItemColumn>{icon}</ListItemColumn>}

        <ListItemColumn widthType={WidthType.Fill}>
          <Text
          variant={TextVariant.BodyLGMedium}
          numberOfLines={1}
          adjustsFontSizeToFit>
          
            {assetName}
          </Text>
        </ListItemColumn>

        <ListItemColumn>
          <DownChevronText text={assetSymbol} />
        </ListItemColumn>
      </ListItem>
    </View>
  </Box>;


export default AssetSelectorButton;