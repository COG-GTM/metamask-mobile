/* eslint-disable @typescript-eslint/no-explicit-any */
interface ActionModalProps {
  actionContainerStyle?: Record<string, any>;
  cancelButtonDisabled?: boolean;
  cancelButtonMode?: string;
  cancelTestID?: string;
  cancelText?: string;
  children?: React.ReactNode;
  childrenContainerStyle?: Record<string, any>;
  confirmButtonMode?: string;
  confirmDisabled?: boolean;
  confirmTestID?: string;
  confirmText?: string;
  displayCancelButton?: boolean;
  displayConfirmButton?: boolean;
  modalStyle?: Record<string, any>;
  modalVisible?: boolean;
  onCancelPress?: (...args: any[]) => any;
  onConfirmPress?: (...args: any[]) => any;
  onRequestClose?: (...args: any[]) => any;
  propagateSwipe?: boolean;
  verticalButtons?: boolean;
  viewContainerStyle?: Record<string, any>;
  viewWrapperStyle?: Record<string, any>;
}
import React from 'react';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { strings } from '../../../../locales/i18n';
import ActionContent from './ActionContent';
import { useTheme } from '../../../util/theme';

const styles: any = StyleSheet.create({
  modal: {
    margin: 0,
    width: '100%',
  },
});

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
