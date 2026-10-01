import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import ActionModal from '../ActionModal';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';

interface WarningExistingUserModalProps {
  cancelText?: string;
  cancelButtonDisabled?: boolean;
  confirmText?: string;
  children?: React.ReactNode;
  cancelTestID?: string;
  confirmTestID?: string;
  /**
   * Whether the modal is visible
   */
  warningModalVisible: boolean;
  /**
   * Cancel callback
   */
  onCancelPress: () => void;
  /**
   * Close callback
   */
  onRequestClose: () => void;
  /**
   * Confirm callback
   */
  onConfirmPress: () => void;
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    warningModalView: {
      margin: 24,
    },
    warningModalTitle: {
      ...fontStyles.bold,
      color: colors.error.default,
      textAlign: 'center',
      fontSize: 20,
      marginBottom: 16,
    },
    warningModalText: {
      ...fontStyles.normal,
      color: colors.text.default,
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 18,
    },
    warningModalTextBold: {
      ...fontStyles.bold,
      color: colors.text.default,
    },
  });

const Default = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.warningModalView}>
      <Text style={styles.warningModalTitle}>
        {strings('onboarding.warning_title')}
      </Text>
      <Text style={styles.warningModalText}>
        {strings('onboarding.warning_text_1')}
        <Text style={styles.warningModalTextBold}>{` ${strings(
          'onboarding.warning_text_2',
        )} `}</Text>
        {strings('onboarding.warning_text_3')}
      </Text>
      <Text />
      <Text style={styles.warningModalText}>
        {strings('onboarding.warning_text_4')}
      </Text>
    </View>
  );
};

/**
 * View that renders a warning for existing user in a modal
 */
export default function WarningExistingUserModal({
  warningModalVisible,
  onCancelPress,
  cancelButtonDisabled,
  onRequestClose,
  onConfirmPress,
  children,
  cancelText,
  confirmText,
  confirmTestID,
  cancelTestID,
}: WarningExistingUserModalProps) {
  return (
    <ActionModal
      modalVisible={warningModalVisible}
      cancelTestID={cancelTestID}
      confirmTestID={confirmTestID}
      cancelText={cancelText || strings('onboarding.warning_proceed')}
      confirmText={confirmText || strings('onboarding.warning_cancel')}
      onCancelPress={onCancelPress}
      cancelButtonDisabled={cancelButtonDisabled}
      onRequestClose={onRequestClose}
      onConfirmPress={onConfirmPress}
      cancelButtonMode={'warning'}
      confirmButtonMode={'neutral'}
      verticalButtons
    >
      {(children && children) || <Default />}
    </ActionModal>
  );
}
