// @ts-nocheck
import React from 'react';
import { strings } from '../../../../locales/i18n';
import ActionModal from '../ActionModal';
import TransactionActionContent from './TransactionActionContent';

/**
 * View that renders a modal to be used for speed up or cancel transaction modal
 */

interface TransactionActionModalProps {
  isVisible?: boolean;
  cancelText?: string;
  confirmDisabled?: boolean;
  confirmText?: string;
  onCancelPress?: (...args: any[]) => any;
  onConfirmPress?: (...args: any[]) => any;
  cancelButtonMode?: string;
  confirmButtonMode?: string;
  feeText?: string;
  titleText?: string;
  gasTitleText?: string;
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

