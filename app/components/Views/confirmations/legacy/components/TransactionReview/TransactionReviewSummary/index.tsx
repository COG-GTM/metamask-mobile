import React, { PureComponent, ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { fontStyles } from '../../../../../../../styles/common';
import { strings } from '../../../../../../../../locales/i18n';
import WarningMessage from '../../../SendFlow/WarningMessage';
import { ThemeContext, mockTheme } from '../../../../../../../util/theme';
import { isTestNet } from '../../../../../../../util/networks';
import { Theme } from '../../../../../../../util/theme/models';

interface Styles {
  confirmBadge: TextStyle;
  summary: ViewStyle;
  summaryPrimary: TextStyle;
  testNestSummaryPrimary: TextStyle;
  summarySecondary: TextStyle;
  warning: ViewStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
  StyleSheet.create({
    confirmBadge: {
      ...fontStyles.normal,
      alignItems: 'center',
      borderColor: colors.border.default,
      borderRadius: 12,
      borderWidth: 1,
      color: colors.text.default,
      fontSize: 10,
      paddingVertical: 4,
      paddingHorizontal: 8,
      textAlign: 'center',
    },
    summary: {
      backgroundColor: colors.background.default,
      padding: 24,
      paddingTop: 12,
      paddingBottom: 16,
      alignItems: 'center',
    },
    summaryPrimary: {
      ...fontStyles.normal,
      color: colors.text.default,
      fontSize: 44,
      paddingTop: 16,
      paddingBottom: 4,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    testNestSummaryPrimary: {
      ...fontStyles.normal,
      color: colors.text.default,
      fontSize: 44,
      paddingTop: 16,
      paddingBottom: 4,
      textAlign: 'center',
    },
    summarySecondary: {
      ...fontStyles.normal,
      color: colors.text.alternative,
      fontSize: 24,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    warning: {
      width: '100%',
      paddingHorizontal: 24,
      paddingTop: 12,
    },
  });

interface TransactionReviewSummaryProps {
  conversionRate?: number;
  actionKey?: string;
  assetAmount?: string;
  fiatValue?: string;
  approveTransaction?: boolean;
  primaryCurrency?: string;
  chainId?: string;
}

/**
 * PureComponent that supports reviewing transaction summary
 */
class TransactionReviewSummary extends PureComponent<TransactionReviewSummaryProps> {
  declare context: React.ContextType<typeof ThemeContext>;

  renderWarning = (): ReactNode => (
    <Text>{`${strings('transaction.approve_warning')} ${
      this.props.assetAmount
    }`}</Text>
  );

  render = () => {
    const {
      actionKey,
      assetAmount,
      conversionRate,
      fiatValue,
      approveTransaction,
      primaryCurrency,
      chainId,
    } = this.props;
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);
    const isTestNetResult = isTestNet(chainId);

    return (
      <View>
        {!!approveTransaction && (
          <View style={styles.warning}>
            <WarningMessage warningMessage={this.renderWarning()} />
          </View>
        )}
        <View style={styles.summary}>
          <Text style={styles.confirmBadge} numberOfLines={1}>
            {actionKey}
          </Text>

          {!conversionRate ? (
            <Text
              style={
                isTestNetResult
                  ? styles.testNestSummaryPrimary
                  : styles.summaryPrimary
              }
            >
              {assetAmount}
            </Text>
          ) : (
            <View>
              <Text
                style={
                  isTestNetResult
                    ? styles.testNestSummaryPrimary
                    : styles.summaryPrimary
                }
              >
                {primaryCurrency === 'ETH' ? assetAmount : fiatValue}
              </Text>
              <Text style={styles.summarySecondary}>
                {primaryCurrency === 'ETH' ? fiatValue : assetAmount}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };
}

TransactionReviewSummary.contextType = ThemeContext;

export default TransactionReviewSummary;
