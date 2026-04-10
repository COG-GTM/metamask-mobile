import React from 'react';
import Text from './Text';
import { StyleSheet } from 'react-native';
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

interface StatusTextBaseProps {
  testID?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

interface StatusTextProps {
  status: string;
  context?: string;
  testID?: string;
  [key: string]: any;
}

export const ConfirmedText: React.FC<StatusTextBaseProps> = ({testID, ...props}) => (
  <Text
    testID={testID}
    bold
    green
    style={styles.status}
    {...props}
  />
);
export const PendingText: React.FC<StatusTextBaseProps> = ({testID, ...props}) => {
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
export const FailedText: React.FC<StatusTextBaseProps> = ({testID, ...props} ) => {
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
function StatusText({ status, context = 'transaction', testID, ...props }: StatusTextProps) {
  switch (status) {
    case 'Confirmed':
    case 'confirmed':
      return (
        <ConfirmedText testID={testID}  {...props}>
          {strings(`${context}.${status}`)}
        </ConfirmedText>
      );
    case 'Pending':
    case 'pending':
    case 'Submitted':
    case 'submitted':
      return (
        <PendingText testID={testID} {...props}>{strings(`${context}.${status}`)}</PendingText>
      );
    case 'Failed':
    case 'Cancelled':
    case 'failed':
    case 'cancelled':
      return (
        <FailedText testID={testID} {...props}>{strings(`${context}.${status}`)}</FailedText>
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
      return <FailedText {...props}>{strings(`${context}.failed`)}</FailedText>;
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
