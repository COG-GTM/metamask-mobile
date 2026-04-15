import React, { useState } from 'react';
import { View } from 'react-native';
import ButtonIcon, {
  ButtonIconSizes } from
'../../../../../../component-library/components/Buttons/ButtonIcon';
import {
  IconColor,
  IconName } from
'../../../../../../component-library/components/Icons/Icon';
import Text from '../../../../../../component-library/components/Texts/Text';
import { useStyles } from '../../../../../../component-library/hooks';
import BottomModal from '../bottom-modal';
import styleSheet from './Tooltip.styles';

















export const TooltipModal = ({
  open,
  setOpen,
  content,
  title,
  tooltipTestId = 'tooltip-modal'
}) => {
  const { styles } = useStyles(styleSheet, { title: title ?? '' });

  return (
    <BottomModal visible={open} onClose={() => setOpen(false)}>
      <View style={styles.modalView}>
        <View style={styles.modalHeader}>
          <ButtonIcon
            iconColor={IconColor.Default}
            iconName={IconName.ArrowLeft}
            onPress={() => setOpen(false)}
            size={ButtonIconSizes.Sm}
            style={styles.closeModalBtn}
            testID={`${tooltipTestId}-close-btn`} />
          
          {<Text style={styles.modalTitle}>{title ?? ''}</Text>}
        </View>
        <View style={styles.modalContent}>
          {typeof content === 'string' ?
          <Text style={styles.modalContentValue}>{content}</Text> :

          content
          }
        </View>
      </View>
    </BottomModal>);

};

const Tooltip = ({
  content,
  title,
  tooltipTestId = 'info-row-tooltip',
  onPress,
  iconColor = IconColor.Muted
}) => {
  const [open, setOpen] = useState(false);

  const handlePress = () => {
    setOpen(true);
    onPress?.();
  };

  return (
    <View>
      <ButtonIcon
        iconColor={iconColor}
        iconName={IconName.Info}
        onPress={handlePress}
        size={ButtonIconSizes.Sm}
        testID={`${tooltipTestId}-open-btn`} />
      
      <TooltipModal
        open={open}
        setOpen={setOpen}
        content={content}
        title={title}
        tooltipTestId={tooltipTestId} />
      
    </View>);

};

export default Tooltip;