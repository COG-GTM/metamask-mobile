import React, { ReactNode } from 'react';
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
  children?: ReactNode;
}

export const ConfirmedText: React.FC<StatusTextComponentProps> = ({
  testID,
  ...props
}) => (
  <Text testID={testID} bold green style={styles.status} {...props} />
);

export const PendingText: React.FC<StatusTextComponentProps> = ({
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

export const FailedText: React.FC<StatusTextComponentProps> = ({
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
  | typeof FIAT_ORDER_STATES.COMPLETED
  | typeof FIAT_ORDER_STATES.PENDING
  | typeof FIAT_ORDER_STATES.FAILED
  | typeof FIAT_ORDER_STATES.CANCELLED
  | string;

interface StatusTextProps extends StatusTextComponentProps {
  status: StatusType;
  context?: string;
}

function StatusText({
  status,
  context = 'transaction',
  testID,
  ...props
}: StatusTextProps): React.ReactElement {
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
}

export default StatusText;
