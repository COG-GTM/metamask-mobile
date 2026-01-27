import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { fontStyles, baseStyles } from '../../../../styles/common';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AnimatedSpinner from '../../AnimatedSpinner';
import { strings } from '../../../../../locales/i18n';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import AntIcon from 'react-native-vector-icons/AntDesign';
import Text from '../../../Base/Text';
import { useTheme } from '../../../../util/theme';
import { ToastSelectorsIDs } from '../../../../../e2e/selectors/wallet/ToastModal.selectors';
import { Theme } from '@metamask/design-tokens';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    floatingBackground: {
      backgroundColor: colors.background.default,
      marginHorizontal: 16,
      borderRadius: 8,
    },
    defaultFlashFloating: {
      backgroundColor: colors.overlay.alternative,
      padding: 16,
      flexDirection: 'row',
      flex: 1,
      borderRadius: 8,
    },
    flashLabel: {
      flex: 1,
      flexDirection: 'column',
      color: colors.overlay.inverse,
    },
    flashText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: colors.overlay.inverse,
    },
    flashTitle: {
      flex: 1,
      fontSize: 14,
      marginBottom: 2,
      lineHeight: 18,
      color: colors.overlay.inverse,
      ...fontStyles.bold,
    },
    flashIcon: {
      marginRight: 15,
    },
    closeTouchable: {
      flex: 0.1,
      flexDirection: 'column',
      alignItems: 'flex-end',
    },
    closeIcon: {
      flex: 1,
      color: colors.overlay.inverse,
      alignItems: 'flex-start',
      marginTop: -8,
    },
    checkIcon: {},
  });

type NotificationStatus =
  | 'pending'
  | 'pending_withdrawal'
  | 'pending_deposit'
  | 'speedup'
  | 'success_deposit'
  | 'success_withdrawal'
  | 'success'
  | 'received'
  | 'received_payment'
  | 'eth_received'
  | 'cancelled'
  | 'error'
  | 'import_success'
  | 'simple_notification_rejected'
  | 'simple_notification';

export const getIcon = (
  status: NotificationStatus,
  colors: Theme['colors'],
  styles: ReturnType<typeof createStyles>,
): React.ReactElement | undefined => {
  switch (status) {
    case 'pending':
    case 'pending_withdrawal':
    case 'pending_deposit':
    case 'speedup':
      return <AnimatedSpinner />;
    case 'success_deposit':
    case 'success_withdrawal':
    case 'success':
    case 'received':
    case 'received_payment':
    case 'eth_received':
      return (
        <IonicIcon
          color={colors.success.default}
          size={36}
          name="checkmark"
          style={styles.checkIcon}
        />
      );
    case 'cancelled':
    case 'error':
      return (
        <MaterialIcon
          color={colors.error.default}
          size={36}
          name="alert-circle-outline"
          style={styles.checkIcon}
        />
      );
    case 'import_success':
      return (
        <IonicIcon
          color={colors.background.default}
          size={36}
          name="checkmark"
          style={styles.checkIcon}
        />
      );
    case 'simple_notification_rejected':
      return (
        <AntIcon
          color={colors.error.default}
          size={36}
          name="closecircleo"
          style={styles.checkIcon}
        />
      );
    case 'simple_notification':
      return (
        <AntIcon
          color={colors.success.default}
          size={36}
          name="checkcircleo"
          style={styles.checkIcon}
        />
      );
  }
};

interface NotificationData {
  nonce?: string | number;
  amount?: string | number;
  assetType?: string;
  type?: string;
  title?: string;
  description?: string;
}

const getTitle = (
  status: NotificationStatus,
  { nonce, amount, assetType }: NotificationData,
): string | undefined => {
  switch (status) {
    case 'pending':
      return strings('notifications.pending_title');
    case 'pending_deposit':
      return strings('notifications.pending_deposit_title');
    case 'pending_withdrawal':
      return strings('notifications.pending_withdrawal_title');
    case 'success':
      return strings('notifications.success_title', {
        nonce: parseInt(String(nonce)),
      });
    case 'success_deposit':
      return strings('notifications.success_deposit_title');
    case 'success_withdrawal':
      return strings('notifications.success_withdrawal_title');
    case 'received':
      return strings('notifications.received_title', {
        amount,
        assetType,
      });
    case 'speedup':
      return strings('notifications.speedup_title', {
        nonce: parseInt(String(nonce)),
      });
    case 'received_payment':
      return strings('notifications.received_payment_title');
    case 'cancelled':
      return strings('notifications.cancelled_title');
    case 'error':
      return strings('notifications.error_title');
  }
};

export const getDescription = (
  status: NotificationStatus,
  { amount = null, type = null }: NotificationData,
): string => {
  if (amount && typeof amount !== 'object' && type) {
    return strings(`notifications.${type}_${status}_message`, { amount });
  }
  return strings(`notifications.${status}_message`);
};

interface BaseNotificationProps {
  status: NotificationStatus;
  data?: NotificationData;
  onPress?: () => void;
  onHide?: () => void;
  autoDismiss?: boolean;
}

/**
 * BaseNotification component used to render in-app notifications
 */
const BaseNotification: React.FC<BaseNotificationProps> = ({
  status,
  data = {},
  onPress,
  onHide,
  autoDismiss = false,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { description = null, title = null } = data;

  return (
    <View style={baseStyles.flexGrow}>
      <View style={styles.floatingBackground}>
        <TouchableOpacity
          style={styles.defaultFlashFloating}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <View style={styles.flashIcon}>
            {getIcon(status, colors, styles)}
          </View>
          <View style={styles.flashLabel}>
            <Text
              style={styles.flashTitle}
              testID={ToastSelectorsIDs.NOTIFICATION_TITLE}
            >
              {!title ? getTitle(status, data) : title}
            </Text>
            <Text style={styles.flashText}>
              {!description ? getDescription(status, data) : description}
            </Text>
          </View>
          <View>
            {autoDismiss && (
              <TouchableOpacity style={styles.closeTouchable} onPress={onHide}>
                <IonicIcon name="close" size={36} style={styles.closeIcon} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BaseNotification;
