import React, { useCallback, useState } from 'react';

import ButtonIcon, {
  ButtonIconSizes } from
'../../../../../../component-library/components/Buttons/ButtonIcon';
import ClipboardManager from '../../../../../../core/ClipboardManager';
import {
  IconColor,
  IconName } from
'../../../../../../component-library/components/Icons/Icon';






const CopyButton = ({ copyText, testID }) => {
  const [copied, setCopied] = useState(false);

  const copyMessage = useCallback(async () => {
    await ClipboardManager.setString(copyText);
    setCopied(true);
  }, [copyText, setCopied]);

  return (
    <ButtonIcon
      iconColor={IconColor.Alternative}
      size={ButtonIconSizes.Sm}
      onPress={copyMessage}
      iconName={copied ? IconName.CopySuccess : IconName.Copy}
      testID={testID ?? 'copyButtonTestId'} />);


};

export default CopyButton;