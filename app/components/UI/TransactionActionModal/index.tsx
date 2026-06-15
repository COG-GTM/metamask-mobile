import React from 'react';
import { strings } from '../../../../locales/i18n';
import ActionModal from '../ActionModal';
import TransactionActionContent from './TransactionActionContent';

interface TransactionActionModalProps {
  isVisible?: boolean;
  /**
   * Text to show in the cancel button
   */
  cancelText?: string;
  /**
   * Whether confirm button is disabled
   */
  confirmDisabled?: boolean;
  /**
   * Text to show in the confirm button
   */
  confirmText?: string;
  /**
   * Called when the cancel button is clicked
   */
  onCancelPress?: () => void;
  /**
   * Called when the confirm button is clicked
   */
  onConfirmPress?: () => void;
  /**
   * Cancel button enabled or disabled
   */
  cancelButtonMode?: string;
  /**
   * Confirm button enabled or disabled
   */
  confirmButtonMode?: string;
  /**
   * Text to show as fee
   */
  feeText?: string;
  /**
   * Text to show as title
   */
  titleText?: string;
  /**
   * Text to show as title of gas section
   */
  gasTitleText?: string;
  /**
   * Text to show as description
   */
  descriptionText?: string;
}

/**
 * View that renders a modal to be used for speed up or cancel transaction modal
 */
export default function TransactionActionModal({
  isVisible,
  confirmDisabled = false,
  onCancelPress,
  onConfirmPress,
  confirmText = strings('action_view.confirm'),
  cancelText = strings('action_view.cancel'),
  feeText,
  titleText,
  gasTitleText,
  descriptionText,
  cancelButtonMode = 'neutral',
  confirmButtonMode = 'warning',
}: TransactionActionModalProps) {
  return (
    <ActionModal
      modalVisible={isVisible}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirmPress={onConfirmPress}
      onCancelPress={onCancelPress}
      onRequestClose={onCancelPress}
      cancelButtonMode={cancelButtonMode}
      confirmButtonMode={confirmButtonMode}
      confirmDisabled={confirmDisabled}
    >
      <TransactionActionContent
        confirmDisabled={confirmDisabled}
        feeText={feeText}
        titleText={titleText}
        gasTitleText={gasTitleText}
        descriptionText={descriptionText}
      />
    </ActionModal>
  );
}


