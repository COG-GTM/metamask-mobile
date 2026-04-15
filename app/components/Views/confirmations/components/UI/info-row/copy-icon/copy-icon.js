import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from '../../../../../../../component-library/components/Icons/Icon';
import { IconName, IconSize } from '../../../../../../../component-library/components/Icons/Icon/Icon.types';
import ClipboardManager from '../../../../../../../core/ClipboardManager';






const CopyIcon = ({ textToCopy, color }) => {
  const copyToClipboard = async () => {
    if (textToCopy) {
      await ClipboardManager.setString(textToCopy);
    }
  };

  return (
    <TouchableOpacity onPress={copyToClipboard}>
      <Icon
        name={IconName.Copy}
        size={IconSize.Sm}
        color={color} />
      
    </TouchableOpacity>);

};

export default CopyIcon;