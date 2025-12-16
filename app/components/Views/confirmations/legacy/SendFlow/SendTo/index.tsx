import React, { Fragment, PureComponent, RefObject } from 'react';
import { View, ScrollView, Alert, Platform, BackHandler, TextInput, NativeEventSubscription } from 'react-native';
import { connect } from 'react-redux';
import { toChecksumAddress } from 'ethereumjs-util';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import AddressList from '../AddressList';
import Text from '../../../../../Base/Text';
import WarningMessage from '../WarningMessage';
import { getSendFlowTitle } from '../../../../../UI/Navbar';
import StyledButton from '../../../../../UI/StyledButton';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import { getDecimalChainId } from '../../../../../../util/networks';
import { handleNetworkSwitch } from '../../../../../../util/networks/handleNetworkSwitch';
import {
  isENS,
  isValidHexAddress,
  validateAddressOrENS,
} from '../../../../../../util/address';
import { getEther, getTicker } from '../../../../../../util/transactions';
import {
  getConfusablesExplanations,
  hasZeroWidthPoints,
} from '../../../../../../util/confusables';
import { mockTheme, ThemeContext } from '../../../../../../util/theme';
import { showAlert } from '../../../../../../actions/alert';
import {
  newAssetTransaction,
  resetTransaction,
  setRecipient,
  setSelectedAsset,
} from '../../../../../../actions/transaction';
import ErrorMessage from '../ErrorMessage';
import { strings } from '../../../../../../../locales/i18n';
import Routes from '../../../../../../constants/navigation/Routes';
import {
  CONTACT_ALREADY_SAVED,
  NetworkSwitchErrorType,
  SYMBOL_ERROR,
} from '../../../../../../constants/error';
import createStyles from './styles';
import generateTestId from '../../../../../../../wdio/utils/generateTestId';
import {
  // Pending updated multichain UX to specify the send chain.
  // eslint-disable-next-line no-restricted-syntax
  selectEvmChainId,
  selectNativeCurrencyByChainId,
  selectProviderTypeByChainId,
} from '../../../../../../selectors/networkController';
import {
  selectInternalAccounts,
  selectSelectedInternalAccountFormattedAddress,
} from '../../../../../../selectors/accountsController';
import AddToAddressBookWrapper from '../../../../../UI/AddToAddressBookWrapper';
import { isNetworkRampNativeTokenSupported } from '../../../../../UI/Ramp/utils';
import { createBuyNavigationDetails } from '../../../../../UI/Ramp/routes/utils';
import { getRampNetworks } from '../../../../../../reducers/fiatOrders';
import SendFlowAddressFrom from '../AddressFrom';
import SendFlowAddressTo from '../AddressTo';
import { includes } from 'lodash';
import { SendViewSelectorsIDs } from '../../../../../../../e2e/selectors/SendFlow/SendView.selectors';
import { withMetricsAwareness } from '../../../../../../components/hooks/useMetrics';
import { toLowerCaseEquals } from '../../../../../../util/general';
import { selectAddressBook } from '../../../../../../selectors/addressBookController';
import { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import { RootState } from '../../../../../../reducers';
import { Dispatch } from 'redux';

const dummy = (): boolean => true;

interface ThemeColors {
  background: {
    default: string;
  };
  text: {
    default: string;
  };
  warning: {
    default: string;
  };
  error: {
    default: string;
  };
}

interface Theme {
  colors: ThemeColors;
}

interface AddressBookEntry {
  name: string;
  address: string;
}

interface InternalAccount {
  address: string;
  metadata: {
    name: string;
  };
}

interface SelectedAsset {
  symbol?: string;
  address?: string;
}

interface AlertConfig {
  isVisible: boolean;
  autodismiss?: number;
  content: string;
  data: {
    msg: string;
  };
}

interface MetricsInterface {
  trackEvent: (event: unknown) => void;
  createEventBuilder: (event: unknown) => {
    addProperties: (props: Record<string, unknown>) => {
      build: () => unknown;
    };
  };
}

interface SendFlowProps {
  addressBook: Record<string, Record<string, AddressBookEntry>>;
  globalChainId: string;
  navigation: NavigationProp<ParamListBase>;
  newAssetTransaction: (asset: unknown) => void;
  selectedAddress: string;
  internalAccounts: InternalAccount[];
  ticker: string;
  setRecipient: (
    from: string,
    to: string,
    ensRecipient: string | undefined,
    transactionToName: string | undefined,
    transactionFromName?: string,
  ) => void;
  setSelectedAsset: (asset: SelectedAsset) => void;
  showAlert: (config: AlertConfig) => void;
  providerType: string;
  route: RouteProp<ParamListBase>;
  isPaymentRequest: boolean;
  isNativeTokenBuySupported: boolean;
  updateParentState?: (state: Partial<SendFlowState>) => void;
  resetTransaction: () => void;
  showAmbiguousAcountWarning?: boolean;
  ambiguousAddressEntries?: Record<string, string[]>;
  metrics: MetricsInterface;
}

interface SendFlowState {
  addressError: string | undefined;
  balanceIsZero: boolean;
  fromSelectedAddress: string;
  toAccount: string | undefined;
  toSelectedAddressName: string | undefined;
  toSelectedAddressReady: boolean;
  toEnsName: string | undefined;
  toEnsAddressResolved: string | undefined;
  confusableCollection: string[];
  inputWidth: { width: string };
  showAmbiguousAcountWarning: boolean;
  toInputHighlighted?: boolean;
  addToAddressToAddressBook?: boolean;
  errorContinue?: boolean;
  isOnlyWarning?: boolean;
  isFromAddressBook?: boolean;
}

interface ConfusableItem {
  point: string;
}

/**
 * View that wraps the wraps the "Send" screen
 */
class SendFlow extends PureComponent<SendFlowProps, SendFlowState> {
  static contextType = ThemeContext;
  declare context: Theme;

  addressToInputRef: RefObject<TextInput> = React.createRef();
  hardwareBackPress: (() => boolean) | null = null;

  state: SendFlowState = {
    addressError: undefined,
    balanceIsZero: false,
    fromSelectedAddress: this.props.selectedAddress,
    toAccount: undefined,
    toSelectedAddressName: undefined,
    toSelectedAddressReady: false,
    toEnsName: undefined,
    toEnsAddressResolved: undefined,
    confusableCollection: [],
    inputWidth: { width: '99%' },
    showAmbiguousAcountWarning: false,
  };

  updateNavBar = (): void => {
    const { navigation, route, resetTransaction } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    navigation.setOptions(
      getSendFlowTitle(
        'send.send_to',
        navigation,
        route,
        colors,
        resetTransaction,
      ),
    );
  };

  componentDidMount = async (): Promise<void> => {
    const {
      addressBook,
      ticker,
      globalChainId,
      navigation,
      providerType,
      route,
      isPaymentRequest,
    } = this.props;
    this.updateNavBar();
    // For analytics
    navigation.setParams({ providerType, isPaymentRequest });
    const networkAddressBook = addressBook[globalChainId] || {};
    if (!Object.keys(networkAddressBook).length) {
      setTimeout(() => {
        this.addressToInputRef &&
          this.addressToInputRef.current &&
          this.addressToInputRef.current.focus();
      }, 500);
    }
    //Fills in to address and sets the transaction if coming from QR code scan
    const routeParams = route.params as { txMeta?: { target_address?: string } } | undefined;
    const targetAddress = routeParams?.txMeta?.target_address;
    if (targetAddress) {
      this.props.newAssetTransaction(getEther(ticker));
      this.onToSelectedAddressChange(targetAddress);
    }

    // Disabling back press for not be able to exit the send flow without reseting the transaction object
    this.hardwareBackPress = () => true;
    BackHandler.addEventListener('hardwareBackPress', this.hardwareBackPress);
  };

  componentDidUpdate = (): void => {
    this.updateNavBar();
  };

  componentWillUnmount(): void {
    if (this.hardwareBackPress) {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.hardwareBackPress,
      );
    }
  }

  isAddressSaved = (): boolean => {
    const { toAccount } = this.state;
    const { addressBook, globalChainId, internalAccounts } = this.props;
    const networkAddressBook = addressBook[globalChainId] || {};
    if (!toAccount) return false;
    const checksummedAddress = toChecksumAddress(toAccount);
    return !!(
      networkAddressBook[checksummedAddress] ||
      internalAccounts.find((account) =>
        toLowerCaseEquals(account.address, checksummedAddress),
      )
    );
  };

  validateToAddress = (): string | undefined => {
    const { toAccount, toEnsAddressResolved } = this.state;
    let addressError: string | undefined;
    if (toAccount && isENS(toAccount)) {
      if (!toEnsAddressResolved) {
        addressError = strings('transaction.could_not_resolve_ens');
      }
    } else if (toAccount && !isValidHexAddress(toAccount, { mixedCaseUseChecksum: true })) {
      addressError = strings('transaction.invalid_address');
    }
    this.setState({ addressError });
    return addressError;
  };

  handleNetworkSwitch = (globalChainId: string): void => {
    try {
      const { showAlert } = this.props;
      const networkName = handleNetworkSwitch(globalChainId);

      if (!networkName) return;

      showAlert({
        isVisible: true,
        autodismiss: 5000,
        content: 'clipboard-alert',
        data: {
          msg: strings('send.warn_network_change') + networkName,
        },
      });
    } catch (e) {
      let alertMessage: string;
      switch ((e as Error).message) {
        case NetworkSwitchErrorType.missingNetworkId:
          alertMessage = strings('send.network_missing_id');
          break;
        default:
          alertMessage = strings('send.network_not_found_description', {
            chain_id: getDecimalChainId(globalChainId),
          });
      }
      Alert.alert(strings('send.network_not_found_title'), alertMessage);
    }
  };

  onTransactionDirectionSet = async (): Promise<void> => {
    const { setRecipient, navigation, providerType } = this.props;
    const {
      fromSelectedAddress,
      toAccount,
      toEnsName,
      toSelectedAddressName,
      toEnsAddressResolved,
    } = this.state;
    if (!this.isAddressSaved()) {
      const addressError = this.validateToAddress();
      if (addressError) return;
    }

    const toAddress = toEnsAddressResolved || toAccount;
    if (!toAddress) return;
    
    setRecipient(
      fromSelectedAddress,
      toAddress,
      toEnsName,
      toSelectedAddressName,
    );
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.SEND_FLOW_ADDS_RECIPIENT)
        .addProperties({
          network: providerType,
        })
        .build(),
    );

    navigation.navigate('Amount');
  };

  onToInputFocus = (): void => {
    const { toInputHighlighted } = this.state;
    this.setState({ toInputHighlighted: !toInputHighlighted });
  };

  goToBuy = (): void => {
    this.props.navigation.navigate(...createBuyNavigationDetails());

    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.BUY_BUTTON_CLICKED)
        .addProperties({
          button_location: 'Send Flow warning',
          button_copy: 'Buy Native Token',
          chain_id_destination: this.props.globalChainId,
        })
        .build(),
    );
  };

  renderBuyEth = (): React.ReactNode => {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (!this.props.isNativeTokenBuySupported) {
      return null;
    }

    return (
      <>
        <Text> </Text>
        <Text reset bold link underline onPress={this.goToBuy}>
          {strings('fiat_on_ramp_aggregator.token_marketplace')}.
        </Text>
        <Text reset>
          {'\n'}
          {strings('transaction.you_can_also_send_funds')}
        </Text>
      </>
    );
  };

  renderAddressError = (addressError: string): React.ReactNode =>
    addressError === SYMBOL_ERROR ? (
      <Fragment>
        <Text>{strings('transaction.tokenContractAddressWarning_1')}</Text>
        <Text bold>{strings('transaction.tokenContractAddressWarning_2')}</Text>
        <Text>{strings('transaction.tokenContractAddressWarning_3')}</Text>
      </Fragment>
    ) : (
      addressError
    );

  updateParentState = (state: Partial<SendFlowState>): void => {
    this.setState({ ...this.state, ...state });
  };

  fromAccountBalanceState = (value: boolean): void => {
    this.setState({ balanceIsZero: value });
  };

  setFromAddress = (address: string): void => {
    this.setState({ fromSelectedAddress: address });
  };

  getAddressNameFromBookOrInternalAccounts = (toAccount: string | undefined): string | null => {
    const { addressBook, internalAccounts, globalChainId } = this.props;
    if (!toAccount) return null;

    const networkAddressBook = addressBook[globalChainId] || {};

    const checksummedAddress = toChecksumAddress(toAccount);
    const matchingAccount = internalAccounts.find((account) =>
      toLowerCaseEquals(account.address, checksummedAddress),
    );

    return networkAddressBook[checksummedAddress]
      ? networkAddressBook[checksummedAddress].name
      : matchingAccount
      ? matchingAccount.metadata.name
      : null;
  };

  validateAddressOrENSFromInput = async (toAccount: string): Promise<void> => {
    const { addressBook, internalAccounts, globalChainId } = this.props;
    const {
      addressError,
      toEnsName,
      addressReady,
      toEnsAddress,
      addToAddressToAddressBook,
      toAddressName,
      errorContinue,
      isOnlyWarning,
      confusableCollection,
    } = await validateAddressOrENS(
      toAccount,
      addressBook,
      internalAccounts,
      globalChainId,
    );

    this.setState({
      addressError,
      toEnsName,
      toSelectedAddressReady: addressReady,
      toEnsAddressResolved: toEnsAddress,
      addToAddressToAddressBook,
      toSelectedAddressName: toAddressName,
      errorContinue,
      isOnlyWarning,
      confusableCollection,
    });
  };

  onToSelectedAddressChange = (toAccount: string): void => {
    const currentChain =
      this.props.ambiguousAddressEntries &&
      this.props.ambiguousAddressEntries[this.props.globalChainId];
    const isAmbiguousAddress = includes(currentChain, toAccount);
    if (isAmbiguousAddress) {
      this.setState({ showAmbiguousAcountWarning: isAmbiguousAddress });
      this.props.metrics.trackEvent(
        this.props.metrics
          .createEventBuilder(
            MetaMetricsEvents.SEND_FLOW_SELECT_DUPLICATE_ADDRESS,
          )
          .addProperties({
            chain_id: getDecimalChainId(this.props.globalChainId),
          })
          .build(),
      );
    }
    const addressName =
      this.getAddressNameFromBookOrInternalAccounts(toAccount);

    /**
     * If the address is from addressBook or identities
     * then validation is not necessary since it was already validated
     */
    if (addressName) {
      this.setState({
        toAccount,
        toSelectedAddressReady: true,
        isFromAddressBook: true,
        toSelectedAddressName: addressName,
      });
    } else {
      this.validateAddressOrENSFromInput(toAccount);
      /**
       * Because validateAddressOrENSFromInput is an asynchronous function
       * we are setting the state here synchronously, so it does not block the UI
       * */
      this.setState({
        toAccount,
        isFromAddressBook: false,
      });
    }
  };

  onIconPress = (): void => {
    const { navigation } = this.props;
    navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
      screen: Routes.SHEET.AMBIGUOUS_ADDRESS,
    });
  };

  onAmbiguousAcountWarningDismiss = (): void => {
    this.setState({ showAmbiguousAcountWarning: false });
  };

  render = (): React.ReactNode => {
    const { ticker, addressBook, globalChainId } = this.props;
    const {
      toAccount,
      toSelectedAddressReady,
      toSelectedAddressName,
      addressError,
      balanceIsZero,
      inputWidth,
      errorContinue,
      isOnlyWarning,
      confusableCollection,
      toEnsAddressResolved,
    } = this.state;

    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    const checksummedAddress = toAccount && toChecksumAddress(toAccount);
    const existingAddressName = this.getAddressNameFromBookOrInternalAccounts(
      toEnsAddressResolved || toAccount,
    );
    const existingContact =
      checksummedAddress &&
      addressBook[globalChainId] &&
      addressBook[globalChainId][checksummedAddress];
    const displayConfusableWarning =
      !existingContact && confusableCollection && !!confusableCollection.length;
    const displayAsWarning =
      confusableCollection &&
      confusableCollection.length &&
      !confusableCollection.some((item) => hasZeroWidthPoints(item));
    const explanations =
      displayConfusableWarning &&
      getConfusablesExplanations(confusableCollection);

    return (
      <SafeAreaView
        edges={['bottom']}
        style={styles.wrapper}
        {...generateTestId(Platform, SendViewSelectorsIDs.CONTAINER_ID)}
      >
        <View style={styles.imputWrapper}>
          <SendFlowAddressFrom
            chainId={globalChainId}
            fromAccountBalanceState={this.fromAccountBalanceState}
            setFromAddress={this.setFromAddress}
          />
          <SendFlowAddressTo
            inputRef={this.addressToInputRef}
            addressToReady={toSelectedAddressReady}
            toSelectedAddress={toEnsAddressResolved || toAccount}
            updateParentState={this.updateParentState}
            toSelectedAddressName={toSelectedAddressName}
            onSubmit={this.onTransactionDirectionSet}
            inputWidth={inputWidth}
            confusableCollectionArray={
              (!existingContact && confusableCollection) || []
            }
            isFromAddressBook={(existingAddressName?.length ?? 0) > 0}
            onToSelectedAddressChange={this.onToSelectedAddressChange}
            highlighted={false}
          />
        </View>

        {!toSelectedAddressReady && !!toAccount && (
          <View style={styles.warningContainer}>
            <WarningMessage
              warningMessage={
                toAccount.substring(0, 2) === '0x'
                  ? strings('transaction.address_invalid')
                  : strings('transaction.ens_not_found')
              }
            />
          </View>
        )}

        {!toSelectedAddressReady ? (
          <AddressList
            chainId={globalChainId}
            inputSearch={toAccount}
            onIconPress={this.onIconPress}
            onAccountPress={this.onToSelectedAddressChange}
            onAccountLongPress={dummy}
          />
        ) : (
          <View style={styles.nextActionWrapper}>
            <ScrollView>
              {addressError && addressError !== CONTACT_ALREADY_SAVED && (
                <View
                  style={styles.addressErrorWrapper}
                  testID={SendViewSelectorsIDs.ADDRESS_ERROR}
                >
                  <ErrorMessage
                    errorMessage={this.renderAddressError(addressError)}
                    errorContinue={!!errorContinue}
                    onContinue={this.onTransactionDirectionSet}
                    isOnlyWarning={!!isOnlyWarning}
                  />
                </View>
              )}
              {displayConfusableWarning && (
                <View
                  style={[
                    styles.confusabeError,
                    displayAsWarning && styles.confusabeWarning,
                  ]}
                >
                  <View style={styles.warningIcon}>
                    <Icon
                      size={16}
                      color={
                        displayAsWarning
                          ? colors.warning.default
                          : colors.error.default
                      }
                      name="exclamation-triangle"
                    />
                  </View>
                  <View>
                    <Text style={styles.confusableTitle}>
                      {strings('transaction.confusable_title')}
                    </Text>
                    <Text style={styles.confusableMsg}>
                      {strings('transaction.confusable_msg')}{' '}
                      {explanations && explanations.join(', ')}.
                    </Text>
                  </View>
                </View>
              )}
              <AddToAddressBookWrapper
                setToAddressName={(toSelectedAddressName: string) =>
                  this.setState({ toSelectedAddressName })
                }
                address={toEnsAddressResolved || toAccount}
                defaultNull
              >
                <Text
                  style={styles.myAccountsText}
                  testID={SendViewSelectorsIDs.ADD_ADDRESS_BUTTON}
                >
                  {strings('address_book.add_this_address')}
                </Text>
              </AddToAddressBookWrapper>
              {balanceIsZero && (
                <View style={styles.warningContainer}>
                  <WarningMessage
                    warningMessage={
                      <>
                        {strings('transaction.not_enough_for_gas', {
                          ticker: getTicker(ticker),
                        })}

                        {this.renderBuyEth()}
                      </>
                    }
                  />
                </View>
              )}
              {this.state.showAmbiguousAcountWarning && (
                <View style={styles.warningContainer}>
                  <WarningMessage
                    onDismiss={this.onAmbiguousAcountWarningDismiss}
                    warningMessage={<>{strings('duplicate_address.body')}</>}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {!errorContinue && (
          <View
            style={styles.footerContainer}
            testID={SendViewSelectorsIDs.NO_ETH_MESSAGE}
          >
            {!errorContinue && (
              <View style={styles.buttonNextWrapper}>
                <StyledButton
                  type={'confirm'}
                  containerStyle={styles.buttonNext}
                  onPress={this.onTransactionDirectionSet}
                  testID={SendViewSelectorsIDs.ADDRESS_BOOK_NEXT_BUTTON}
                  //To selectedAddressReady needs to be calculated on this component, needing a bigger refactor
                  //Will be here just to ensure that we don't break existing conditions
                  disabled={
                    !(
                      (isValidHexAddress(toEnsAddressResolved) ||
                        isValidHexAddress(toAccount)) &&
                      toSelectedAddressReady
                    )
                  }
                >
                  {strings('address_book.next')}
                </StyledButton>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    );
  };
}

const mapStateToProps = (state: RootState) => {
  const globalChainId = selectEvmChainId(state);

  return {
    addressBook: selectAddressBook(state),
    globalChainId,
    selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
    selectedAsset: state.transaction.selectedAsset,
    internalAccounts: selectInternalAccounts(state),
    ticker: selectNativeCurrencyByChainId(state, globalChainId),
    providerType: selectProviderTypeByChainId(state, globalChainId),
    isPaymentRequest: state.transaction.paymentRequest,
    isNativeTokenBuySupported: isNetworkRampNativeTokenSupported(
      globalChainId,
      getRampNetworks(state),
    ),
    ambiguousAddressEntries: state.user.ambiguousAddressEntries,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setRecipient: (
    from: string,
    to: string,
    ensRecipient: string | undefined,
    transactionToName: string | undefined,
    transactionFromName?: string,
  ) =>
    dispatch(
      setRecipient(
        from,
        to,
        ensRecipient,
        transactionToName,
        transactionFromName,
      ),
    ),
  newAssetTransaction: (selectedAsset: unknown) =>
    dispatch(newAssetTransaction(selectedAsset)),
  setSelectedAsset: (selectedAsset: SelectedAsset) =>
    dispatch(setSelectedAsset(selectedAsset)),
  showAlert: (config: AlertConfig) => dispatch(showAlert(config)),
  resetTransaction: () => dispatch(resetTransaction()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(SendFlow));
