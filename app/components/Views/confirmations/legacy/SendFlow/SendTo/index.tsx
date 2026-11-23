import React, { Fragment, PureComponent } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Platform,
  BackHandler,
  TextInput,
} from 'react-native';
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
import { RootState } from '../../../../../../reducers';
import { Theme } from '../../../../../../util/theme/models';

const dummy = () => true;

interface SendFlowState {
  addToAddressToAddressBook?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  errorContinue?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  isFromAddressBook?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  isOnlyWarning?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  toInputHighlighted?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addressError: any;
  balanceIsZero: boolean;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromSelectedAddress: any;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toAccount: any;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toSelectedAddressName: any;
  toSelectedAddressReady: boolean;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toEnsName: any;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toEnsAddressResolved: any;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  confusableCollection: any;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputWidth: any;
  showAmbiguousAcountWarning: boolean;
}

interface SendFlowProps {
  /**
   * Map representing the address book
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addressBook: any;
  /**
   * Network provider chain id
   */
  globalChainId: string;
  /**
   * Object that represents the navigator
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
  /**
   * Start transaction with asset
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newAssetTransaction: (...args: any[]) => any;
  /**
   * Selected address as string
   */
  selectedAddress: string;
  /**
   * List of accounts from the AccountsController
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  internalAccounts: any[];
  /**
   * Current provider ticker
   */
  ticker: string;
  /**
   * Action that sets transaction to and ensRecipient in case is available
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setRecipient: (...args: any[]) => any;
  /**
   * Set selected in transaction state
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelectedAsset: (...args: any[]) => any;
  /**
   * Show alert
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showAlert: (...args: any[]) => any;
  /**
   * Network provider type as mainnet
   */
  providerType: string;
  /**
   * Object that represents the current route info like params passed to it
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route?: any;
  /**
   * Indicates whether the current transaction is a deep link transaction
   */
  isPaymentRequest: boolean;
  /**
   * Boolean that indicates if the network supports buy
   */
  isNativeTokenBuySupported: boolean;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateParentState?: (...args: any[]) => any;
  /**
   * Resets transaction state
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resetTransaction: (...args: any[]) => any;
  /**
   * Boolean to show warning if send to address is on multiple networks
   */
  showAmbiguousAcountWarning?: boolean;
  /**
   * Object of addresses associated with multiple chains {'id': [address: string]}
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ambiguousAddressEntries: any;
  /**
   * Metrics injected by withMetricsAwareness HOC
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metrics: any;
}

/**
 * View that wraps the wraps the "Send" screen
 */
class SendFlow extends PureComponent<SendFlowProps, SendFlowState> {
  addressToInputRef = React.createRef<TextInput>();

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

  updateNavBar = () => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const { navigation, route, resetTransaction } = this.props;
    const colors = (this.context as Theme).colors || mockTheme.colors;
    navigation.setOptions(
      // @ts-expect-error TODO: legacy JS types
      getSendFlowTitle(
        'send.send_to',
        navigation,
        route,
        colors,
        resetTransaction,
      ),
    );
  };

