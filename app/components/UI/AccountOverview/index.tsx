import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  InteractionManager,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { connect } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { strings } from '../../../../locales/i18n';
import { WalletViewSelectorsIDs } from '../../../../e2e/selectors/wallet/WalletView.selectors';
import { showAlert } from '../../../actions/alert';
import { newAssetTransaction } from '../../../actions/transaction';
import { protectWalletModalVisible } from '../../../actions/user';
import Routes from '../../../constants/navigation/Routes';
import ClipboardManager from '../../../core/ClipboardManager';
import { fontStyles } from '../../../styles/common';
import {
  doENSReverseLookup,
  isDefaultAccountName,
} from '../../../util/ENSUtils';
import {
  getLabelTextByAddress,
  renderAccountName,
} from '../../../util/address';
import Device from '../../../util/device';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import EthereumAddress from '../EthereumAddress';
import Identicon from '../Identicon';
import { MetaMetricsEvents } from '../../../core/Analytics';
import AppConstants from '../../../core/AppConstants';
import Engine from '../../../core/Engine';
import { selectChainId } from '../../../selectors/networkController';
import { selectCurrentCurrency } from '../../../selectors/currencyRateController';
import {
  selectInternalAccounts,
  selectSelectedInternalAccountFormattedAddress,
} from '../../../selectors/accountsController';
import { createAccountSelectorNavDetails } from '../../Views/AccountSelector';
import Text, {
  TextVariant,
} from '../../../component-library/components/Texts/Text';
import { withMetricsAwareness } from '../../../components/hooks/useMetrics';
import { isPortfolioUrl } from '../../../util/url';
import { toLowerCaseEquals } from '../../../util/general';
import { RootState } from '../../../reducers';
import { IUseMetricsHook } from '../../hooks/useMetrics/useMetrics.types';

interface BrowserTab {
  id: string;
  url: string;
}

interface Account {
  address: string;
  name: string;
  balanceFiat?: number;
  label?: string;
}

interface OwnProps {
  account: Account;
  onboardingWizard?: boolean;
  onRef?: (ref: AccountOverviewRef | null) => void;
  navigation: {
    navigate: (...args: unknown[]) => void;
  };
}

interface StateProps {
  selectedAddress: string | undefined;
  internalAccounts: InternalAccount[];
  currentCurrency: string;
  chainId: string;
  browserTabs: BrowserTab[];
}

interface DispatchProps {
  showAlert: (config: {
    isVisible: boolean;
    autodismiss: number;
    content: string;
    data: { msg: string };
  }) => void;
  protectWalletModalVisible: () => void;
  newAssetTransaction: (selectedAsset: unknown) => void;
}

interface MetricsProps {
  metrics: IUseMetricsHook;
}

type Props = OwnProps & StateProps & DispatchProps & MetricsProps;

export interface AccountOverviewRef {
  editableLabelRef: React.RefObject<View>;
  scrollViewContainer: React.RefObject<View>;
  mainView: React.RefObject<View>;
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    scrollView: {
      backgroundColor: colors.background.default,
    },
    wrapper: {
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 0,
      alignItems: 'center',
    },
    info: {
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    },
    data: {
      textAlign: 'center',
      paddingTop: 7,
    },
    label: {
      fontSize: 24,
      textAlign: 'center',
      ...fontStyles.normal,
      color: colors.text.default,
    },
    labelInput: {
      marginBottom: Device.isAndroid() ? -10 : 0,
    },
    labelWrapper: {
      flexDirection: 'row',
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
      padding: 4,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.text.default,
      height: 28,
      borderRadius: 14,
    },
    tagText: {
      minWidth: 32,
      textAlign: 'center',
      color: colors.text.default,
    },
    addressWrapper: {
      backgroundColor: colors.primary.muted,
      borderRadius: 40,
      marginTop: 20,
      marginBottom: 20,
      paddingVertical: 7,
      paddingHorizontal: 15,
    },
    address: {
      fontSize: 12,
      color: colors.text.default,
      ...fontStyles.normal,
      letterSpacing: 0.8,
    },
    amountFiat: {
      fontSize: 12,
      paddingTop: 5,
      color: colors.text.alternative,
      ...fontStyles.normal,
    },
    identiconBorder: {
      borderRadius: 80,
      borderWidth: 2,
      padding: 2,
      borderColor: colors.primary.default,
    },
    onboardingWizardLabel: {
      borderWidth: 2,
      borderRadius: 4,
      paddingVertical: Device.isIos() ? 2 : -4,
      paddingHorizontal: Device.isIos() ? 5 : 5,
      top: Device.isIos() ? 0 : -2,
    },
    actions: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'flex-start',
      flexDirection: 'row',
    },
    netWorthContainer: {
      justifyItems: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    portfolioLink: { marginLeft: 5 },
    portfolioIcon: { color: colors.primary.default },
  });

