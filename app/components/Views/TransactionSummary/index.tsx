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

type SummaryWithChildren = React.ComponentType<
  React.PropsWithChildren<object>
> & {
  Row: React.ComponentType<
    React.PropsWithChildren<{ end?: boolean; last?: boolean }>
  >;
  Col: React.ComponentType<React.PropsWithChildren<{ end?: boolean }>>;
  Separator: React.ComponentType<React.PropsWithChildren<object>>;
};

type TextWithChildren = React.ComponentType<
  React.PropsWithChildren<{
    small?: boolean;
    bold?: boolean;
    primary?: boolean;
    right?: boolean;
    upper?: boolean;
    italic?: boolean;
    link?: boolean;
  }>
>;

const TypedSummary = Summary as SummaryWithChildren;
const TypedText = Text as TextWithChildren;

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

    const isTestNetResult = isTestNet(chainId ?? '');

    if (
      this.props.transactionType === TRANSACTION_TYPES.RECEIVED_TOKEN ||
      this.props.transactionType === TRANSACTION_TYPES.RECEIVED
    ) {
      return (
        <TypedSummary>
          <TypedSummary.Row>
            <TypedText small bold primary>
              {strings('transaction.amount')}
            </TypedText>
            <TypedText small bold primary upper={!isTestNetResult}>
              {amount}
            </TypedText>
          </TypedSummary.Row>
          {secondaryTotalAmount && (
            <TypedSummary.Row end last>
              <TypedText small right upper={!isTestNetResult}>
                {secondaryTotalAmount}
              </TypedText>
            </TypedSummary.Row>
          )}
        </TypedSummary>
      );
    }
    return (
      <TypedSummary>
        <TypedSummary.Row>
          <TypedText small primary>
            {this.renderAmountTitle()}
          </TypedText>
          <TypedText small primary upper={!isTestNetResult}>
            {amount}
          </TypedText>
        </TypedSummary.Row>
        <TypedSummary.Row>
          <TypedSummary.Col>
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
          </TypedSummary.Col>
          {!!fee &&
            this.renderIfGastEstimationReady(
              <TypedText small primary upper={!isTestNetResult}>
                {fee}
              </TypedText>,
            )}
        </TypedSummary.Row>
        <TypedSummary.Separator />
        <TypedSummary.Row>
          <TypedText small bold primary>
            {strings('transaction.total_amount')}
          </TypedText>
          {this.renderIfGastEstimationReady(
            <TypedText small bold primary upper={!isTestNetResult}>
              {totalAmount}
            </TypedText>,
          )}
        </TypedSummary.Row>
        <TypedSummary.Row end last>
          {this.renderIfGastEstimationReady(
            <TypedText small right upper={!isTestNetResult}>
              {secondaryTotalAmount}
            </TypedText>,
          )}
        </TypedSummary.Row>
      </TypedSummary>
    );
  };
}
