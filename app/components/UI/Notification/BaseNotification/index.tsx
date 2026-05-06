import React from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { fontStyles, baseStyles } from '../../../../styles/common';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AnimatedSpinner from '../../AnimatedSpinner';
import { strings } from '../../../../../locales/i18n';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import AntIcon from 'react-native-vector-icons/AntDesign';
import Text from '../../../Base/Text';
import { useTheme } from '../../../../util/theme';
import { Colors } from '../../../../util/theme/models';
import { ToastSelectorsIDs } from '../../../../../e2e/selectors/wallet/ToastModal.selectors';

const createStyles = (colors: Colors) =>
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
  });

type NotificationStyles = ReturnType<typeof createStyles> & {
  checkIcon?: never;
};

export const getIcon = (
  status: string | undefined,
  colors: Colors,
  styles: NotificationStyles,
): React.ReactNode => {
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
    default:
      return null;
  }
};

interface BaseNotificationData {
  nonce?: string | number;
  amount?: string | number | object | null;
  assetType?: string;
  type?: string | null;
  title?: string | null;
  description?: string | null;
  [key: string]: unknown;
}

const getTitle = (
  status: string | undefined,
  { nonce, amount, assetType }: BaseNotificationData,
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
    default:
      return undefined;
  }
};

export const getDescription = (
  status: string | undefined,
  { amount = null, type = null }: BaseNotificationData,
): string => {
  if (amount && typeof amount !== 'object' && type) {
    return strings(`notifications.${type}_${status}_message`, { amount });
  }
  return strings(`notifications.${status}_message`);
};

interface BaseNotificationProps {
  status?: string;
  data?: BaseNotificationData | null;
  onPress?: (event: GestureResponderEvent) => void;
  onHide?: (event: GestureResponderEvent) => void;
  autoDismiss?: boolean;
}

/**
 * BaseNotification component used to render in-app notifications
 */
const BaseNotification = ({
  status,
  data,
  onPress,
  onHide,
  autoDismiss = false,
}: BaseNotificationProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const safeData: BaseNotificationData = data ?? {};
  const { description, title } = safeData;

  return (
    <View style={baseStyles.flexGrow}>
      <View style={styles.floatingBackground}>
        <TouchableOpacity
          style={styles.defaultFlashFloating}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <View style={styles.flashIcon}>
            {getIcon(status, colors, styles as NotificationStyles)}
          </View>
          <View style={styles.flashLabel}>
            <Text
              style={styles.flashTitle}
              testID={ToastSelectorsIDs.NOTIFICATION_TITLE}
            >
              {!title ? getTitle(status, safeData) : title}
            </Text>
            <Text style={styles.flashText}>
              {!description ? getDescription(status, safeData) : description}
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
