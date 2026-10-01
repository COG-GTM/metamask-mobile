import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Modal from 'react-native-modal';
import { strings } from '../../../../locales/i18n';
import ActionContent from './ActionContent';
import { useTheme } from '../../../util/theme';

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    width: '100%',
  },
});

interface ActionModalProps {
  cancelButtonDisabled?: boolean;
  /**
   * TestID for the cancel button
   */
  cancelTestID?: string;
  /**
   * TestID for the confirm button
   */
  confirmTestID?: string;
  /**
   * Text to show in the cancel button
   */
  cancelText?: string;
  /**
   * Content to display above the action buttons
   */
  children?: React.ReactNode;
  /**
   * Type of button to show as the cancel button
   */
  cancelButtonMode?: string;
  /**
   * Type of button to show as the confirm button
   */
  confirmButtonMode?: string;
  /**
   * Whether confirm button is disabled
   */
  confirmDisabled?: boolean;
  /**
   * Text to show in the confirm button
   */
  confirmText?: string;
  /**
   * Whether cancel button should be displayed
   */
  displayCancelButton?: boolean;
  /**
   * Whether confirm button should be displayed
   */
  displayConfirmButton?: boolean;
  /**
   * Called when the cancel button is clicked
   */
  onCancelPress?: () => void;
  /**
   * Called when the confirm button is clicked
   */
  onConfirmPress?: () => void;
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
   * View wrapper style
   */
  viewWrapperStyle?: StyleProp<ViewStyle>;
  /**
   * View container style
   */
  viewContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Action container style
   */
  actionContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Whether buttons are rendered vertically
   */
  verticalButtons?: boolean;
  /**
   * Children container style
   */
  childrenContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Allows swipe events to propagate to children components (eg a ScrollView inside a modal)
   */
  propagateSwipe?: boolean;
}

/**
 * View that renders an action modal
 */
export default function ActionModal({
  cancelTestID,
  confirmTestID,
  cancelText,
  children,
  confirmText,
  confirmDisabled,
  cancelButtonMode,
  confirmButtonMode,
  displayCancelButton,
  displayConfirmButton,
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
  cancelButtonDisabled,
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

ActionModal.defaultProps = {
  cancelButtonMode: 'neutral',
  cancelButtonDisabled: false,
  confirmButtonMode: 'warning',
  confirmTestID: '',
  cancelTestID: '',
  cancelText: strings('action_view.cancel'),
  confirmText: strings('action_view.confirm'),
  confirmDisabled: false,
  displayCancelButton: true,
  displayConfirmButton: true,
};
