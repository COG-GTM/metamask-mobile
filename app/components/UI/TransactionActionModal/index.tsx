import React from 'react';
import { strings } from '../../../../locales/i18n';
import ActionModal from '../ActionModal';
import TransactionActionContent from './TransactionActionContent';

interface TransactionActionModalProps {
  isVisible?: boolean;
  confirmDisabled?: boolean;
  onCancelPress?: () => void;
  onConfirmPress?: () => void;
  confirmText?: string;
  cancelText?: string;
  feeText?: string;
  titleText?: string;
  gasTitleText?: string;
  descriptionText?: string;
  cancelButtonMode?: string;
  confirmButtonMode?: string;
}

/**
 * View that renders a modal to be used for speed up or cancel transaction modal
 */
const TransactionActionModal: React.FC<TransactionActionModalProps> = ({
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
}) => (
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

export default TransactionActionModal;
