import React, { useRef } from 'react';
import { View } from 'react-native';

import { strings } from '../../../../locales/i18n';
import BottomSheet from

'../../../component-library/components/BottomSheets/BottomSheet';
import Text, {
  TextVariant } from
'../../../component-library/components/Texts/Text';
import BottomSheetFooter, {
  ButtonsAlignment } from
'../../../component-library/components/BottomSheets/BottomSheetFooter';
import {
  ButtonSize,
  ButtonVariants } from
'../../../component-library/components/Buttons/Button';

import Icon, {
  IconColor,
  IconName,
  IconSize } from
'../../../component-library/components/Icons/Icon';
import createStyles from './styles';
import { DataCollectionBottomSheetSelectorsIDs } from '../../../../e2e/selectors/Settings/SecurityAndPrivacy/DataCollectionBottomSheet.selectors';

const DataCollectionModal = () => {
  const styles = createStyles();
  const bottomSheetRef = useRef(null);

  const acceptButtonProps = {
    variant: ButtonVariants.Primary,
    label: strings('data_collection_modal.accept'),
    size: ButtonSize.Lg,
    onPress: () => {
      bottomSheetRef.current?.onCloseBottomSheet();
    },
    testID: DataCollectionBottomSheetSelectorsIDs.ACCEPT_BUTTON
  };

  return (
    <BottomSheet ref={bottomSheetRef}>
      <View style={styles.wrapper}>
        <Icon
          size={IconSize.Lg}
          name={IconName.Warning}
          color={IconColor.Warning}
          testID={DataCollectionBottomSheetSelectorsIDs.ICON_WARNING} />
        
        <View style={styles.content}>
          <Text variant={TextVariant.BodyMD}>
            {strings('data_collection_modal.content')}
          </Text>
        </View>
        <BottomSheetFooter
          buttonsAlignment={ButtonsAlignment.Horizontal}
          buttonPropsArray={[acceptButtonProps]} />
        
      </View>
    </BottomSheet>);

};

export default DataCollectionModal;