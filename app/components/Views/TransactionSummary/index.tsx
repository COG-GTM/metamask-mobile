import React, { PureComponent, ReactNode } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { strings } from '../../../../locales/i18n';
import { TRANSACTION_TYPES } from '../../../util/transactions';
import SummaryUntyped from '../../Base/Summary';
import TextUntyped from '../../Base/Text';

// Local re-types: the underlying components accept children at runtime, but
// their published prop types omit them.
const Summary = SummaryUntyped as unknown as React.FC<{
  children?: React.ReactNode;
}> & {
  Row: React.FC<{ end?: boolean; last?: boolean; children?: React.ReactNode }>;
  Col: React.FC<{ end?: boolean; children?: React.ReactNode }>;
  Separator: React.FC<Record<string, never>>;
};
const Text = TextUntyped as unknown as React.FC<{
  small?: boolean;
  bold?: boolean;
  primary?: boolean;
  italic?: boolean;
  link?: boolean;
  right?: boolean;
  upper?: boolean;
  style?: unknown;
  children?: React.ReactNode;
  onPress?: () => void;
}>;
import { ThemeContext, mockTheme } from '../../../util/theme';
import { isTestNet } from '../../../util/networks';

interface Colors {
  background: { default: string };
  [key: string]: unknown;
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    loader: {
      backgroundColor: colors.background.default,
      height: 10,
    },
  });

interface Props {
  amount?: string;
  fee?: string;
  totalAmount?: string;
  secondaryTotalAmount?: string;
  gasEstimationReady?: boolean;
  onEditPress?: () => void;
  transactionType?: string;
  chainId?: string;
}

export default class TransactionSummary extends PureComponent<Props> {
  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  renderIfGastEstimationReady = (children: ReactNode) => {
    const { gasEstimationReady } = this.props;
    const colors = (this.context?.colors || mockTheme.colors) as Colors;
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
