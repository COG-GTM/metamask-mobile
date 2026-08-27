/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React, { PureComponent } from 'react';
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
import { ThemeContext, mockTheme } from '../../../util/theme';
import { isTestNet } from '../../../util/networks';

// @ts-expect-error -- legacy JavaScript UI type boundary
const createStyles = (colors) =>
  StyleSheet.create({
    loader: {
      backgroundColor: colors.background.default,
      height: 10,
    },
  });

export default class TransactionSummary extends PureComponent {

  // @ts-expect-error -- legacy JavaScript UI type boundary
  renderIfGastEstimationReady = (children) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { gasEstimationReady } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return !gasEstimationReady ? (
      <View style={styles.loader}>
        <ActivityIndicator size="small" />
      </View>
    ) : (
      children
    );
  };

  renderAmountTitle = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { transactionType } = this.props;
    if (
      transactionType === TRANSACTION_TYPES.SENT_COLLECTIBLE ||
      transactionType === TRANSACTION_TYPES.RECEIVED_COLLECTIBLE
    ) {
      return strings('transaction.token_id');
    }
    return strings('transaction.amount');
  };

  render = () => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      amount,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      fee,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      totalAmount,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      secondaryTotalAmount,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      gasEstimationReady,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      onEditPress,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      chainId,
    } = this.props;

    const isTestNetResult = isTestNet(chainId);

    if (
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.transactionType === TRANSACTION_TYPES.RECEIVED_TOKEN ||
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.transactionType === TRANSACTION_TYPES.RECEIVED
    ) {
      return (
        // @ts-expect-error -- legacy JavaScript UI type boundary
        <Summary>
          {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
          <Summary.Row>
            <Text small bold primary>
              {strings('transaction.amount')}
            </Text>
            <Text small bold primary upper={!isTestNetResult}>
              {amount}
            </Text>
          </Summary.Row>
          {secondaryTotalAmount && (
            // @ts-expect-error -- legacy JavaScript UI type boundary
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
      // @ts-expect-error -- legacy JavaScript UI type boundary
      <Summary>
        {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
        <Summary.Row>
          <Text small primary>
            {this.renderAmountTitle()}
          </Text>
          <Text small primary upper={!isTestNetResult}>
            {amount}
          </Text>
        </Summary.Row>
        {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
        <Summary.Row>
          {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
          <Summary.Col>
            {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
            <Text small primary italic>
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
            this.renderIfGastEstimationReady(
              <Text small primary upper={!isTestNetResult}>
                {fee}
              </Text>,
            )}
        </Summary.Row>
        <Summary.Separator />
        {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
        <Summary.Row>
          <Text small bold primary>
            {strings('transaction.total_amount')}
          </Text>
          {this.renderIfGastEstimationReady(
            <Text small bold primary upper={!isTestNetResult}>
              {totalAmount}
            </Text>,
          )}
        </Summary.Row>
        {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
        <Summary.Row end last>
          {this.renderIfGastEstimationReady(
            <Text small right upper={!isTestNetResult}>
              {secondaryTotalAmount}
            </Text>,
          )}
        </Summary.Row>
      </Summary>
    );
  };
}

TransactionSummary.contextType = ThemeContext;

interface TransactionSummaryProps {
  amount?: string;
  chainId?: string;
  fee?: string;
  gasEstimationReady?: boolean;
  onEditPress?: (...args: any[]) => any;
  secondaryTotalAmount?: string;
  totalAmount?: string;
  transactionType?: string;
}
