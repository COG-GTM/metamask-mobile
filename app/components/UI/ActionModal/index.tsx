import React, { ReactNode } from 'react';
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
  cancelTestID?: string;
  confirmTestID?: string;
  cancelText?: string;
  children?: ReactNode;
  cancelButtonMode?: string;
  confirmButtonMode?: string;
  confirmDisabled?: boolean;
  confirmText?: string;
  displayCancelButton?: boolean;
  displayConfirmButton?: boolean;
  onCancelPress?: () => void;
  onConfirmPress?: () => void;
  onRequestClose?: () => void;
  modalVisible?: boolean;
  modalStyle?: StyleProp<ViewStyle>;
  viewWrapperStyle?: StyleProp<ViewStyle>;
  viewContainerStyle?: StyleProp<ViewStyle>;
  actionContainerStyle?: StyleProp<ViewStyle>;
  childrenContainerStyle?: StyleProp<ViewStyle>;
  verticalButtons?: boolean;
  propagateSwipe?: boolean;
}

/**
 * View that renders an action modal
 */
function ActionModal({
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

export default ActionModal;
