import React, { ReactNode } from 'react';
import Text from './Text';
import { StyleSheet, TextProps, StyleProp, TextStyle } from 'react-native';
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

interface StatusTextComponentProps extends TextProps {
  testID?: string;
  children?: ReactNode;
}

export const ConfirmedText = ({testID, ...props}: StatusTextComponentProps) => (
  <Text
    testID={testID}
    bold
    green
    style={styles.status}
    {...props}
  />
);

export const PendingText = ({testID, ...props}: StatusTextComponentProps) => {
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

export const FailedText = ({testID, ...props}: StatusTextComponentProps) => {
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

interface StatusTextProps {
  status: string;
  context?: string;
  testID?: string;
  style?: StyleProp<TextStyle>;
}

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
