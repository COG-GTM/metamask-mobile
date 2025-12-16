import React from 'react';
import ActionModal from '../../UI/ActionModal';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { strings } from '../../../../locales/i18n';
import CheckBox from '@react-native-community/checkbox';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { fontStyles } from '../../../styles/common';
import { useTheme } from '../../../util/theme';
import generateTestId from '../../../../wdio/utils/generateTestId';
import { SkipAccountSecurityModalSelectorsIDs } from '../../../../e2e/selectors/Onboarding/SkipAccountSecurityModal.selectors';
import { Theme } from '../../../util/theme/models';

interface Styles {
  imageWarning: TextStyle;
  modalNoBorder: ViewStyle;
  skipTitle: TextStyle;
  skipModalContainer: ViewStyle;
  skipModalXButton: ViewStyle;
  skipModalXIcon: TextStyle;
  skipModalActionButtons: ViewStyle;
  skipModalCheckbox: ViewStyle;
  skipModalText: TextStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
  StyleSheet.create({
    imageWarning: {
      alignSelf: 'center',
      color: colors.error.default,
    },
    modalNoBorder: {
      borderTopWidth: 0,
    },
    skipTitle: {
      fontSize: 24,
      marginTop: 12,
      marginBottom: 16,
      color: colors.text.default,
      textAlign: 'center',
      ...fontStyles.bold,
    },
    skipModalContainer: {
      flex: 1,
      margin: 24,
      flexDirection: 'column',
    },
    skipModalXButton: {
      alignItems: 'flex-end',
    },
    skipModalXIcon: {
      fontSize: 16,
      color: colors.text.default,
    },
    skipModalActionButtons: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    skipModalCheckbox: {
      height: 18,
      width: 18,
      marginRight: 12,
      marginTop: 3,
    },
    skipModalText: {
      flex: 1,
      ...fontStyles.normal,
      lineHeight: 20,
      fontSize: 14,
      paddingHorizontal: 10,
      color: colors.text.default,
    },
  });

interface SkipAccountSecurityModalProps {
  modalVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onPress?: () => void;
  toggleSkipCheckbox: () => void;
  skipCheckbox: boolean;
}

const SkipAccountSecurityModal: React.FC<SkipAccountSecurityModalProps> = ({
  modalVisible = false,
  onConfirm,
  onCancel,
  onPress,
  toggleSkipCheckbox,
  skipCheckbox = false,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <ActionModal
      cancelTestID={SkipAccountSecurityModalSelectorsIDs.CANCEL_BUTTON}
      confirmTestID={SkipAccountSecurityModalSelectorsIDs.SKIP_BUTTON}
      confirmText={strings('account_backup_step_1.skip_button_confirm')}
      cancelText={strings('account_backup_step_1.skip_button_cancel')}
      confirmButtonMode={'confirm'}
      cancelButtonMode={'normal'}
      displayCancelButton
      modalVisible={modalVisible}
      actionContainerStyle={styles.modalNoBorder}
      onCancelPress={onCancel}
      confirmDisabled={!skipCheckbox}
      onConfirmPress={onConfirm}
    >
      <View style={styles.skipModalContainer}>
        {onPress && (
          <TouchableOpacity
            onPress={onPress}
            style={styles.skipModalXButton}
            hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
          >
            <Icon name="times" style={styles.skipModalXIcon} />
          </TouchableOpacity>
        )}
        <FeatherIcon
          name="alert-triangle"
          size={38}
          style={styles.imageWarning}
          {...generateTestId(Platform, 'skip-backup-warning')}
        />
        <Text style={styles.skipTitle}>
          {strings('account_backup_step_1.skip_title')}
        </Text>
        <View
          style={styles.skipModalActionButtons}
          testID={SkipAccountSecurityModalSelectorsIDs.CONTAINER}
        >
          <CheckBox
            style={styles.skipModalCheckbox}
            value={skipCheckbox}
            onValueChange={toggleSkipCheckbox}
            boxType={'square'}
            tintColors={{
              true: colors.primary.default,
              false: colors.border.default,
            }}
            testID={
              SkipAccountSecurityModalSelectorsIDs.iOS_SKIP_BACKUP_BUTTON_ID
            }
          />
          <Text
            onPress={toggleSkipCheckbox}
            style={styles.skipModalText}
            testID={
              SkipAccountSecurityModalSelectorsIDs.ANDROID_SKIP_BACKUP_BUTTON_ID
            }
          >
            {strings('account_backup_step_1.skip_check')}
          </Text>
        </View>
      </View>
    </ActionModal>
  );
};

export default SkipAccountSecurityModal;
