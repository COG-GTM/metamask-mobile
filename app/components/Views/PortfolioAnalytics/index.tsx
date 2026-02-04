import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../util/theme';
import { getNavigationOptionsTitle } from '../../UI/Navbar';
import { strings } from '../../../../locales/i18n';
import { selectPrivacyMode } from '../../../selectors/preferencesController';
import { useSelectedAccountMultichainBalances } from '../../hooks/useMultichainBalances';
import SensitiveText, {
  SensitiveTextLength,
} from '../../../component-library/components/Texts/SensitiveText';
import Text, {
  TextVariant,
  TextColor,
} from '../../../component-library/components/Texts/Text';
import { Colors } from '../../../util/theme/models';
import { PortfolioAnalyticsSelectorsIDs } from '../../../../e2e/selectors/PortfolioAnalytics/PortfolioAnalytics.selectors';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    content: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: colors.background.alternative,
      borderRadius: 8,
    },
    sectionTitle: {
      marginBottom: 12,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    metricCard: {
      padding: 16,
      backgroundColor: colors.background.default,
      borderRadius: 8,
      marginBottom: 12,
    },
    metricLabel: {
      marginBottom: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.muted,
      marginVertical: 16,
    },
  });

const PortfolioAnalytics = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const privacyMode = useSelector(selectPrivacyMode);
  const { selectedAccountMultichainBalance } =
    useSelectedAccountMultichainBalances();

  const updateNavBar = useCallback(() => {
    navigation.setOptions(
      getNavigationOptionsTitle(
        strings('portfolio_analytics.title'),
        navigation,
        false,
        colors,
      ),
    );
  }, [navigation, colors]);

  useEffect(() => {
    updateNavBar();
  }, [updateNavBar]);

  const totalBalance = selectedAccountMultichainBalance?.displayBalance ?? '$0.00';

  return (
    <View
      style={styles.wrapper}
      testID={PortfolioAnalyticsSelectorsIDs.CONTAINER}
    >
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text
            variant={TextVariant.HeadingSM}
            color={TextColor.Default}
            style={styles.sectionTitle}
          >
            {strings('portfolio_analytics.total_balance')}
          </Text>
          <SensitiveText
            isHidden={privacyMode}
            length={SensitiveTextLength.Long}
            variant={TextVariant.DisplayMD}
            testID={PortfolioAnalyticsSelectorsIDs.TOTAL_BALANCE}
          >
            {totalBalance}
          </SensitiveText>
        </View>

        <View style={styles.section}>
          <Text
            variant={TextVariant.HeadingSM}
            color={TextColor.Default}
            style={styles.sectionTitle}
          >
            {strings('portfolio_analytics.performance_metrics')}
          </Text>

          <View style={styles.metricCard}>
            <Text
              variant={TextVariant.BodySM}
              color={TextColor.Alternative}
              style={styles.metricLabel}
            >
              {strings('portfolio_analytics.daily_change')}
            </Text>
            <SensitiveText
              isHidden={privacyMode}
              length={SensitiveTextLength.Short}
              variant={TextVariant.BodyLGMedium}
              testID={PortfolioAnalyticsSelectorsIDs.DAILY_CHANGE}
            >
              --
            </SensitiveText>
          </View>

          <View style={styles.metricCard}>
            <Text
              variant={TextVariant.BodySM}
              color={TextColor.Alternative}
              style={styles.metricLabel}
            >
              {strings('portfolio_analytics.weekly_change')}
            </Text>
            <SensitiveText
              isHidden={privacyMode}
              length={SensitiveTextLength.Short}
              variant={TextVariant.BodyLGMedium}
              testID={PortfolioAnalyticsSelectorsIDs.WEEKLY_CHANGE}
            >
              --
            </SensitiveText>
          </View>

          <View style={styles.metricCard}>
            <Text
              variant={TextVariant.BodySM}
              color={TextColor.Alternative}
              style={styles.metricLabel}
            >
              {strings('portfolio_analytics.monthly_change')}
            </Text>
            <SensitiveText
              isHidden={privacyMode}
              length={SensitiveTextLength.Short}
              variant={TextVariant.BodyLGMedium}
              testID={PortfolioAnalyticsSelectorsIDs.MONTHLY_CHANGE}
            >
              --
            </SensitiveText>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            variant={TextVariant.HeadingSM}
            color={TextColor.Default}
            style={styles.sectionTitle}
          >
            {strings('portfolio_analytics.asset_allocation')}
          </Text>
          <Text
            variant={TextVariant.BodyMD}
            color={TextColor.Alternative}
          >
            {strings('portfolio_analytics.coming_soon')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default PortfolioAnalytics;
