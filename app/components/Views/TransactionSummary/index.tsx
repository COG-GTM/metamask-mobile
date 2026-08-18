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
import TextComponent from '../../Base/Text';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { isTestNet } from '../../../util/networks';
import type { Theme } from '../../../util/theme/models';

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

const Text = TextComponent as React.ComponentType<
  React.ComponentProps<typeof TextComponent> & {
    children?: React.ReactNode;
    italic?: boolean;
  }
>;

type SummaryPropsWithChildren = React.ComponentProps<typeof Summary> & {
  children?: React.ReactNode;
};
type SummaryRowPropsWithChildren = React.ComponentProps<typeof Summary.Row> & {
  children?: React.ReactNode;
};
type SummaryColPropsWithChildren = React.ComponentProps<typeof Summary.Col> & {
  children?: React.ReactNode;
};
type SummarySeparatorPropsWithChildren = React.ComponentProps<
  typeof Summary.Separator
> & {
  children?: React.ReactNode;
};

const SummaryWithChildren = Summary as React.ComponentType<
  SummaryPropsWithChildren
> & {
  Row: React.ComponentType<SummaryRowPropsWithChildren>;
  Col: React.ComponentType<SummaryColPropsWithChildren>;
  Separator: React.ComponentType<SummarySeparatorPropsWithChildren>;
};

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    loader: {
      backgroundColor: colors.background.default,
      height: 10,
    },
  });

export default class TransactionSummary extends PureComponent<TransactionSummaryProps> {
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
        <SummaryWithChildren>
          <SummaryWithChildren.Row>
            <Text small bold primary>
              {strings('transaction.amount')}
            </Text>
            <Text small bold primary upper={!isTestNetResult}>
              {amount}
            </Text>
          </SummaryWithChildren.Row>
          {secondaryTotalAmount && (
            <SummaryWithChildren.Row end last>
              <Text small right upper={!isTestNetResult}>
                {secondaryTotalAmount}
              </Text>
            </SummaryWithChildren.Row>
          )}
        </SummaryWithChildren>
      );
    }
    return (
      <SummaryWithChildren>
        <SummaryWithChildren.Row>
          <Text small primary>
            {this.renderAmountTitle()}
          </Text>
          <Text small primary upper={!isTestNetResult}>
            {amount}
          </Text>
        </SummaryWithChildren.Row>
        <SummaryWithChildren.Row>
          <SummaryWithChildren.Col>
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
          </SummaryWithChildren.Col>
          {!!fee &&
            this.renderIfGastEstimationReady(
              <Text small primary upper={!isTestNetResult}>
                {fee}
              </Text>,
            )}
        </SummaryWithChildren.Row>
        <SummaryWithChildren.Separator />
        <SummaryWithChildren.Row>
          <Text small bold primary>
            {strings('transaction.total_amount')}
          </Text>
          {this.renderIfGastEstimationReady(
            <Text small bold primary upper={!isTestNetResult}>
              {totalAmount}
            </Text>,
          )}
        </SummaryWithChildren.Row>
        <SummaryWithChildren.Row end last>
          {this.renderIfGastEstimationReady(
            <Text small right upper={!isTestNetResult}>
              {secondaryTotalAmount}
            </Text>,
          )}
        </SummaryWithChildren.Row>
      </SummaryWithChildren>
    );
  };
}

TransactionSummary.contextType = ThemeContext;
