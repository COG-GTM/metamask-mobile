import React, { PureComponent, ReactNode } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import type { ThemeColors } from '@metamask/design-tokens';
import type { Theme } from '../../../util/theme/models';
import { strings } from '../../../../locales/i18n';
import { TRANSACTION_TYPES } from '../../../util/transactions';
import Summary from '../../Base/Summary';
import Text from '../../Base/Text';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { isTestNet } from '../../../util/networks';

// `Summary` and its sub-components are typed without a `children` prop
const SummaryView = Summary as unknown as React.FC<
  React.PropsWithChildren<Record<string, unknown>>
>;
const SummaryRow = Summary.Row as unknown as React.FC<
  React.PropsWithChildren<Record<string, unknown>>
>;
const SummaryCol = Summary.Col as unknown as React.FC<
  React.PropsWithChildren<Record<string, unknown>>
>;
// `italic` is not part of the base `Text` props but is forwarded to `RNText`
const ItalicText = Text as React.FC<
  React.ComponentProps<typeof Text> & { italic?: boolean }
>;

const createStyles = (colors: ThemeColors) =>
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
  renderIfGastEstimationReady = (children: ReactNode) => {
    const { gasEstimationReady } = this.props;
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
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
        <SummaryView>
          <SummaryRow>
            <Text small bold primary>
              {strings('transaction.amount')}
            </Text>
            <Text small bold primary upper={!isTestNetResult}>
              {amount}
            </Text>
          </SummaryRow>
          {secondaryTotalAmount && (
            <SummaryRow end last>
              <Text small right upper={!isTestNetResult}>
                {secondaryTotalAmount}
              </Text>
            </SummaryRow>
          )}
        </SummaryView>
      );
    }
    return (
      <SummaryView>
        <SummaryRow>
          <Text small primary>
            {this.renderAmountTitle()}
          </Text>
          <Text small primary upper={!isTestNetResult}>
            {amount}
          </Text>
        </SummaryRow>
        <SummaryRow>
          <SummaryCol>
            <ItalicText small primary italic>
              {!fee
                ? strings('transaction.transaction_fee_less')
                : strings('transaction.transaction_fee_estimated')}
            </ItalicText>
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
          </SummaryCol>
          {!!fee &&
            this.renderIfGastEstimationReady(
              <Text small primary upper={!isTestNetResult}>
                {fee}
              </Text>,
            )}
        </SummaryRow>
        <Summary.Separator />
        <SummaryRow>
          <Text small bold primary>
            {strings('transaction.total_amount')}
          </Text>
          {this.renderIfGastEstimationReady(
            <Text small bold primary upper={!isTestNetResult}>
              {totalAmount}
            </Text>,
          )}
        </SummaryRow>
        <SummaryRow end last>
          {this.renderIfGastEstimationReady(
            <Text small right upper={!isTestNetResult}>
              {secondaryTotalAmount}
            </Text>,
          )}
        </SummaryRow>
      </SummaryView>
    );
  };
}

TransactionSummary.contextType = ThemeContext;