  componentDidMount = async () => {
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
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        this.addressToInputRef &&
          this.addressToInputRef.current &&
          this.addressToInputRef.current.focus();
      }, 500);
    }
    //Fills in to address and sets the transaction if coming from QR code scan
    const targetAddress = route.params?.txMeta?.target_address;
    if (targetAddress) {
      this.props.newAssetTransaction(getEther(ticker));
      this.onToSelectedAddressChange(targetAddress);
    }

    // Disabling back press for not be able to exit the send flow without reseting the transaction object
    // @ts-expect-error TODO: legacy JS types
    this.hardwareBackPress = () => true;
    // @ts-expect-error TODO: legacy JS types
    BackHandler.addEventListener('hardwareBackPress', this.hardwareBackPress);
  };

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      // @ts-expect-error TODO: legacy JS types
      this.hardwareBackPress,
    );
  }

  isAddressSaved = () => {
    const { toAccount } = this.state;
    const { addressBook, globalChainId, internalAccounts } = this.props;
    const networkAddressBook = addressBook[globalChainId] || {};
    const checksummedAddress = toChecksumAddress(toAccount);
    return !!(
      networkAddressBook[checksummedAddress] ||
      internalAccounts.find((account) =>
        toLowerCaseEquals(account.address, checksummedAddress),
      )
    );
  };

  validateToAddress = () => {
    const { toAccount, toEnsAddressResolved } = this.state;
    let addressError;
    if (isENS(toAccount)) {
      if (!toEnsAddressResolved) {
        addressError = strings('transaction.could_not_resolve_ens');
      }
    } else if (!isValidHexAddress(toAccount, { mixedCaseUseChecksum: true })) {
      addressError = strings('transaction.invalid_address');
    }
    this.setState({ addressError });
    return addressError;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleNetworkSwitch = (globalChainId: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      // eslint-disable-next-line @typescript-eslint/no-shadow
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
      let alertMessage;
      // @ts-expect-error TODO: legacy JS types
      switch (e.message) {
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

  onTransactionDirectionSet = async () => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
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

  onToInputFocus = () => {
    const { toInputHighlighted } = this.state;
    this.setState({ toInputHighlighted: !toInputHighlighted });
  };

  goToBuy = () => {
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

  renderBuyEth = () => {
    const colors = (this.context as Theme).colors || mockTheme.colors;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  renderAddressError = (
    addressError: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) =>
    addressError === SYMBOL_ERROR ? (
      <Fragment>
        <Text>{strings('transaction.tokenContractAddressWarning_1')}</Text>
        <Text bold>{strings('transaction.tokenContractAddressWarning_2')}</Text>
        <Text>{strings('transaction.tokenContractAddressWarning_3')}</Text>
      </Fragment>
    ) : (
      addressError
    );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateParentState = (state: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    this.setState({ ...state });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromAccountBalanceState = (value: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    this.setState({ balanceIsZero: value });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFromAddress = (address: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    this.setState({ fromSelectedAddress: address });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAddressNameFromBookOrInternalAccounts = (toAccount: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    const { addressBook, internalAccounts, globalChainId } = this.props;
    if (!toAccount) return;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateAddressOrENSFromInput = async (toAccount: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    const { addressBook, internalAccounts, globalChainId } = this.props;
    const {
      addressError,
      toEnsName,
      addressReady,
      toEnsAddress,
      addToAddressToAddressBook,
      toAddressName,
      errorContinue,
      // @ts-expect-error TODO: legacy JS types
      isOnlyWarning,
      confusableCollection,
    } = await validateAddressOrENS(
      toAccount,
      addressBook,
      internalAccounts,
      // @ts-expect-error TODO: legacy JS types
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onToSelectedAddressChange = (toAccount: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    const currentChain =
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
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

  onIconPress = () => {
    const { navigation } = this.props;
    navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
      screen: Routes.SHEET.AMBIGUOUS_ADDRESS,
    });
  };

  onAmbiguousAcountWarningDismiss = () => {
    this.setState({ showAmbiguousAcountWarning: false });
  };

  render = () => {
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

    const colors = (this.context as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    const checksummedAddress = toAccount && toChecksumAddress(toAccount);
    const existingAddressName = this.getAddressNameFromBookOrInternalAccounts(
      toEnsAddressResolved || toAccount,
    );
    const existingContact =
      checksummedAddress &&
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      addressBook[globalChainId] &&
      addressBook[globalChainId][checksummedAddress];
    const displayConfusableWarning =
      !existingContact && confusableCollection && !!confusableCollection.length;
    const displayAsWarning =
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      confusableCollection &&
      confusableCollection.length &&
      !confusableCollection.some(hasZeroWidthPoints);
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
            isFromAddressBook={existingAddressName?.length > 0}
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
            // @ts-expect-error TODO: legacy JS types
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
                      {explanations.join(', ')}.
                    </Text>
                  </View>
                </View>
              )}
              <AddToAddressBookWrapper
                // eslint-disable-next-line @typescript-eslint/no-shadow
                setToAddressName={(toSelectedAddressName) =>
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

SendFlow.contextType = ThemeContext;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  // eslint-disable-line @typescript-eslint/no-explicit-any
  setRecipient: (
    from: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    to: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    ensRecipient: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    transactionToName: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    transactionFromName: any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
  newAssetTransaction: (
    selectedAsset: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => dispatch(newAssetTransaction(selectedAsset)),
  setSelectedAsset: (
    selectedAsset: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => dispatch(setSelectedAsset(selectedAsset)),
  showAlert: (config: any) => dispatch(showAlert(config)), // eslint-disable-line @typescript-eslint/no-explicit-any
  resetTransaction: () => dispatch(resetTransaction()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  // @ts-expect-error TODO: legacy JS types
)(withMetricsAwareness(SendFlow));
