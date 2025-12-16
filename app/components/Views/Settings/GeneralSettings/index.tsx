import React, { PureComponent } from 'react';
import {
  StyleSheet,
  ScrollView,
  Switch,
  View,
  Image,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import Engine from '../../../../core/Engine';
import I18n, {
  strings,
  getLanguages,
  setLocale,
} from '../../../../../locales/i18n';
import SelectComponent from '../../../UI/SelectComponent';
import infuraCurrencies from '../../../../util/infura-conversion.json';
import { getNavigationOptionsTitle } from '../../../UI/Navbar';
import {
  setSearchEngine,
  setPrimaryCurrency,
  setUseBlockieIcon,
  setHideZeroBalanceTokens,
} from '../../../../actions/settings';
import PickComponent from '../../PickComponent';
import { toDataUrl } from '../../../../util/blockies.js';
import Jazzicon from 'react-native-jazzicon';
import { ThemeContext, mockTheme } from '../../../../util/theme';
import { selectCurrentCurrency } from '../../../../selectors/currencyRateController';
import { withMetricsAwareness } from '../../../../components/hooks/useMetrics';
import { selectSelectedInternalAccountFormattedAddress } from '../../../../selectors/accountsController';
import Text, {
  TextVariant,
  TextColor,
} from '../../../../component-library/components/Texts/Text';
import { MetaMetricsEvents } from '../../../../core/Analytics';
import { MetricsEventBuilder } from '../../../../core/Analytics/MetricsEventBuilder';
import { UserProfileProperty } from '../../../../util/metrics/UserSettingsAnalyticsMetaData/UserProfileAnalyticsMetaData.types';
import { RootState } from '../../../../reducers';
import { Theme } from '../../../../util/theme/models';

const diameter = 40;
const spacing = 8;

interface CurrencyQuote {
  code: string;
  name: string;
}

interface CurrencyObject {
  quote: CurrencyQuote;
}

const sortedCurrencies = (infuraCurrencies as { objects: CurrencyObject[] }).objects.sort((a, b) =>
  a.quote.code
    .toLocaleLowerCase()
    .localeCompare(b.quote.code.toLocaleLowerCase()),
);

const infuraCurrencyOptions = sortedCurrencies.map(
  ({ quote: { code, name } }) => ({
    label: `${code.toUpperCase()} - ${name}`,
    key: code,
    value: code,
  }),
);

interface MetricsInterface {
  addTraitsToUser: (traits: Record<string, string>) => void;
  trackEvent: (event: unknown) => void;
}

export const updateUserTraitsWithCurrentCurrency = (currency: string, metrics: MetricsInterface) => {
  // track event and add selected currency to user profile for analytics
  const traits = { [UserProfileProperty.CURRENT_CURRENCY]: currency };
  metrics.addTraitsToUser(traits);
  metrics.trackEvent(
    MetricsEventBuilder.createEventBuilder(MetaMetricsEvents.CURRENCY_CHANGED)
      .addProperties({
        ...traits,
        location: 'app_settings',
      })
      .build(),
  );
};

export const updateUserTraitsWithCurrencyType = (primaryCurrency: string, metrics: MetricsInterface) => {
  // track event and add primary currency preference (fiat/crypto) to user profile for analytics
  const traits = { [UserProfileProperty.PRIMARY_CURRENCY]: primaryCurrency };
  metrics.addTraitsToUser(traits);
  metrics.trackEvent(
    MetricsEventBuilder.createEventBuilder(
      MetaMetricsEvents.PRIMARY_CURRENCY_TOGGLE,
    )
      .addProperties({
        ...traits,
        location: 'app_settings',
      })
      .build(),
  );
};

interface Styles {
  wrapper: ViewStyle;
  titleContainer: ViewStyle;
  title: ViewStyle;
  toggle: ViewStyle;
  desc: TextStyle;
  accessory: ViewStyle;
  picker: ViewStyle;
  setting: ViewStyle;
  switch: ViewStyle;
  firstSetting: ViewStyle;
  inner: ViewStyle;
  identicon_container: ViewStyle;
  identicon_row: ViewStyle;
  identiconText: TextStyle;
  blockie: ImageStyle;
  border: ViewStyle;
  selected: ViewStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      padding: 24,
      zIndex: 99999999999999,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      flex: 1,
    },
    toggle: {
      marginLeft: 16,
    },
    desc: {
      marginTop: 8,
    },
    accessory: {
      marginTop: 16,
    },
    picker: {
      borderColor: colors.border.default,
      borderRadius: 5,
      borderWidth: 2,
    },
    setting: {
      marginTop: 30,
    },
    switch: {
      alignSelf: 'flex-start',
    },
    firstSetting: {
      marginTop: 0,
    },
    inner: {
      paddingBottom: 100,
    },
    identicon_container: {
      flexDirection: 'row',
    },
    identicon_row: {
      width: '50%',
      alignItems: 'center',
      flexDirection: 'row',
    },
    identiconText: {
      marginLeft: 12,
    },
    blockie: {
      height: diameter,
      width: diameter,
      borderRadius: diameter / 2,
    },
    border: {
      height: diameter + spacing,
      width: diameter + spacing,
      borderRadius: (diameter + spacing) / 2,
      backgroundColor: colors.background.default,
      borderWidth: 2,
      borderColor: colors.background.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: {
      borderColor: colors.primary.default,
    },
  });

