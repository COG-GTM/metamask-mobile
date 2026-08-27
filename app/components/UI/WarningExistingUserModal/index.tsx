import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, Text } from 'react-native';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import ActionModal from '../ActionModal';
import { useTheme } from '../../../util/theme';

// @ts-expect-error -- legacy JavaScript UI type boundary
const createStyles = (colors) =>
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
interface WarningExistingUserModalProps {
  cancelText?: string;
  cancelButtonDisabled?: boolean;
  confirmText?: string;
  children?: any;
  cancelTestID?: string;
  confirmTestID?: string;
  warningModalVisible: boolean;
  onCancelPress: (...args: any[]) => any;
  onRequestClose: (...args: any[]) => any;
  onConfirmPress: (...args: any[]) => any;
}

export default function WarningExistingUserModal({
// @ts-expect-error -- legacy JavaScript UI type boundary
  warningModalVisible,
// @ts-expect-error -- legacy JavaScript UI type boundary
  onCancelPress,
// @ts-expect-error -- legacy JavaScript UI type boundary
  cancelButtonDisabled,
// @ts-expect-error -- legacy JavaScript UI type boundary
  onRequestClose,
// @ts-expect-error -- legacy JavaScript UI type boundary
  onConfirmPress,
// @ts-expect-error -- legacy JavaScript UI type boundary
  children,
// @ts-expect-error -- legacy JavaScript UI type boundary
  cancelText,
// @ts-expect-error -- legacy JavaScript UI type boundary
  confirmText,
// @ts-expect-error -- legacy JavaScript UI type boundary
  confirmTestID,
// @ts-expect-error -- legacy JavaScript UI type boundary
  cancelTestID,
}) {
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

WarningExistingUserModal.propTypes = {
  cancelText: PropTypes.string,
  cancelButtonDisabled: PropTypes.bool,
  confirmText: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  cancelTestID: PropTypes.string,
  confirmTestID: PropTypes.string,

  /**
   * Whether the modal is visible
   */
  warningModalVisible: PropTypes.bool.isRequired,
  /**
   * Cancel callback
   */
  onCancelPress: PropTypes.func.isRequired,
  /**
   * Close callback
   */
  onRequestClose: PropTypes.func.isRequired,
  /**
   * Confirm callback
   */
  onConfirmPress: PropTypes.func.isRequired,
};
