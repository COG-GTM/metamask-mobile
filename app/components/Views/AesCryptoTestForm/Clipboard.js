import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';

import ClipboardManager from '../../../core/ClipboardManager';
import Text, {
  TextVariant } from
'../../../component-library/components/Texts/Text';

const ClipboardText = ({
  text,
  testID,
  styles






}) => {
  const copy = useCallback(async () => {
    await ClipboardManager.setString(text);
  }, [text]);

  return (
    <TouchableOpacity
      onPress={copy}
      style={styles.clipboardText}
      testID={testID}>
      
      <Text variant={TextVariant.BodyMD}>{text}</Text>
    </TouchableOpacity>);

};

export default ClipboardText;