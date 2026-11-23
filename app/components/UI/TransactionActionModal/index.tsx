import React from 'react';
import { strings } from '../../../../locales/i18n';
import ActionModal from '../ActionModal';
import TransactionActionContent from './TransactionActionContent';

/**
 * View that renders a modal to be used for speed up or cancel transaction modal
 */
interface TransactionActionModalProps {
  /**
   * Whether modal is shown
   */
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
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onConfirmPress?: (...args: any[]) => void;
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
  feeText?: string | null;
  /**
   * Text to show as tit;e
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

export default function TransactionActionModal({
  isVisible,
  confirmDisabled,
  onCancelPress,
  onConfirmPress,
  confirmText,
  cancelText,
  feeText,
  titleText,
  gasTitleText,
  descriptionText,
  cancelButtonMode,
  confirmButtonMode,
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

TransactionActionModal.defaultProps = {
  cancelButtonMode: 'neutral',
  confirmButtonMode: 'warning',
  cancelText: strings('action_view.cancel'),
  confirmText: strings('action_view.confirm'),
  confirmDisabled: false,
  displayCancelButton: true,
  displayConfirmButton: true,
};
