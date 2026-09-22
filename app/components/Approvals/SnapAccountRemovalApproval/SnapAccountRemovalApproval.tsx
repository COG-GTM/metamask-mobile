///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import React from 'react';
import { View } from 'react-native';
import ApprovalModal from '../ApprovalModal';
import useApprovalRequest from '../../Views/confirmations/hooks/useApprovalRequest';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../core/RPCMethods/RPCMethodMiddleware';
import {
  SNAP_ACCOUNT_REMOVAL_APPROVAL,
  SNAP_ACCOUNT_REMOVAL_CANCEL_BUTTON,
  SNAP_ACCOUNT_REMOVAL_REMOVE_BUTTON,
} from './SnapAccountRemovalApproval.constants';
import styleSheet from './SnapAccountRemovalApproval.styles';
import { useStyles } from '../../hooks/useStyles';
import BottomSheetFooter, {
  ButtonsAlignment,
} from '../../../component-library/components/BottomSheets/BottomSheetFooter';
import SheetHeader from '../../../component-library/components/Sheet/SheetHeader';
import { strings } from '../../../../locales/i18n';
import Text, {
  TextVariant,
} from '../../../component-library/components/Texts/Text';
import {
  ButtonProps,
  ButtonSize,
  ButtonVariants,
} from '../../../component-library/components/Buttons/Button/Button.types';

const SnapAccountRemovalApproval = () => {
  const { approvalRequest, onConfirm, onReject } = useApprovalRequest();
  const { styles } = useStyles(styleSheet, {});

  const address = approvalRequest?.requestData?.publicAddress;

  const cancelButtonProps: ButtonProps = {
    variant: ButtonVariants.Secondary,
    label: strings('accountApproval.cancel'),
    size: ButtonSize.Lg,
    onPress: onReject,
    testID: SNAP_ACCOUNT_REMOVAL_CANCEL_BUTTON,
  };

  const removeAccountButtonProps: ButtonProps = {
    variant: ButtonVariants.Primary,
    label: strings('snap_account_removal_approval.remove_account_button'),
    size: ButtonSize.Lg,
    onPress: () => onConfirm(undefined, { confirmed: true }),
    testID: SNAP_ACCOUNT_REMOVAL_REMOVE_BUTTON,
  };

  return (
    <ApprovalModal
      isVisible={
        approvalRequest?.type ===
        SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval
      }
      onCancel={onReject}
    >
      <View testID={SNAP_ACCOUNT_REMOVAL_APPROVAL} style={styles.root}>
        <SheetHeader title={strings('snap_account_removal_approval.title')} />
        <Text style={styles.description} variant={TextVariant.BodyMD}>
          {strings('snap_account_removal_approval.description')}
        </Text>
        {address && (
          <Text style={styles.address} variant={TextVariant.BodyMDBold}>
            {address}
          </Text>
        )}
        <View style={styles.actionContainer}>
          <BottomSheetFooter
            buttonsAlignment={ButtonsAlignment.Horizontal}
            buttonPropsArray={[cancelButtonProps, removeAccountButtonProps]}
          />
        </View>
      </View>
    </ApprovalModal>
  );
};

export default SnapAccountRemovalApproval;
///: END:ONLY_INCLUDE_IF
