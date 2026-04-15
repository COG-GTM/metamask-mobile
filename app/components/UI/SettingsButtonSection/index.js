import React, { useState } from 'react';
import { View } from 'react-native';
import ActionModal from '../ActionModal';
import createStyles from './styles';
import Text, {
  TextVariant,
  TextColor } from
'../../../component-library/components/Texts/Text';
import Button, {
  ButtonVariants,
  ButtonSize,
  ButtonWidthTypes } from
'../../../component-library/components/Buttons/Button';
















const SettingsButtonSection = ({
  sectionTitle,
  sectionButtonText,
  descriptionText,
  needsModal,
  buttonDisabled,
  modalTitleText,
  modalDescriptionText,
  modalConfirmButtonText,
  modalCancelButtonText,
  onPress,
  modalOnConfirm,
  testID
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const styles = createStyles();

  const updateShowModalState = () => setModalVisible(!modalVisible);
  const onButtonPress = () => onPress ? onPress() : updateShowModalState();
  const onModalConfirmPress = () => {
    modalOnConfirm?.();
    setModalVisible(!modalVisible);
  };

  return (
    <>
      <View style={styles.setting}>
        <Text variant={TextVariant.BodyLGMedium}>{sectionTitle}</Text>
        <Text
          variant={TextVariant.BodyMD}
          color={TextColor.Alternative}
          style={styles.desc}>
          
          {descriptionText}
        </Text>
        <View style={styles.accessory}>
          <Button
            variant={ButtonVariants.Secondary}
            size={ButtonSize.Lg}
            width={ButtonWidthTypes.Full}
            onPress={onButtonPress}
            isDisabled={buttonDisabled}
            testID={testID}
            label={sectionButtonText} />
          
        </View>
      </View>
      {needsModal ?
      <ActionModal
        modalVisible={modalVisible}
        confirmText={modalConfirmButtonText}
        cancelText={modalCancelButtonText}
        onCancelPress={updateShowModalState}
        onRequestClose={updateShowModalState}
        onConfirmPress={onModalConfirmPress}>
        
          <View style={styles.modalView}>
            <Text variant={TextVariant.HeadingMD} style={styles.modalTitle}>
              {modalTitleText}
            </Text>
            <Text style={styles.modalText}>{modalDescriptionText}</Text>
          </View>
        </ActionModal> :
      null}
    </>);

};

export default React.memo(SettingsButtonSection);