import React from 'react';
import Text from './Text';
import { StyleSheet, TextStyle, StyleProp } from 'react-native';
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

interface StatusTextComponentProps {
  testID?: string;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export const ConfirmedText: React.FC<StatusTextComponentProps> = ({
  testID,
  style,
  ...props
}) => (
  <Text testID={testID} bold green style={[styles.status, style]} {...props} />
);

export const PendingText: React.FC<StatusTextComponentProps> = ({
  testID,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  return (
    <Text
      testID={testID}
      bold
      style={[styles.status, { color: colors.warning.default }, style]}
      {...props}
    />
  );
};

export const FailedText: React.FC<StatusTextComponentProps> = ({
  testID,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  return (
    <Text
      testID={testID}
      bold
      style={[styles.status, { color: colors.error.default }, style]}
      {...props}
    />
  );
};

type StatusType =
  | 'Confirmed'
  | 'confirmed'
  | 'Pending'
  | 'pending'
  | 'Submitted'
  | 'submitted'
  | 'Failed'
  | 'Cancelled'
  | 'failed'
  | 'cancelled'
  | FIAT_ORDER_STATES;

interface StatusTextProps {
  status: StatusType | string;
  context?: string;
  testID?: string;
  style?: StyleProp<TextStyle>;
}

const StatusText: React.FC<StatusTextProps> = ({
  status,
  context = 'transaction',
  testID,
  style,
  ...props
}) => {
  switch (status) {
    case 'Confirmed':
    case 'confirmed':
      return (
        <ConfirmedText testID={testID} style={style} {...props}>
          {strings(`${context}.${status}`)}
        </ConfirmedText>
      );
    case 'Pending':
    case 'pending':
    case 'Submitted':
    case 'submitted':
      return (
        <PendingText testID={testID} style={style} {...props}>
          {strings(`${context}.${status}`)}
        </PendingText>
      );
    case 'Failed':
    case 'Cancelled':
    case 'failed':
    case 'cancelled':
      return (
        <FailedText testID={testID} style={style} {...props}>
          {strings(`${context}.${status}`)}
        </FailedText>
      );

    case FIAT_ORDER_STATES.COMPLETED:
      return (
        <ConfirmedText style={style} {...props}>
          {strings(`${context}.completed`)}
        </ConfirmedText>
      );
    case FIAT_ORDER_STATES.PENDING:
      return (
        <PendingText style={style} {...props}>
          {strings(`${context}.pending`)}
        </PendingText>
      );
    case FIAT_ORDER_STATES.FAILED:
      return (
        <FailedText style={style} {...props}>
          {strings(`${context}.failed`)}
        </FailedText>
      );
    case FIAT_ORDER_STATES.CANCELLED:
      return (
        <FailedText style={style} {...props}>
          {strings(`${context}.cancelled`)}
        </FailedText>
      );

    default:
      return (
        <Text bold style={[styles.status, style]}>
          {status}
        </Text>
      );
  }
};

export default StatusText;
