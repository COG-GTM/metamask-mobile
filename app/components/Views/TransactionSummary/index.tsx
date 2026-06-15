import React, { PureComponent, ReactNode } from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Theme } from '@metamask/design-tokens';
import { strings } from '../../../../locales/i18n';
import { TRANSACTION_TYPES } from '../../../util/transactions';
import SummaryBase from '../../Base/Summary';
import TextBase from '../../Base/Text';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { isTestNet } from '../../../util/networks';

type SummaryRowLikeProps = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  end?: boolean;
  last?: boolean;
}>;
const Summary = SummaryBase as unknown as React.FC<SummaryRowLikeProps> & {
  Row: React.FC<SummaryRowLikeProps>;
  Col: React.FC<SummaryRowLikeProps>;
  Separator: React.FC<SummaryRowLikeProps>;
};
const Text = TextBase as React.FC<
  React.ComponentProps<typeof TextBase> & { italic?: boolean }
>;

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

export default class TransactionSummary extends PureComponent<TransactionSummaryProps> {
  static contextType = ThemeContext;

  renderIfGastEstimationReady = (children: ReactNode) => {
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
            {this.renderAmountTitle()}
          </Text>
          <Text small primary upper={!isTestNetResult}>
            {amount}
          </Text>
        </Summary.Row>
        <Summary.Row>
          <Summary.Col>
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


