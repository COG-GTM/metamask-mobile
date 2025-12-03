import React, { ReactNode } from 'react';
import Text from './Text';
import { StyleSheet, StyleProp, TextStyle } from 'react-native';
import { FIAT_ORDER_STATES } from '../../constants/on-ramp';
import { strings } from '../../../locales/i18n';
import { useTheme } from '../../util/theme';

const styles = StyleSheet.create({
  status: {
    marginTop: 4,
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

/**
 * Base props interface for status text components
 */
interface BaseStatusTextProps {
  testID?: string;
  children?: ReactNode;
  style?: StyleProp<TextStyle>;
}

/**
 * Props interface for the main StatusText component
 */
interface StatusTextProps extends BaseStatusTextProps {
  status: string;
  context?: string;
}

export const ConfirmedText: React.FC<BaseStatusTextProps> = ({
  testID,
  ...props
}) => (
  <Text testID={testID} bold green style={styles.status} {...props} />
);

export const PendingText: React.FC<BaseStatusTextProps> = ({
  testID,
  ...props
}) => {
  const { colors } = useTheme();
  return (
    <Text
      testID={testID}
      bold
      style={[styles.status, { color: colors.warning.default }]}
      {...props}
    />
  );
};

export const FailedText: React.FC<BaseStatusTextProps> = ({
  testID,
  ...props
}) => {
  const { colors } = useTheme();
  return (
    <Text
      testID={testID}
      bold
      style={[styles.status, { color: colors.error.default }]}
      {...props}
    />
  );
};

const StatusText: React.FC<StatusTextProps> = ({
  status,
  context = 'transaction',
  testID,
  ...props
}) => {
  switch (status) {
    case 'Confirmed':
    case 'confirmed':
      return (
        <ConfirmedText testID={testID} {...props}>
          {strings(`${context}.${status}`)}
        </ConfirmedText>
      );
    case 'Pending':
    case 'pending':
    case 'Submitted':
    case 'submitted':
      return (
        <PendingText testID={testID} {...props}>
          {strings(`${context}.${status}`)}
        </PendingText>
      );
    case 'Failed':
    case 'Cancelled':
    case 'failed':
    case 'cancelled':
      return (
        <FailedText testID={testID} {...props}>
          {strings(`${context}.${status}`)}
        </FailedText>
      );

    case FIAT_ORDER_STATES.COMPLETED:
      return (
        <ConfirmedText {...props}>
          {strings(`${context}.completed`)}
        </ConfirmedText>
      );
    case FIAT_ORDER_STATES.PENDING:
      return (
        <PendingText {...props}>{strings(`${context}.pending`)}</PendingText>
      );
    case FIAT_ORDER_STATES.FAILED:
      return (
        <FailedText {...props}>{strings(`${context}.failed`)}</FailedText>
      );
    case FIAT_ORDER_STATES.CANCELLED:
      return (
        <FailedText {...props}>{strings(`${context}.cancelled`)}</FailedText>
      );

    default:
      return (
        <Text bold style={styles.status}>
          {status}
        </Text>
      );
  }
};

export default StatusText;
