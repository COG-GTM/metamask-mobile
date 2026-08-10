import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Modal from 'react-native-modal';
import { strings } from '../../../../locales/i18n';
import ActionContent, { ActionContentProps } from './ActionContent';
import { useTheme } from '../../../util/theme';

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    width: '100%',
  },
});

export interface ActionModalProps extends ActionContentProps {
  /**
   * Called when hardware back button on Android is clicked
   */
  onRequestClose?: () => void;
  /**
   * Whether modal is shown
   */
  modalVisible?: boolean;
  /**
   * Modal style
   */
  modalStyle?: StyleProp<ViewStyle>;
  /**
   * Allows swipe events to propagate to children components (eg a ScrollView inside a modal)
   */
  propagateSwipe?: boolean;
}

/**
 * View that renders an action modal
 */
export default function ActionModal({
  cancelTestID = '',
  confirmTestID = '',
  cancelText = strings('action_view.cancel'),
  children,
  confirmText = strings('action_view.confirm'),
  confirmDisabled = false,
  cancelButtonMode = 'neutral',
  confirmButtonMode = 'warning',
  displayCancelButton = true,
  displayConfirmButton = true,
  onCancelPress,
  onConfirmPress,
  onRequestClose,
  modalVisible,
  modalStyle,
  viewWrapperStyle,
  viewContainerStyle,
  actionContainerStyle,
  childrenContainerStyle,
  verticalButtons,
  propagateSwipe,
  cancelButtonDisabled = false,
}: ActionModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      isVisible={modalVisible}
      style={[styles.modal, modalStyle]}
      onBackdropPress={onRequestClose}
      onBackButtonPress={onRequestClose}
      onSwipeComplete={onRequestClose}
      swipeDirection={'down'}
      propagateSwipe={propagateSwipe}
      backdropColor={colors.overlay.default}
      backdropOpacity={1}
      avoidKeyboard
    >
      <ActionContent
        cancelTestID={cancelTestID}
        confirmTestID={confirmTestID}
        cancelText={cancelText}
        confirmText={confirmText}
        confirmDisabled={confirmDisabled}
        cancelButtonMode={cancelButtonMode}
        cancelButtonDisabled={cancelButtonDisabled}
        confirmButtonMode={confirmButtonMode}
        displayCancelButton={displayCancelButton}
        displayConfirmButton={displayConfirmButton}
        onCancelPress={onCancelPress}
        onConfirmPress={onConfirmPress}
        viewWrapperStyle={viewWrapperStyle}
        viewContainerStyle={viewContainerStyle}
        actionContainerStyle={actionContainerStyle}
        childrenContainerStyle={childrenContainerStyle}
        verticalButtons={verticalButtons}
      >
        {children}
      </ActionContent>
    </Modal>
  );
}