const isAccountLabelDefined = (accountLabel: string) =>
  !!accountLabel && !!accountLabel.trim().length;

/**
 * View that's part of the <Wallet /> component
 * which shows information about the selected account
 */
const AccountOverview = ({
  account,
  selectedAddress,
  internalAccounts,
  onboardingWizard,
  onRef,
  navigation,
  chainId,
  browserTabs,
  showAlert: showAlertAction,
  protectWalletModalVisible: protectWalletModalVisibleAction,
  metrics,
}: Props) => {
  const { colors, themeAppearance } = useTheme();
  const styles = createStyles(colors);

  const [accountLabelEditable, setAccountLabelEditable] = useState(false);
  const [accountLabel, setAccountLabelState] = useState('');
  const [ens, setEns] = useState<string | undefined>(undefined);

  const isInitialMount = useRef(true);
  const editableLabelRef = useRef<View>(null);
  const scrollViewContainer = useRef<View>(null);
  const mainView = useRef<View>(null);
  const input = useRef<TextInput>(null);

  const doENSLookup = useCallback(async () => {
    try {
      const ensName = await doENSReverseLookup(account.address, chainId);
      setEns(ensName);
      // eslint-disable-next-line no-empty
    } catch {}
  }, [account.address, chainId]);

  useEffect(() => {
    const label = renderAccountName(selectedAddress, internalAccounts);
    setAccountLabelState(label);
    if (onRef) {
      onRef({ editableLabelRef, scrollViewContainer, mainView });
    }
    InteractionManager.runAfterInteractions(() => {
      doENSLookup();
    });

    if (!isAccountLabelDefined(label)) {
      Engine.setAccountLabel(selectedAddress, 'Account');
    }

    return () => {
      if (onRef) {
        onRef(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    requestAnimationFrame(() => {
      doENSLookup();
    });
  }, [account.address, chainId, doENSLookup]);

  const openAccountSelector = useCallback(() => {
    if (!onboardingWizard) {
      navigation.navigate(...createAccountSelectorNavDetails({}));
    }
  }, [onboardingWizard, navigation]);

  const setAccountLabelHandler = useCallback(() => {
    const accountWithMatchingToAddress = internalAccounts.find(
      (internalAccount) =>
        toLowerCaseEquals(internalAccount.address, selectedAddress),
    );

    Engine.setAccountLabel(
      selectedAddress,
      isAccountLabelDefined(accountLabel)
        ? accountLabel
        : accountWithMatchingToAddress?.metadata.name ?? '',
    );
    setAccountLabelEditable(false);
  }, [selectedAddress, internalAccounts, accountLabel]);

  const onAccountLabelChange = useCallback((label: string) => {
    setAccountLabelState(label);
  }, []);

  const setAccountLabelEditableHandler = useCallback(() => {
    const label = renderAccountName(selectedAddress, internalAccounts);
    setAccountLabelEditable(true);
    setAccountLabelState(label);
    setTimeout(() => {
      input.current?.focus();
    }, 100);
  }, [selectedAddress, internalAccounts]);

  const copyAccountToClipboard = useCallback(async () => {
    await ClipboardManager.setString(selectedAddress);
    showAlertAction({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: strings('account_details.account_copied_to_clipboard') },
    });
    setTimeout(() => protectWalletModalVisibleAction(), 2000);

    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.WALLET_COPIED_ADDRESS)
        .build(),
    );
  }, [
    selectedAddress,
    showAlertAction,
    protectWalletModalVisibleAction,
    metrics,
  ]);

  const onOpenPortfolio = useCallback(() => {
    const existingPortfolioTab = browserTabs.find((tab) =>
      isPortfolioUrl(tab.url),
    );
    let existingTabId;
    let newTabUrl;
    if (existingPortfolioTab) {
      existingTabId = existingPortfolioTab.id;
    } else {
      newTabUrl = `${AppConstants.PORTFOLIO.URL}/?metamaskEntry=mobile`;
    }
    const params = {
      ...(newTabUrl && { newTabUrl }),
      ...(existingTabId && { existingTabId, newTabUrl: undefined }),
      timestamp: Date.now(),
    };
    navigation.navigate(Routes.BROWSER.HOME, {
      screen: Routes.BROWSER.VIEW,
      params,
    });
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.PORTFOLIO_LINK_CLICKED)
        .addProperties({ portfolioUrl: AppConstants.PORTFOLIO.URL })
        .build(),
    );
  }, [browserTabs, navigation, metrics]);

  const { address, name } = account;

  if (!address) return null;

  const accountLabelTag = getLabelTextByAddress(address);

  return (
    <View ref={scrollViewContainer} collapsable={false}>
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps={'never'}
        style={styles.scrollView}
        contentContainerStyle={styles.wrapper}
      >
        <View style={styles.info} ref={mainView}>
          <TouchableOpacity
            style={styles.identiconBorder}
            disabled={onboardingWizard}
            onPress={openAccountSelector}
            testID={WalletViewSelectorsIDs.ACCOUNT_ICON}
          >
            <Identicon
              address={address}
              diameter={38}
              noFadeIn={onboardingWizard}
            />
          </TouchableOpacity>
          <View
            ref={editableLabelRef}
            style={styles.data}
            collapsable={false}
          >
            {accountLabelEditable ? (
              <TextInput
                style={[
                  styles.label,
                  styles.labelInput,
                  styles.onboardingWizardLabel,
                  onboardingWizard
                    ? { borderColor: colors.primary.default }
                    : { borderColor: colors.background.default },
                ]}
                editable={accountLabelEditable}
                onChangeText={onAccountLabelChange}
                onSubmitEditing={setAccountLabelHandler}
                onBlur={setAccountLabelHandler}
                testID={WalletViewSelectorsIDs.ACCOUNT_NAME_LABEL_INPUT}
                value={accountLabel}
                selectTextOnFocus
                ref={input}
                returnKeyType={'done'}
                autoCapitalize={'none'}
                autoCorrect={false}
                numberOfLines={1}
                placeholderTextColor={colors.text.muted}
                keyboardAppearance={themeAppearance}
              />
            ) : (
              <View style={styles.labelWrapper}>
                <TouchableOpacity onLongPress={setAccountLabelEditableHandler}>
                  <Text
                    style={[
                      styles.label,
                      styles.onboardingWizardLabel,
                      {
                        borderColor: onboardingWizard
                          ? colors.primary.default
                          : colors.background.default,
                      },
                    ]}
                    numberOfLines={1}
                    testID={WalletViewSelectorsIDs.ACCOUNT_NAME_LABEL_TEXT}
                  >
                    {isDefaultAccountName(name) && ens ? ens : name}
                  </Text>
                </TouchableOpacity>
                {accountLabelTag && (
                  <View style={styles.tag}>
                    <Text
                      variant={TextVariant.BodySMBold}
                      style={styles.tagText}
                    >
                      {accountLabelTag}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.addressWrapper}
            onPress={copyAccountToClipboard}
          >
            <EthereumAddress
              address={address}
              style={styles.address}
              type={'short'}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  internalAccounts: selectInternalAccounts(state),
  currentCurrency: selectCurrentCurrency(state),
  chainId: selectChainId(state),
  browserTabs: state.browser.tabs,
});

const mapDispatchToProps = (
  dispatch: (action: unknown) => void,
): DispatchProps => ({
  showAlert: (config) => dispatch(showAlert(config)),
  protectWalletModalVisible: () => dispatch(protectWalletModalVisible()),
  newAssetTransaction: (selectedAsset) =>
    dispatch(newAssetTransaction(selectedAsset)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(AccountOverview));
