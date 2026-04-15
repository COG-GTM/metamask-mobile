import React from 'react';
import { View } from 'react-native';
import {
  ButtonSize,
  ButtonVariants } from
'../../../component-library/components/Buttons/Button';
import Button from '../../../component-library/components/Buttons/Button/Button';
import { strings } from '../../../../locales/i18n';
import createStyles from './SheetActionView.styles';


const SheetActionView = ({ onConfirm, onCancel }) => {
  const styles = createStyles();
  return (
    <View style={styles.actionsContainer}>
      <Button
        label={strings('action_view.cancel')}
        onPress={onCancel}
        variant={ButtonVariants.Secondary}
        size={ButtonSize.Lg}
        style={styles.cancelButton} />
      
      <Button
        label={strings('action_view.confirm')}
        onPress={onConfirm}
        variant={ButtonVariants.Primary}
        size={ButtonSize.Lg}
        style={styles.confirmButton} />
      
    </View>);

};
export default SheetActionView;