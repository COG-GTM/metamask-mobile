import React, { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { strings } from '../../../../locales/i18n';
import { TRANSACTION_TYPES } from '../../../util/transactions';
import Summary from '../../Base/Summary';
import Text from '../../Base/Text';
import { useTheme } from '../../../util/theme';
import { isTestNet } from '../../../util/networks';
import { Theme } from '@metamask/design-tokens';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    loader: {
      backgroundColor: colors.background.default,
      height: 10,
    },
  });

interface TransactionSummaryProps {
  amount?: string;
  fee?: string;
  totalAmount?: string;
  secondaryTotalAmount?: string;
  gasEstimationReady?: boolean;
  onEditPress?: () => void;
  transactionType?: string;
  chainId?: string;
}

const TransactionSummary = ({
  amount,
  fee,
  totalAmount,
  secondaryTotalAmount,
  gasEstimationReady,
  onEditPress,
  transactionType,
  chainId,
}: TransactionSummaryProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const renderIfGasEstimationReady = (children: ReactNode) =>
    !gasEstimationReady ? (
      <View style={styles.loader}>
        <ActivityIndicator size="small" />
      </View>
    ) : (
      children
    );

  const renderAmountTitle = () => {
    if (
      transactionType === TRANSACTION_TYPES.SENT_COLLECTIBLE ||
      transactionType === TRANSACTION_TYPES.RECEIVED_COLLECTIBLE
    ) {
      return strings('transaction.token_id');
    }
    return strings('transaction.amount');
  };

  const isTestNetResult = chainId ? isTestNet(chainId) : false;

  if (
    transactionType === TRANSACTION_TYPES.RECEIVED_TOKEN ||
    transactionType === TRANSACTION_TYPES.RECEIVED
  ) {
    return (
      <Summary>
        <Summary.Row>
          <Text small bold primary>
            {strings('transaction.amount')}
          </Text>
          <Text small bold primary upper={!isTestNetResult}>
            {amount}
          </Text>
        </Summary.Row>
        {secondaryTotalAmount && (
          <Summary.Row end last>
            <Text small right upper={!isTestNetResult}>
              {secondaryTotalAmount}
            </Text>
          </Summary.Row>
        )}
      </Summary>
    );
  }

  return (
    <Summary>
      <Summary.Row>
        <Text small primary>
          {renderAmountTitle()}
        </Text>
        <Text small primary upper={!isTestNetResult}>
          {amount}
        </Text>
      </Summary.Row>
      <Summary.Row>
        <Summary.Col>
          <Text small primary>
            {!fee
              ? strings('transaction.transaction_fee_less')
              : strings('transaction.transaction_fee_estimated')}
          </Text>
          {!fee || !onEditPress ? null : (
            <TouchableOpacity
              disabled={!gasEstimationReady}
              onPress={onEditPress}
              key="transactionFeeEdit"
              testID=""
            >
              <Text small link>
                {'  '}
                {strings('transaction.edit')}
              </Text>
            </TouchableOpacity>
          )}
        </Summary.Col>
        {!!fee &&
          renderIfGasEstimationReady(
            <Text small primary upper={!isTestNetResult}>
              {fee}
            </Text>,
          )}
      </Summary.Row>
      <Summary.Separator />
      <Summary.Row>
        <Text small bold primary>
          {strings('transaction.total_amount')}
        </Text>
        {renderIfGasEstimationReady(
          <Text small bold primary upper={!isTestNetResult}>
            {totalAmount}
          </Text>,
        )}
      </Summary.Row>
      <Summary.Row end last>
        {renderIfGasEstimationReady(
          <Text small right upper={!isTestNetResult}>
            {secondaryTotalAmount}
          </Text>,
        )}
      </Summary.Row>
    </Summary>
  );
};

export default TransactionSummary;
