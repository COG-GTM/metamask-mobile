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
import type { Theme } from '../../../util/theme/models';
import { isTestNet } from '../../../util/networks';

const TypedText = Text as React.ComponentType<
  React.ComponentProps<typeof Text> & { italic?: boolean }
>;

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

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    loader: {
      backgroundColor: colors.background.default,
      height: 10,
    },
  });

export default class TransactionSummary extends PureComponent<TransactionSummaryProps> {
  static contextType = ThemeContext;

  renderIfGastEstimationReady = (children: React.ReactNode) => {
    const { gasEstimationReady } = this.props;
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
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
      amount,
      fee,
      totalAmount,
      secondaryTotalAmount,
      gasEstimationReady,
      onEditPress,
      chainId,
    } = this.props;

    const isTestNetResult = isTestNet(chainId as string);

    if (
      this.props.transactionType === TRANSACTION_TYPES.RECEIVED_TOKEN ||
      this.props.transactionType === TRANSACTION_TYPES.RECEIVED
    ) {
      return (
        <Summary>
          <Summary.Row>
            <TypedText small bold primary>
              {strings('transaction.amount')}
            </TypedText>
            <TypedText small bold primary upper={!isTestNetResult}>
              {amount}
            </TypedText>
          </Summary.Row>
          {secondaryTotalAmount && (
            <Summary.Row end last>
              <TypedText small right upper={!isTestNetResult}>
                {secondaryTotalAmount}
              </TypedText>
            </Summary.Row>
          )}
        </Summary>
      );
    }
    return (
      <Summary>
        <Summary.Row>
          <TypedText small primary>
            {this.renderAmountTitle()}
          </TypedText>
          <TypedText small primary upper={!isTestNetResult}>
            {amount}
          </TypedText>
        </Summary.Row>
        <Summary.Row>
          <Summary.Col>
            <TypedText small primary italic>
              {!fee
                ? strings('transaction.transaction_fee_less')
                : strings('transaction.transaction_fee_estimated')}
            </TypedText>
            {!fee || !onEditPress ? null : (
              <TouchableOpacity
                disabled={!gasEstimationReady}
                onPress={onEditPress}
                key="transactionFeeEdit"
                testID=""
              >
                <TypedText small link>
                  {'  '}
                  {strings('transaction.edit')}
                </TypedText>
              </TouchableOpacity>
            )}
          </Summary.Col>
          {!!fee &&
            this.renderIfGastEstimationReady(
              <TypedText small primary upper={!isTestNetResult}>
                {fee}
              </TypedText>,
            )}
        </Summary.Row>
        <Summary.Separator />
        <Summary.Row>
          <TypedText small bold primary>
            {strings('transaction.total_amount')}
          </TypedText>
          {this.renderIfGastEstimationReady(
            <TypedText small bold primary upper={!isTestNetResult}>
              {totalAmount}
            </TypedText>,
          )}
        </Summary.Row>
        <Summary.Row end last>
          {this.renderIfGastEstimationReady(
            <TypedText small right upper={!isTestNetResult}>
              {secondaryTotalAmount}
            </TypedText>,
          )}
        </Summary.Row>
      </Summary>
    );
  };
}