interface NavigationObject {
  setOptions: (options: unknown) => void;
  navigate: (route: string) => void;
}

interface LanguageOption {
  value: string;
  label: string;
  key: string;
}

interface SettingsProps {
  currentCurrency: string;
  navigation: NavigationObject;
  setSearchEngine: (searchEngine: string) => void;
  setPrimaryCurrency: (primaryCurrency: string) => void;
  searchEngine: string;
  primaryCurrency: string;
  useBlockieIcon: boolean;
  setUseBlockieIcon: (useBlockieIcon: boolean) => void;
  selectedAddress: string;
  hideZeroBalanceTokens: boolean;
  setHideZeroBalanceTokens: (hideZeroBalanceTokens: boolean) => void;
  metrics: MetricsInterface;
}

interface SettingsState {
  currentLanguage: string;
  languages: Record<string, string>;
}

/**
 * Main view for general app configurations
 */
class Settings extends PureComponent<SettingsProps, SettingsState> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  languageOptions: LanguageOption[] | undefined;
  searchEngineOptions: LanguageOption[] | undefined;
  primaryCurrencyOptions: LanguageOption[] | undefined;

  state: SettingsState = {
    currentLanguage: I18n.locale.substr(0, 2),
    languages: {},
  };

  selectCurrency = async (currency: string) => {
    const { CurrencyRateController } = Engine.context;
    CurrencyRateController.setCurrentCurrency(currency);
    updateUserTraitsWithCurrentCurrency(currency, this.props.metrics);
  };

  selectLanguage = (language: string) => {
    if (language === this.state.currentLanguage) return;
    setLocale(language);
    this.setState({ currentLanguage: language });
    setTimeout(() => this.props.navigation.navigate('Home'), 100);
  };

  selectSearchEngine = (searchEngine: string) => {
    this.props.setSearchEngine(searchEngine);
  };

  selectPrimaryCurrency = (primaryCurrency: string) => {
    this.props.setPrimaryCurrency(primaryCurrency);

    updateUserTraitsWithCurrencyType(primaryCurrency, this.props.metrics);
  };

  toggleHideZeroBalanceTokens = (toggleHideZeroBalanceTokens: boolean) => {
    this.props.setHideZeroBalanceTokens(toggleHideZeroBalanceTokens);
  };

  updateNavBar = () => {
    const { navigation } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    navigation.setOptions(
      getNavigationOptionsTitle(
        strings('app_settings.general_title'),
        navigation,
        false,
        colors,
      ),
    );
  };

  componentDidMount = () => {
    this.updateNavBar();
    const languages = getLanguages();
    this.setState({ languages });
    this.languageOptions = Object.keys(languages).map((key) => ({
      value: key,
      label: languages[key],
      key,
    }));
    this.searchEngineOptions = [
      { value: 'Google', label: 'Google', key: 'Google' },
      { value: 'DuckDuckGo', label: 'DuckDuckGo', key: 'DuckDuckGo' },
    ];
    this.primaryCurrencyOptions = [
      {
        value: 'ETH',
        label: strings('app_settings.primary_currency_text_first'),
        key: 'Native',
      },
      {
        value: 'Fiat',
        label: strings('app_settings.primary_currency_text_second'),
        key: 'Fiat',
      },
    ];
  };

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  render() {
    const {
      currentCurrency,
      primaryCurrency,
      useBlockieIcon,
      setUseBlockieIcon,
      selectedAddress,
      hideZeroBalanceTokens,
    } = this.props;
    const themeTokens = this.context || mockTheme;
    const { colors } = themeTokens;
    const styles = createStyles(colors);

    return (
      <ScrollView style={styles.wrapper}>
        <View style={styles.inner}>
          <View style={[styles.setting, styles.firstSetting]}>
            <Text variant={TextVariant.BodyLGMedium}>
              {strings('app_settings.conversion_title')}
            </Text>
            <Text
              variant={TextVariant.BodyMD}
              color={TextColor.Alternative}
              style={styles.desc}
            >
              {strings('app_settings.conversion_desc')}
            </Text>
            <View style={styles.accessory}>
              <View style={styles.picker}>
                <SelectComponent
                  selectedValue={currentCurrency}
                  onValueChange={this.selectCurrency}
                  label={strings('app_settings.current_conversion')}
                  options={infuraCurrencyOptions}
                />
              </View>
            </View>
          </View>
          <View style={styles.setting}>
            <Text variant={TextVariant.BodyLGMedium}>
              {strings('app_settings.primary_currency_title')}
            </Text>
            <Text
              variant={TextVariant.BodyMD}
              color={TextColor.Alternative}
              style={styles.desc}
            >
              {strings('app_settings.primary_currency_desc')}
            </Text>
            {this.primaryCurrencyOptions && (
              <View style={styles.accessory}>
                <PickComponent
                  pick={this.selectPrimaryCurrency}
                  textFirst={strings(
                    'app_settings.primary_currency_text_first',
                  )}
                  valueFirst={'ETH'}
                  textSecond={strings(
                    'app_settings.primary_currency_text_second',
                  )}
                  valueSecond={'Fiat'}
                  selectedValue={primaryCurrency}
                />
              </View>
            )}
          </View>
          <View style={styles.setting}>
            <Text variant={TextVariant.BodyLGMedium}>
              {strings('app_settings.current_language')}
            </Text>
            <Text
              variant={TextVariant.BodyMD}
              color={TextColor.Alternative}
              style={styles.desc}
            >
              {strings('app_settings.language_desc')}
            </Text>
            {this.languageOptions && (
              <View style={styles.accessory}>
                <View style={styles.picker}>
                  <SelectComponent
                    selectedValue={this.state.currentLanguage}
                    onValueChange={this.selectLanguage}
                    label={strings('app_settings.current_language')}
                    options={this.languageOptions}
                  />
                </View>
              </View>
            )}
          </View>
          <View style={styles.setting}>
            <Text variant={TextVariant.BodyLGMedium}>
              {strings('app_settings.search_engine')}
            </Text>
            <Text
              variant={TextVariant.BodyMD}
              color={TextColor.Alternative}
              style={styles.desc}
            >
              {strings('app_settings.engine_desc')}
            </Text>
            {this.searchEngineOptions && (
              <View style={styles.accessory}>
                <View style={styles.picker}>
                  <SelectComponent
                    selectedValue={this.props.searchEngine}
                    onValueChange={this.selectSearchEngine}
                    label={strings('app_settings.search_engine')}
                    options={this.searchEngineOptions}
                  />
                </View>
              </View>
            )}
          </View>
          <View style={styles.setting}>
            <View style={styles.titleContainer}>
              <Text variant={TextVariant.BodyLGMedium} style={styles.title}>
                {strings('app_settings.hide_zero_balance_tokens_title')}
              </Text>
              <View style={styles.toggle}>
                <Switch
                  value={hideZeroBalanceTokens}
                  onValueChange={this.toggleHideZeroBalanceTokens}
                  trackColor={{
                    true: colors.primary.default,
                    false: colors.border.muted,
                  }}
                  thumbColor={themeTokens.brandColors.white}
                  style={styles.switch}
                  ios_backgroundColor={colors.border.muted}
                />
              </View>
            </View>
            <Text
              variant={TextVariant.BodyMD}
              color={TextColor.Alternative}
              style={styles.desc}
            >
              {strings('app_settings.hide_zero_balance_tokens_desc')}
            </Text>
          </View>
          <View style={styles.setting}>
            <Text variant={TextVariant.BodyLGMedium}>
              {strings('app_settings.accounts_identicon_title')}
            </Text>
            <Text
              variant={TextVariant.BodyMD}
              color={TextColor.Alternative}
              style={styles.desc}
            >
              {strings('app_settings.accounts_identicon_desc')}
            </Text>
            <View style={styles.accessory}>
              <View style={styles.identicon_container}>
                <TouchableOpacity
                  onPress={() => setUseBlockieIcon(false)}
                  style={styles.identicon_row}
                >
                  <View
                    style={[styles.border, !useBlockieIcon && styles.selected]}
                  >
                    <Jazzicon size={diameter} address={selectedAddress} />
                  </View>
                  <Text style={styles.identiconText}>
                    {strings('app_settings.jazzicons')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setUseBlockieIcon(true)}
                  style={styles.identicon_row}
                >
                  <View
                    style={[styles.border, useBlockieIcon && styles.selected]}
                  >
                    <Image
                      source={{ uri: toDataUrl(selectedAddress) }}
                      style={styles.blockie}
                    />
                  </View>
                  <Text style={styles.identiconText}>
                    {strings('app_settings.blockies')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  currentCurrency: selectCurrentCurrency(state),
  searchEngine: state.settings.searchEngine,
  primaryCurrency: state.settings.primaryCurrency,
  useBlockieIcon: state.settings.useBlockieIcon,
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  hideZeroBalanceTokens: state.settings.hideZeroBalanceTokens,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setSearchEngine: (searchEngine: string) => dispatch(setSearchEngine(searchEngine)),
  setPrimaryCurrency: (primaryCurrency: string) =>
    dispatch(setPrimaryCurrency(primaryCurrency)),
  setUseBlockieIcon: (useBlockieIcon: boolean) =>
    dispatch(setUseBlockieIcon(useBlockieIcon)),
  setHideZeroBalanceTokens: (hideZeroBalanceTokens: boolean) =>
    dispatch(setHideZeroBalanceTokens(hideZeroBalanceTokens)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(Settings));
