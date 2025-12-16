import React, { PureComponent, RefObject } from 'react';
import { fontStyles } from '../../../../../../styles/common';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  FlatList,
  InteractionManager,
  ScrollView,
  ListRenderItemInfo,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { connect } from 'react-redux';
import {
  setSelectedAsset,
  prepareTransaction,
  setTransactionObject,
  resetTransaction,
  setMaxValueMode,
} from '../../../../../../actions/transaction';
import { getSendFlowTitle } from '../../../../../UI/Navbar';
import StyledButton from '../../../../../UI/StyledButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from 'react-native-modal';
import TokenImage from '../../../../../UI/TokenImage';
import {
  renderFromTokenMinimalUnit,
  balanceToFiat,
  renderFromWei,
  weiToFiat,
  fromWei,
  toWei,
  isDecimal,
  toTokenMinimalUnit,
  fiatNumberToWei,
  fiatNumberToTokenMinimalUnit,
  weiToFiatNumber,
  balanceToFiatNumber,
  getCurrencySymbol,
  handleWeiNumber,
  fromTokenMinimalUnitString,
  toHexadecimal,
  hexToBN,
  formatValueToMatchTokenDecimals,
} from '../../../../../../util/number';
import {
  getTicker,
  generateTransferData,
  getEther,
  calculateEIP1559GasFeeHexes,
} from '../../../../../../util/transactions';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import { BNToHex } from '@metamask/controller-utils';
import ErrorMessage from '../ErrorMessage';
import { getGasLimit } from '../../../../../../util/custom-gas';
import Engine from '../../../../../../core/Engine';
import CollectibleMedia from '../../../../../UI/CollectibleMedia';
import collectiblesTransferInformation from '../../../../../../util/collectibles-transfer';
import { strings } from '../../../../../../../locales/i18n';
import Device from '../../../../../../util/device';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import dismissKeyboard from 'react-native/Libraries/Utilities/dismissKeyboard';
import NetworkMainAssetLogo from '../../../../../UI/NetworkMainAssetLogo';
import { renderShortText } from '../../../../../../util/general';
import { SafeAreaView } from 'react-native-safe-area-context';
import { decGWEIToHexWEI } from '../../../../../../util/conversions';
import AppConstants from '../../../../../../core/AppConstants';
import {
  collectibleContractsSelector,
  collectiblesSelector,
} from '../../../../../../reducers/collectibles';
import { gte } from '../../../../../../util/lodash';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import Alert, { AlertType } from '../../../../../Base/Alert';

import {
  selectConversionRateByChainId,
  selectCurrentCurrency,
} from '../../../../../../selectors/currencyRateController';
import { selectTokens } from '../../../../../../selectors/tokensController';
import { selectAccounts } from '../../../../../../selectors/accountTrackerController';
import { selectContractBalances } from '../../../../../../selectors/tokenBalancesController';
import { selectSelectedInternalAccountFormattedAddress } from '../../../../../../selectors/accountsController';
import Routes from '../../../../../../constants/navigation/Routes';
import { getRampNetworks } from '../../../../../../reducers/fiatOrders';
import { swapsLivenessSelector } from '../../../../../../reducers/swaps';
import { isSwapsAllowed } from '../../../../../UI/Swaps/utils';
import { swapsUtils } from '@metamask/swaps-controller';
import { regex } from '../../../../../../util/regex';
import { AmountViewSelectorsIDs } from '../../../../../../../e2e/selectors/SendFlow/AmountView.selectors';
import { isNetworkRampNativeTokenSupported } from '../../../../../../components/UI/Ramp/utils';
import { addTransaction } from '../../../../../../util/transaction-controller';
import { withMetricsAwareness } from '../../../../../../components/hooks/useMetrics';
import { selectGasFeeEstimates } from '../../../../../../selectors/confirmTransaction';
import { selectGasFeeControllerEstimateType } from '../../../../../../selectors/gasFeeController';
import { createBuyNavigationDetails } from '../../../../../UI/Ramp/routes/utils';
import {
  selectEvmChainId,
  selectNetworkClientId,
  selectNativeCurrencyByChainId,
  selectProviderTypeByChainId,
} from '../../../../../../selectors/networkController';
import { selectContractExchangeRatesByChainId } from '../../../../../../selectors/tokenRatesController';
import { isNativeToken } from '../../../utils/generic';
import { selectConfirmationRedesignFlags } from '../../../../../../selectors/featureFlagController/confirmations';
import { MMM_ORIGIN } from '../../../constants/confirmations';
import { RootState } from '../../../../../../reducers';
import { Dispatch } from 'redux';
import { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import BN from 'bnjs4';

const KEYBOARD_OFFSET = Device.isSmallDevice() ? 80 : 120;

interface ThemeColors {
  background: {
    default: string;
  };
  text: {
    default: string;
    alternative: string;
    muted: string;
  };
  primary: {
    default: string;
    inverse: string;
  };
  border: {
    default: string;
    muted: string;
  };
  error: {
    default: string;
    muted: string;
  };
  warning: {
    default: string;
  };
  overlay: {
    default: string;
  };
}

interface Styles {
  wrapper: ViewStyle;
  scrollWrapper: ViewStyle;
  buttonNextWrapper: ViewStyle;
  buttonNext: ViewStyle;
  inputWrapper: ViewStyle;
  actionsWrapper: ViewStyle;
  action: ViewStyle;
  actionBorder: ViewStyle;
  actionDropdown: ViewStyle;
  textDropdown: TextStyle;
  iconDropdown: ViewStyle;
  maxText: TextStyle;
  actionMax: ViewStyle;
  actionMaxTouchable: ViewStyle;
  inputContainerWrapper: ViewStyle;
  inputContainer: ViewStyle;
  inputCurrencyText: TextStyle;
  textInput: TextStyle;
  switch: ViewStyle;
  actionSwitch: ViewStyle;
  textSwitch: TextStyle;
  switchWrapper: ViewStyle;
  bottomModal: ViewStyle;
  tokenImage: ViewStyle;
  assetElementWrapper: ViewStyle;
  assetElement: ViewStyle;
  assetsModalWrapper: ViewStyle;
  titleWrapper: ViewStyle;
  dragger: ViewStyle;
  textAssetTitle: TextStyle;
  assetInformationWrapper: ViewStyle;
  assetBalanceWrapper: ViewStyle;
  textAssetBalance: TextStyle;
  textAssetFiat: TextStyle;
  errorMessageWrapper: ViewStyle;
  errorBuyWrapper: ViewStyle;
  CollectibleMedia: ViewStyle;
  collectibleName: TextStyle;
  collectibleId: TextStyle;
  collectibleInputWrapper: ViewStyle;
  collectibleInputImageWrapper: ViewStyle;
  collectibleInputInformationWrapper: ViewStyle;
  nextActionWrapper: ViewStyle;
  balanceWrapper: ViewStyle;
  balanceText: TextStyle;
  warningTextContainer: ViewStyle;
  warningText: TextStyle;
  warningContainer: ViewStyle;
  swapOrBuyButton: ViewStyle;
  error: TextStyle;
  underline: TextStyle;
  arrow?: ViewStyle;
}

const createStyles = (colors: ThemeColors): Styles =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    scrollWrapper: {
      marginBottom: 60,
    },
    buttonNextWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    buttonNext: {
      flex: 1,
      marginHorizontal: 24,
    },
    inputWrapper: {
      flex: 1,
      marginTop: 30,
      marginHorizontal: 24,
    },
    actionsWrapper: {
      flexDirection: 'row',
    },
    action: {
      flex: 1,
      alignItems: 'center',
    },
    actionBorder: {
      flex: 0.8,
    },
    actionDropdown: {
      ...fontStyles.normal,
      backgroundColor: colors.primary.default,
      paddingHorizontal: 16,
      paddingVertical: 2,
      borderRadius: 100,
      flexDirection: 'row',
      alignItems: 'center',
    },
    textDropdown: {
      ...fontStyles.normal,
      fontSize: 14,
      color: colors.primary.inverse,
      paddingVertical: 2,
    },
    iconDropdown: {
      paddingLeft: 10,
    },
    maxText: {
      ...fontStyles.normal,
      fontSize: 12,
      color: colors.primary.default,
      alignSelf: 'flex-end',
      textTransform: 'uppercase',
    },
    actionMax: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    actionMaxTouchable: {},
    inputContainerWrapper: {
      marginVertical: 16,
      alignItems: 'center',
    },
    inputContainer: {
      flexDirection: 'row',
    },
    inputCurrencyText: {
      ...fontStyles.light,
      color: colors.text.default,
      fontSize: 44,
      marginRight: 8,
      paddingVertical: Device.isIos() ? 0 : 8,
      justifyContent: 'center',
      alignItems: 'center',
      textTransform: 'uppercase',
    },
    textInput: {
      ...fontStyles.light,
      fontSize: 44,
      textAlign: 'center',
      color: colors.text.default,
    },
    switch: {
      flex: 1,
      marginTop: Device.isIos() ? 0 : 2,
    },
    actionSwitch: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      flexDirection: 'row',
      borderColor: colors.text.alternative,
      borderWidth: 1,
      right: -2,
    },
    textSwitch: {
      ...fontStyles.normal,
      fontSize: 14,
      color: colors.text.alternative,
      textTransform: 'uppercase',
    },
    switchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bottomModal: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    tokenImage: {
      width: 36,
      height: 36,
      overflow: 'hidden',
    },
    assetElementWrapper: {
      height: 70,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.muted,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    assetElement: {
      flexDirection: 'row',
      flex: 1,
    },
    assetsModalWrapper: {
      backgroundColor: colors.background.default,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      height: 450,
    },
    titleWrapper: {
      width: '100%',
      height: 33,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.muted,
    },
    dragger: {
      width: 48,
      height: 5,
      borderRadius: 4,
      backgroundColor: colors.border.default,
    },
    textAssetTitle: {
      ...fontStyles.normal,
      fontSize: 18,
      color: colors.text.default,
    },
    assetInformationWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginLeft: 16,
    },
    assetBalanceWrapper: {
      flexDirection: 'column',
    },
    textAssetBalance: {
      ...fontStyles.normal,
      fontSize: 18,
      textAlign: 'right',
      color: colors.text.default,
    },
    textAssetFiat: {
      ...fontStyles.normal,
      fontSize: 12,
      color: colors.text.alternative,
      textAlign: 'right',
      textTransform: 'uppercase',
    },
    errorMessageWrapper: {
      marginVertical: 16,
    },
    errorBuyWrapper: {
      marginHorizontal: 24,
      marginTop: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.error.muted,
      borderColor: colors.error.default,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    CollectibleMedia: {
      width: 120,
      height: 120,
    },
    collectibleName: {
      ...fontStyles.normal,
      fontSize: 32,
      color: colors.text.alternative,
      textAlign: 'center',
    },
    collectibleId: {
      ...fontStyles.normal,
      fontSize: 14,
      color: colors.text.alternative,
      marginTop: 8,
      textAlign: 'center',
    },
    collectibleInputWrapper: {
      margin: 24,
    },
    collectibleInputImageWrapper: {
      flexDirection: 'column',
      alignItems: 'center',
    },
    collectibleInputInformationWrapper: {
      marginTop: 12,
    },
    nextActionWrapper: {
      flex: 1,
      marginBottom: 16,
    },
    balanceWrapper: {
      marginVertical: 16,
    },
    balanceText: {
      ...fontStyles.normal,
      alignSelf: 'center',
      fontSize: 12,
      lineHeight: 16,
      color: colors.text.default,
    },
    warningTextContainer: {
      lineHeight: 20,
      paddingLeft: 10,
      paddingRight: 10,
    },
    warningText: {
      lineHeight: 20,
      color: colors.text.default,
    },
    warningContainer: {
      marginTop: 20,
      marginHorizontal: 20,
    },
    swapOrBuyButton: { width: '100%', marginTop: 16 },
    error: {
      color: colors.text.default,
      fontSize: 12,
      lineHeight: 16,
      ...fontStyles.normal,
      textAlign: 'center',
    },
    underline: {
      textDecorationLine: 'underline',
      ...fontStyles.bold,
    },
  });

interface Theme {
  colors: ThemeColors;
  themeAppearance?: string;
}

interface AccountInfo {
  balance: string;
}

interface TokenAsset {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
  tokenId?: string;
  image?: string;
  isETH?: boolean;
}

interface CollectibleAsset {
  address: string;
  tokenId: string;
  name?: string;
  image?: string;
  standard?: string;
}

interface CollectibleContract {
  address: string;
  name: string;
  logo?: string;
}

interface TransactionState {
  transaction: {
    from?: string;
    to?: string;
    data?: string;
    value?: string | BN;
  };
  transactionTo?: string;
  selectedAsset?: TokenAsset | CollectibleAsset;
  readableValue?: string;
  isPaymentRequest?: boolean;
}

interface GasFeeEstimates {
  estimatedBaseFee?: string;
  gasPrice?: string;
  low?: { suggestedMaxPriorityFeePerGas: string; suggestedMaxFeePerGas: string };
  medium?: { suggestedMaxPriorityFeePerGas: string; suggestedMaxFeePerGas: string };
  high?: { suggestedMaxPriorityFeePerGas: string; suggestedMaxFeePerGas: string };
  [key: string]: unknown;
}

interface ContractExchangeRate {
  price?: number;
}

interface MetricsInterface {
  trackEvent: (event: unknown) => void;
  createEventBuilder: (event: unknown) => {
    addProperties: (props: Record<string, unknown>) => {
      build: () => unknown;
    };
    build: () => unknown;
  };
}

interface AmountProps {
  accounts: Record<string, AccountInfo>;
  collectibles: CollectibleAsset[];
  collectibleContracts: CollectibleContract[];
  contractBalances: Record<string, string>;
  conversionRate: number;
  currentCurrency: string;
  contractExchangeRates: Record<string, ContractExchangeRate>;
  navigation: NavigationProp<ParamListBase>;
  route: RouteProp<ParamListBase, string>;
  selectedAddress: string;
  tokens: TokenAsset[];
  ticker: string;
  setSelectedAsset: (asset: TokenAsset | CollectibleAsset) => void;
  prepareTransaction: (transaction: Record<string, unknown>) => void;
  primaryCurrency: string;
  selectedAsset: TokenAsset | CollectibleAsset;
  transactionState: TransactionState;
  providerType: string;
  onConfirm?: () => void;
  isPaymentRequest?: boolean;
  resetTransaction: () => void;
  isNetworkBuyNativeTokenSupported: boolean;
  swapsIsLive: boolean;
  globalChainId: string;
  metrics: MetricsInterface;
  gasFeeEstimates: GasFeeEstimates;
  gasEstimateType: string;
  setMaxValueMode: (maxValueMode: boolean) => void;
  globalNetworkClientId: string;
  isRedesignedTransferConfirmationEnabled: boolean;
}

interface AmountState {
  amountError: string | undefined;
  inputValue: string | undefined;
  inputValueConversion: string | undefined;
  renderableInputValueConversion: string | undefined;
  assetsModalVisible: boolean;
  internalPrimaryCurrencyIsCrypto: boolean;
  estimatedTotalGas: BN | undefined;
  hasExchangeRate: boolean;
  isRedesignedTransferTransactionLoading: boolean;
  currentBalance?: string;
  maxFiatInput?: string;
}

/**
 * View that wraps the wraps the "Send" screen
 */
class Amount extends PureComponent<AmountProps, AmountState> {
  static contextType = ThemeContext;
  declare context: Theme;

  amountInput: RefObject<TextInput> = React.createRef();
  tokens: TokenAsset[] = [];
  collectibles: CollectibleAsset[] = [];

  state: AmountState = {
    amountError: undefined,
    inputValue: undefined,
    inputValueConversion: undefined,
    renderableInputValueConversion: undefined,
    assetsModalVisible: false,
    internalPrimaryCurrencyIsCrypto: this.props.primaryCurrency === 'ETH',
    estimatedTotalGas: undefined,
    hasExchangeRate: false,
    isRedesignedTransferTransactionLoading: false,
  };

  updateNavBar = (): void => {
    const { navigation, route, resetTransaction } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    navigation.setOptions(
      getSendFlowTitle(
        'send.amount',
        navigation,
        route,
        colors,
        resetTransaction,
      ),
    );
  };

  componentDidMount = async (): Promise<void> => {
    const {
      tokens,
      ticker,
      transactionState: { readableValue },
      navigation,
      providerType,
      selectedAsset,
      isPaymentRequest,
      gasEstimateType,
      gasFeeEstimates,
    } = this.props;
    // For analytics
    this.updateNavBar();
    navigation.setParams({ providerType, isPaymentRequest });

    this.tokens = [getEther(ticker), ...tokens];
    this.collectibles = this.processCollectibles();
    // Wait until navigation finishes to focus
    InteractionManager.runAfterInteractions(() =>
      this.amountInput?.current?.focus?.(),
    );
    this.onInputChange(readableValue);
    !(selectedAsset as CollectibleAsset).tokenId && this.handleSelectedAssetBalance(selectedAsset as TokenAsset);

    const [gas] = await Promise.all([this.estimateGasLimit()]);

    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      const mediumGasFeeEstimates =
        gasFeeEstimates[AppConstants.GAS_OPTIONS.MEDIUM] as { suggestedMaxPriorityFeePerGas: string; suggestedMaxFeePerGas: string };
      const estimatedBaseFeeHex = decGWEIToHexWEI(
        gasFeeEstimates.estimatedBaseFee || '0',
      );
      const suggestedMaxPriorityFeePerGasHex = decGWEIToHexWEI(
        mediumGasFeeEstimates.suggestedMaxPriorityFeePerGas,
      );
      const suggestedMaxFeePerGasHex = decGWEIToHexWEI(
        mediumGasFeeEstimates.suggestedMaxFeePerGas,
      );
      const gasLimitHex = BNToHex(gas);
      const gasHexes = calculateEIP1559GasFeeHexes({
        gasLimitHex,
        estimatedBaseFeeHex,
        suggestedMaxFeePerGasHex,
        suggestedMaxPriorityFeePerGasHex,
      });
      this.setState({
        estimatedTotalGas: hexToBN(gasHexes.gasFeeMaxHex),
      });
    } else if (gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
      const gasPrice = hexToBN(
        decGWEIToHexWEI(gasFeeEstimates[AppConstants.GAS_OPTIONS.MEDIUM] as string),
      );
      this.setState({ estimatedTotalGas: gas.mul(gasPrice) });
    } else {
      const gasPrice = hexToBN(decGWEIToHexWEI(gasFeeEstimates.gasPrice || '0'));
      this.setState({ estimatedTotalGas: gas.mul(gasPrice) });
    }

    const hasExchangeRate = this.hasExchangeRate();
    let internalPrimaryCurrencyIsCrypto =
      this.state.internalPrimaryCurrencyIsCrypto;

    // Default to crypto if exchange rate is not available while on Fiat primary currency
    if (this.props.primaryCurrency === 'Fiat' && !hasExchangeRate) {
      internalPrimaryCurrencyIsCrypto = true;
    }

    this.setState({
      inputValue: readableValue,
      internalPrimaryCurrencyIsCrypto,
      hasExchangeRate,
    });
  };

  componentDidUpdate = (): void => {
    this.updateNavBar();
  };

  hasExchangeRate = (): boolean => {
    const { selectedAsset, conversionRate, contractExchangeRates } = this.props;

    if (isNativeToken(selectedAsset)) {
      return !!conversionRate;
    }
    const exchangeRate =
      contractExchangeRates?.[(selectedAsset as TokenAsset).address]?.price ?? null;
    return !!exchangeRate;
  };

  /**
   * Method to validate collectible ownership.
   *
   * @returns Promise that resolves ownershio as a boolean.
   */
  validateCollectibleOwnership = async (): Promise<boolean> => {
    const { NftController } = Engine.context;
    const {
      transactionState: {
        selectedAsset,
      },
      selectedAddress,
    } = this.props;
    const { address, tokenId } = selectedAsset as CollectibleAsset;
    try {
      return await NftController.isNftOwner(selectedAddress, address, tokenId);
    } catch (e) {
      return false;
    }
  };

  onNext = async (): Promise<void> => {
    const {
      navigation,
      selectedAsset,
      setSelectedAsset,
      transactionState: { transaction },
      providerType,
      onConfirm,
      globalNetworkClientId,
      isRedesignedTransferConfirmationEnabled,
    } = this.props;
    const {
      inputValue,
      inputValueConversion,
      internalPrimaryCurrencyIsCrypto,
      maxFiatInput,
    } = this.state;

    let value: string | undefined;
    if (internalPrimaryCurrencyIsCrypto) {
      value = inputValue;
    } else {
      value = inputValueConversion;
      if (maxFiatInput) {
        value = `${renderFromWei(
          fiatNumberToWei(
            handleWeiNumber(maxFiatInput),
            this.props.conversionRate,
          ),
          18,
        )}`;
      }
    }
    if (value && value.includes(',')) {
      value = inputValue?.replace(',', '.');
    }

    value = formatValueToMatchTokenDecimals(value, (selectedAsset as TokenAsset).decimals);
    if (
      !(selectedAsset as CollectibleAsset).tokenId &&
      this.validateAmount(value || '', internalPrimaryCurrencyIsCrypto)
    ) {
      return;
    } else if ((selectedAsset as CollectibleAsset).tokenId) {
      const isOwner = await this.validateCollectibleOwnership();
      if (!isOwner) {
        this.setState({
          amountError: strings('transaction.invalid_collectible_ownership'),
        });
        dismissKeyboard();
        return;
      }
    }

    await this.prepareTransaction(value || '');

    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.SEND_FLOW_ADDS_AMOUNT)
        .addProperties({ network: providerType })
        .build(),
    );

    setSelectedAsset(selectedAsset);
    if (onConfirm) {
      onConfirm();
    } else if (isRedesignedTransferConfirmationEnabled) {
        this.setState({ isRedesignedTransferTransactionLoading: true });

        const transactionParams = {
          data: transaction.data,
          from: transaction.from,
          to: transaction.to,
          value:
            typeof transaction.value === 'string'
              ? transaction.value
              : BNToHex(transaction.value as BN),
        };

        await addTransaction(transactionParams, {
          origin: MMM_ORIGIN,
          networkClientId: globalNetworkClientId,
        });
        this.setState({ isRedesignedTransferTransactionLoading: false });
        navigation.navigate('SendFlowView', {
          screen: Routes.STANDALONE_CONFIRMATIONS.TRANSFER,
        });
      } else {
        navigation.navigate(Routes.SEND_FLOW.CONFIRM);
      }
  };

  getCollectibleTranferTransactionProperties(): { data?: string; to?: string; value?: string } {
    const {
      selectedAsset,
      transactionState: { transaction, transactionTo },
    } = this.props;

    const collectibleTransferTransactionProperties: { data?: string; to?: string; value?: string } = {};

    const collectibleTransferInformation =
      collectiblesTransferInformation[(selectedAsset as CollectibleAsset).address.toLowerCase()];
    if (
      !collectibleTransferInformation ||
      (collectibleTransferInformation.tradable &&
        collectibleTransferInformation.method === 'transferFrom')
    ) {
      collectibleTransferTransactionProperties.data = generateTransferData(
        'transferFrom',
        {
          fromAddress: transaction.from,
          toAddress: transactionTo,
          tokenId: toHexadecimal((selectedAsset as CollectibleAsset).tokenId),
        },
      );
    } else if (
      collectibleTransferInformation.tradable &&
      collectibleTransferInformation.method === 'transfer'
    ) {
      collectibleTransferTransactionProperties.data = generateTransferData(
        'transfer',
        {
          toAddress: transactionTo,
          amount: (selectedAsset as CollectibleAsset).tokenId.toString(16),
        },
      );
    }
    collectibleTransferTransactionProperties.to = (selectedAsset as CollectibleAsset).address;
    collectibleTransferTransactionProperties.value = '0x0';

    return collectibleTransferTransactionProperties;
  }

  prepareTransaction = async (value: string): Promise<void> => {
    const {
      prepareTransaction,
      selectedAsset,
      transactionState: { transaction, transactionTo },
    } = this.props;

    if (isNativeToken(selectedAsset)) {
      transaction.data = '0x';
      transaction.to = transactionTo;
      transaction.value = BNToHex(toWei(value));
    } else if ((selectedAsset as CollectibleAsset).tokenId) {
      const collectibleTransferTransactionProperties =
        this.getCollectibleTranferTransactionProperties();
      transaction.data = collectibleTransferTransactionProperties.data;
      transaction.to = collectibleTransferTransactionProperties.to;
      transaction.value = collectibleTransferTransactionProperties.value;
    } else {
      const tokenAmount = toTokenMinimalUnit(value, (selectedAsset as TokenAsset).decimals);
      transaction.data = generateTransferData('transfer', {
        toAddress: transactionTo,
        amount: BNToHex(tokenAmount),
      });
      transaction.to = (selectedAsset as TokenAsset).address;
      transaction.value = '0x0';
    }
    prepareTransaction(transaction);
  };

  /**
   * Validates crypto value only
   *
   * @param {string} - Crypto value
   * @returns - Whether there is an error with the amount
   */
  validateAmount = (inputValue: string, internalPrimaryCurrencyIsCrypto: boolean): boolean => {
    const { accounts, selectedAddress, selectedAsset, contractBalances } =
      this.props;
    const { estimatedTotalGas, inputValueConversion } = this.state;
    let value = inputValue;

    if (!internalPrimaryCurrencyIsCrypto) {
      value = inputValueConversion || '';
    }

    let weiBalance: BN | undefined, weiInput: BN | undefined, amountError: string | undefined;
    if (isDecimal(value)) {
      // toWei can throw error if input is not a number: Error: while converting number to string, invalid number value
      let weiValue: BN = new BN(0);
      try {
        weiValue = toWei(value);
      } catch (error) {
        amountError = strings('transaction.invalid_amount');
      }

      if (!amountError && Number(value) < 0) {
        amountError = strings('transaction.invalid_amount');
      }

      if (!amountError) {
        if (isNativeToken(selectedAsset)) {
          weiBalance = hexToBN(accounts[selectedAddress].balance);
          weiInput = weiValue.add(estimatedTotalGas || new BN(0));
        } else {
          weiBalance = hexToBN(contractBalances[(selectedAsset as TokenAsset).address]);
          weiInput = toTokenMinimalUnit(value, (selectedAsset as TokenAsset).decimals);
        }
        // TODO: weiBalance is not always guaranteed to be type BN. Need to consolidate type.
        amountError = gte(weiBalance, weiInput)
          ? undefined
          : strings('transaction.insufficient');
      }
    } else {
      amountError = strings('transaction.invalid_amount');
    }
    if (amountError) {
      this.setState({ amountError });
      dismissKeyboard();
    }
    return !!amountError;
  };

  /**
   * Estimate transaction gas with information available
   */
  estimateGasLimit = async (): Promise<BN> => {
    const {
      transaction: { from },
      transactionTo,
    } = this.props.transactionState;
    const { globalNetworkClientId } = this.props;
    const { gas } = await getGasLimit(
      {
        from,
        to: transactionTo,
      },
      false,
      globalNetworkClientId,
    );

    return gas;
  };

  useMax = (): void => {
    const {
      accounts,
      selectedAddress,
      contractBalances,
      selectedAsset,
      conversionRate,
      contractExchangeRates,
    } = this.props;
    const { internalPrimaryCurrencyIsCrypto, estimatedTotalGas } = this.state;
    const tokenBalance = contractBalances[(selectedAsset as TokenAsset).address] || '0x0';
    let input: string;
    if (isNativeToken(selectedAsset)) {
      const balanceBN = hexToBN(accounts[selectedAddress].balance);
      const realMaxValue = balanceBN.sub(estimatedTotalGas || new BN(0));
      const maxValue =
        balanceBN.isZero() || realMaxValue.isNeg() ? hexToBN('0x0') : realMaxValue;
      if (internalPrimaryCurrencyIsCrypto) {
        input = fromWei(maxValue);
      } else {
        input = `${weiToFiatNumber(maxValue, conversionRate)}`;
        this.setState({
          maxFiatInput: `${weiToFiatNumber(maxValue, conversionRate, 12)}`,
        });
      }
    } else {
      const exchangeRate = contractExchangeRates
        ? contractExchangeRates[(selectedAsset as TokenAsset).address]?.price
        : undefined;
      if (internalPrimaryCurrencyIsCrypto || !exchangeRate) {
        input = fromTokenMinimalUnitString(
          tokenBalance,
          (selectedAsset as TokenAsset).decimals,
        );
      } else {
        input = `${balanceToFiatNumber(
          fromTokenMinimalUnitString(tokenBalance, (selectedAsset as TokenAsset).decimals),
          conversionRate,
          exchangeRate,
        )}`;
      }
    }
    this.onInputChange(input, undefined, true);
  };

  onInputChange = (inputValue?: string, selectedAsset?: TokenAsset | CollectibleAsset, useMax?: boolean): void => {
    const {
      contractExchangeRates,
      conversionRate,
      currentCurrency,
      ticker,
      setMaxValueMode,
    } = this.props;
    const { internalPrimaryCurrencyIsCrypto } = this.state;

    setMaxValueMode(useMax ?? false);

    let inputValueConversion: string | undefined,
      renderableInputValueConversion: string | undefined,
      hasExchangeRate: boolean,
      comma: boolean | undefined;
    // Remove spaces from input
    inputValue = inputValue && inputValue.replace(regex.whiteSpaces, '');
    // Handle semicolon for other languages
    if (inputValue && inputValue.includes(',')) {
      comma = true;
      inputValue = inputValue.replace(',', '.');
    }
    const processedTicker = getTicker(ticker);
    const processedInputValue = isDecimal(inputValue)
      ? handleWeiNumber(inputValue)
      : '0';
    selectedAsset = selectedAsset || this.props.selectedAsset;
    if (isNativeToken(selectedAsset)) {
      // toWei can throw error if input is not a number: Error: while converting number to string, invalid number value
      let weiValue: BN = new BN(0);

      try {
        weiValue = toWei(processedInputValue);
      } catch (error) {
        // Do nothing
      }

      hasExchangeRate = !!conversionRate;
      if (internalPrimaryCurrencyIsCrypto) {
        inputValueConversion = `${weiToFiatNumber(weiValue, conversionRate)}`;
        renderableInputValueConversion = `${weiToFiat(
          weiValue,
          conversionRate,
          currentCurrency,
        )}`;
      } else {
        inputValueConversion = `${renderFromWei(
          fiatNumberToWei(processedInputValue, conversionRate),
        )}`;
        renderableInputValueConversion = `${inputValueConversion} ${processedTicker}`;
      }
    } else {
      const exchangeRate = contractExchangeRates
        ? contractExchangeRates[(selectedAsset as TokenAsset).address]?.price
        : null;
      hasExchangeRate = !!exchangeRate;
      if (internalPrimaryCurrencyIsCrypto) {
        inputValueConversion = `${balanceToFiatNumber(
          processedInputValue,
          conversionRate,
          exchangeRate,
        )}`;
        renderableInputValueConversion = `${balanceToFiat(
          processedInputValue,
          conversionRate,
          exchangeRate,
          currentCurrency,
        )}`;
      } else {
        inputValueConversion = `${renderFromTokenMinimalUnit(
          fiatNumberToTokenMinimalUnit(
            processedInputValue,
            conversionRate,
            exchangeRate,
            (selectedAsset as TokenAsset).decimals,
          ),
          (selectedAsset as TokenAsset).decimals,
        )}`;
        renderableInputValueConversion = `${inputValueConversion} ${(selectedAsset as TokenAsset).symbol}`;
      }
    }
    if (comma) inputValue = inputValue && inputValue.replace('.', ',');
    inputValueConversion =
      inputValueConversion === '0' ? undefined : inputValueConversion;
    this.setState({
      inputValue,
      inputValueConversion,
      renderableInputValueConversion,
      amountError: undefined,
      hasExchangeRate,
      maxFiatInput: !useMax ? undefined : this.state.maxFiatInput,
    });
  };

  toggleAssetsModal = (): void => {
    const { assetsModalVisible } = this.state;
    this.setState({ assetsModalVisible: !assetsModalVisible });
  };

  handleSelectedAssetBalance = (selectedAsset: TokenAsset, renderableBalance?: string): void => {
    const { accounts, selectedAddress, contractBalances } = this.props;
    let currentBalance: string;
    if (renderableBalance) {
      currentBalance = `${renderableBalance} ${selectedAsset.symbol}`;
    } else if (isNativeToken(selectedAsset)) {
      currentBalance = `${renderFromWei(accounts[selectedAddress].balance)} ${
        selectedAsset.symbol
      }`;
    } else {
      currentBalance = `${renderFromTokenMinimalUnit(
        contractBalances[selectedAsset.address],
        selectedAsset.decimals,
      )} ${selectedAsset.symbol}`;
    }
    this.setState({ currentBalance });
  };

  pickSelectedAsset = (selectedAsset: TokenAsset | CollectibleAsset): void => {
    this.toggleAssetsModal();
    this.props.setSelectedAsset(selectedAsset);
    if (!(selectedAsset as CollectibleAsset).tokenId) {
      this.onInputChange(undefined, selectedAsset);
      this.handleSelectedAssetBalance(selectedAsset as TokenAsset);
      // Wait for input to mount first
      setTimeout(
        () =>
          this.amountInput &&
          this.amountInput.current &&
          this.amountInput.current.focus(),
        500,
      );
    }
  };

  assetKeyExtractor = (asset: TokenAsset | CollectibleAsset): string => {
    if ((asset as CollectibleAsset).tokenId) {
      return asset.address + (asset as CollectibleAsset).tokenId;
    }
    return asset.address;
  };

  renderToken = (token: TokenAsset, index: number): React.ReactNode => {
    const {
      accounts,
      selectedAddress,
      conversionRate,
      currentCurrency,
      contractBalances,
      contractExchangeRates,
    } = this.props;
    let balance: string, balanceFiat: string | undefined;
    const { address, decimals, symbol } = token;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (isNativeToken(token)) {
      balance = renderFromWei(accounts[selectedAddress].balance);
      balanceFiat = weiToFiat(
        hexToBN(accounts[selectedAddress].balance),
        conversionRate,
        currentCurrency,
      );
    } else {
      balance = renderFromTokenMinimalUnit(contractBalances[address], decimals);
      const exchangeRate = contractExchangeRates
        ? contractExchangeRates[address]?.price
        : undefined;
      balanceFiat = balanceToFiat(
        balance,
        conversionRate,
        exchangeRate,
        currentCurrency,
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={styles.assetElementWrapper}
        onPress={() => this.pickSelectedAsset(token)}
      >
        <View style={styles.assetElement}>
          {isNativeToken(token) ? (
            <NetworkMainAssetLogo big />
          ) : (
            <TokenImage
              asset={token}
              iconStyle={styles.tokenImage}
              containerStyle={styles.tokenImage}
            />
          )}
          <View style={styles.assetInformationWrapper}>
            <Text style={styles.textAssetTitle}>{symbol}</Text>
            <View style={styles.assetBalanceWrapper}>
              <Text style={styles.textAssetBalance}>{balance}</Text>
              {!!balanceFiat && (
                <Text style={styles.textAssetFiat}>{balanceFiat}</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  renderCollectible = (collectible: CollectibleAsset, index: number): React.ReactNode => {
    const { name } = collectible;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <TouchableOpacity
        key={index}
        style={styles.assetElementWrapper}
        onPress={() => this.pickSelectedAsset(collectible)}
      >
        <View style={styles.assetElement}>
          <CollectibleMedia
            small
            collectible={collectible}
            iconStyle={styles.tokenImage}
            containerStyle={styles.tokenImage}
          />
          <View style={styles.assetInformationWrapper}>
            <Text style={styles.textAssetTitle}>{name}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  renderAsset = (props: ListRenderItemInfo<TokenAsset | CollectibleAsset>): React.ReactNode => {
    const { item: asset, index } = props;
    if (!(asset as CollectibleAsset).tokenId) {
      return this.renderToken(asset as TokenAsset, index);
    }
    return this.renderCollectible(asset as CollectibleAsset, index);
  };

  processCollectibles = (): CollectibleAsset[] => {
    const { collectibleContracts } = this.props;
    const collectibles: CollectibleAsset[] = [];
    const sortedCollectibles = [...this.props.collectibles].sort((a, b) => {
      if (a.address < b.address) return -1;
      if (a.address > b.address) return 1;
      return 0;
    });
    sortedCollectibles.forEach((collectible) => {
      const address = collectible.address.toLowerCase();
      const isTradable =
        !collectiblesTransferInformation[address] ||
        collectiblesTransferInformation[address].tradable;
      if (!isTradable) return;
      const collectibleContract = collectibleContracts.find(
        (contract) => contract.address.toLowerCase() === address,
      );
      if (!collectible.name && collectibleContract) collectible.name = collectibleContract.name;
      if (!collectible.image && collectibleContract) collectible.image = collectibleContract.logo;
      collectibles.push(collectible);
    });
    return collectibles;
  };

  renderAssetsModal = (): React.ReactNode => {
    const { assetsModalVisible } = this.state;
    const tradableCollectibles = this.collectibles.filter(
      ({ standard }) => standard === 'ERC721',
    );
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <Modal
        isVisible={assetsModalVisible}
        style={styles.bottomModal}
        onBackdropPress={this.toggleAssetsModal}
        onBackButtonPress={this.toggleAssetsModal}
        onSwipeComplete={this.toggleAssetsModal}
        swipeDirection={'down'}
        propagateSwipe
        backdropColor={colors.overlay.default}
        backdropOpacity={1}
      >
        <SafeAreaView style={styles.assetsModalWrapper}>
          <View style={styles.titleWrapper}>
            <View style={styles.dragger} />
          </View>
          <FlatList
            data={[...this.tokens, ...tradableCollectibles]}
            keyExtractor={this.assetKeyExtractor}
            renderItem={this.renderAsset}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  switchCurrency = async (): Promise<void> => {
    const { internalPrimaryCurrencyIsCrypto, inputValueConversion } =
      this.state;
    this.setState(
      {
        internalPrimaryCurrencyIsCrypto: !internalPrimaryCurrencyIsCrypto,
      },
      () => {
        this.onInputChange(inputValueConversion);
      },
    );
  };

  renderTokenInput = (): React.ReactNode => {
    const {
      inputValue,
      renderableInputValueConversion,
      amountError,
      hasExchangeRate,
      internalPrimaryCurrencyIsCrypto,
      currentBalance,
    } = this.state;
    const {
      currentCurrency,
      selectedAsset,
      navigation,
      isNetworkBuyNativeTokenSupported,
      swapsIsLive,
      globalChainId,
      ticker,
    } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    const themeAppearance = this.context.themeAppearance || 'light';
    const styles = createStyles(colors);
    const navigateToSwap = (): void => {
      navigation.replace('Swaps', {
        screen: 'SwapsAmountView',
        params: {
          sourceToken: swapsUtils.NATIVE_SWAPS_TOKEN_ADDRESS,
          destinationToken: (selectedAsset as TokenAsset).address,
          sourcePage: 'SendFlow',
        },
      });
    };

    const isSwappable =
      !isNativeToken(selectedAsset) &&
      AppConstants.SWAPS.ACTIVE &&
      swapsIsLive &&
      isSwapsAllowed(globalChainId) &&
      amountError === strings('transaction.insufficient');

    const navigateToBuyOrSwaps = (): void => {
      if (isSwappable) {
        this.props.metrics.trackEvent(
          this.props.metrics
            .createEventBuilder(MetaMetricsEvents.LINK_CLICKED)
            .addProperties({
              location: 'insufficient_funds_warning',
              text: 'swap_tokens',
            })
            .build(),
        );
        navigateToSwap();
      } else if (
        isNetworkBuyNativeTokenSupported &&
        isNativeToken(selectedAsset)
      ) {
        this.props.metrics.trackEvent(
          this.props.metrics
            .createEventBuilder(MetaMetricsEvents.LINK_CLICKED)
            .addProperties({
              location: 'insufficient_funds_warning',
              text: 'buy_more',
            })
            .build(),
        );
        navigation.navigate(...createBuyNavigationDetails());
      }
    };

    return (
      <View>
        <View style={styles.inputContainerWrapper}>
          <View style={styles.inputContainer}>
            {!internalPrimaryCurrencyIsCrypto && !!inputValue && (
              <Text style={styles.inputCurrencyText}>{`${getCurrencySymbol(
                currentCurrency,
              )} `}</Text>
            )}
            <TextInput
              ref={this.amountInput}
              style={styles.textInput}
              value={inputValue}
              onChangeText={this.onInputChange}
              keyboardType={'numeric'}
              placeholder={'0'}
              placeholderTextColor={colors.text.muted}
              keyboardAppearance={themeAppearance as 'light' | 'dark'}
              testID={AmountViewSelectorsIDs.AMOUNT_INPUT}
            />
          </View>
        </View>
        {hasExchangeRate && (
          <View style={styles.actionsWrapper}>
            <View style={styles.action}>
              <TouchableOpacity
                style={styles.actionSwitch}
                onPress={this.switchCurrency}
                testID={AmountViewSelectorsIDs.CURRENCY_SWITCH}
              >
                <Text
                  style={styles.textSwitch}
                  numberOfLines={1}
                  testID={
                    AmountViewSelectorsIDs.TRANSACTION_AMOUNT_CONVERSION_VALUE
                  }
                >
                  {renderableInputValueConversion}
                </Text>
                <View style={styles.switchWrapper}>
                  <MaterialCommunityIcons
                    name="swap-vertical"
                    size={16}
                    color={colors.primary.default}
                    style={styles.switch}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={styles.balanceWrapper}>
          <Text style={styles.balanceText}>{`${strings(
            'transaction.balance',
          )}: ${currentBalance}`}</Text>
        </View>
        {amountError && (
          <View
            style={styles.errorMessageWrapper}
            testID={AmountViewSelectorsIDs.AMOUNT_ERROR}
          >
            <TouchableOpacity
              onPress={navigateToBuyOrSwaps}
              style={styles.errorBuyWrapper}
            >
              {isNetworkBuyNativeTokenSupported &&
              isNativeToken(selectedAsset) ? (
                <Text style={[styles.error]}>
                  {strings('transaction.more_to_continue', {
                    ticker: getTicker(ticker),
                  })}
                  {'\n'}
                  <Text style={[styles.error, styles.underline]}>
                    {strings('transaction.token_Marketplace')}
                  </Text>
                  {'\n'}
                  {strings('transaction.you_can_also_send_funds')}
                </Text>
              ) : (
                <Text style={styles.error}>{amountError}</Text>
              )}

              {isSwappable && (
                <Text style={[styles.error, styles.underline]}>
                  {strings('transaction.swap_tokens')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  renderCollectibleInput = (): React.ReactNode => {
    const { amountError } = this.state;
    const { selectedAsset } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.collectibleInputWrapper}>
        <View style={styles.collectibleInputImageWrapper}>
          <CollectibleMedia
            small
            containerStyle={styles.CollectibleMedia}
            iconStyle={styles.CollectibleMedia}
            collectible={selectedAsset}
          />
        </View>
        <View style={styles.collectibleInputInformationWrapper}>
          <Text style={styles.collectibleName}>{(selectedAsset as CollectibleAsset).name}</Text>
          <Text style={styles.collectibleId}>{`#${renderShortText(
            (selectedAsset as CollectibleAsset).tokenId,
            10,
          )}`}</Text>
        </View>
        {amountError && (
          <View
            style={styles.errorMessageWrapper}
            testID={AmountViewSelectorsIDs.AMOUNT_ERROR}
          >
            <ErrorMessage errorMessage={amountError} />
          </View>
        )}
      </View>
    );
  };

  render = (): React.ReactNode => {
    const {
      estimatedTotalGas,
      hasExchangeRate,
      isRedesignedTransferTransactionLoading,
    } = this.state;
    const {
      selectedAsset,
      transactionState: { isPaymentRequest },
    } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <SafeAreaView
        edges={['bottom']}
        style={styles.wrapper}
        testID={AmountViewSelectorsIDs.CONTAINER}
      >
        <ScrollView style={styles.scrollWrapper}>
          {!hasExchangeRate && !(selectedAsset as CollectibleAsset).tokenId ? (
            <Alert
              small
              type={AlertType.Warning}
              renderIcon={() => (
                <MaterialCommunityIcons
                  name="information"
                  size={20}
                  color={colors.warning.default}
                />
              )}
              style={styles.warningContainer}
            >
              {() => (
                <View style={styles.warningTextContainer}>
                  <Text
                    style={styles.warningText}
                    testID={AmountViewSelectorsIDs.FIAT_CONVERSION_WARNING_TEXT}
                  >
                    {strings('transaction.fiat_conversion_not_available')}
                  </Text>
                </View>
              )}
            </Alert>
          ) : null}
          <View style={styles.inputWrapper}>
            <View style={styles.actionsWrapper}>
              <View style={styles.actionBorder} />
              <View style={styles.action}>
                <TouchableOpacity
                  style={styles.actionDropdown}
                  disabled={isPaymentRequest}
                  onPress={this.toggleAssetsModal}
                >
                  <Text style={styles.textDropdown}>
                    {(selectedAsset as TokenAsset).symbol || strings('wallet.collectible')}
                  </Text>
                  <View style={styles.arrow}>
                    <Ionicons
                      name="arrow-down"
                      size={16}
                      color={colors.primary.inverse}
                      style={styles.iconDropdown}
                    />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[styles.actionBorder, styles.actionMax]}>
                {!(selectedAsset as CollectibleAsset).tokenId && (
                  <TouchableOpacity
                    style={styles.actionMaxTouchable}
                    disabled={!estimatedTotalGas}
                    onPress={this.useMax}
                  >
                    <Text style={styles.maxText}>
                      {strings('transaction.use_max')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {(selectedAsset as CollectibleAsset).tokenId
              ? this.renderCollectibleInput()
              : this.renderTokenInput()}
          </View>
        </ScrollView>

        <KeyboardAvoidingView
          style={styles.nextActionWrapper}
          behavior={'padding'}
          keyboardVerticalOffset={KEYBOARD_OFFSET}
          enabled={Device.isIos()}
        >
          <View style={styles.buttonNextWrapper}>
            <StyledButton
              type={'confirm'}
              containerStyle={styles.buttonNext}
              disabled={
                !estimatedTotalGas || isRedesignedTransferTransactionLoading
              }
              onPress={this.onNext}
              testID={AmountViewSelectorsIDs.NEXT_BUTTON}
            >
              {strings('transaction.next')}
            </StyledButton>
          </View>
        </KeyboardAvoidingView>
        {this.renderAssetsModal()}
      </SafeAreaView>
    );
  };
}

const mapStateToProps = (state: RootState, ownProps: { transaction?: TransactionState }) => {
  const transaction = ownProps.transaction || state.transaction;
  const globalChainId = selectEvmChainId(state);
  const globalNetworkClientId = selectNetworkClientId(state);

  return {
    accounts: selectAccounts(state),
    contractExchangeRates: selectContractExchangeRatesByChainId(
      state,
      globalChainId,
    ),
    contractBalances: selectContractBalances(state),
    collectibles: collectiblesSelector(state),
    collectibleContracts: collectibleContractsSelector(state),
    conversionRate: selectConversionRateByChainId(state, globalChainId),
    currentCurrency: selectCurrentCurrency(state),
    gasEstimateType: selectGasFeeControllerEstimateType(state),
    gasFeeEstimates: selectGasFeeEstimates(state),
    providerType: selectProviderTypeByChainId(state, globalChainId),
    primaryCurrency: state.settings.primaryCurrency,
    selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
    ticker: selectNativeCurrencyByChainId(state, globalChainId),
    tokens: selectTokens(state),
    transactionState: transaction,
    selectedAsset: state.transaction.selectedAsset,
    isPaymentRequest: state.transaction.paymentRequest,
    isNetworkBuyNativeTokenSupported: isNetworkRampNativeTokenSupported(
      globalChainId,
      getRampNetworks(state),
    ),
    isRedesignedTransferConfirmationEnabled:
      selectConfirmationRedesignFlags(state).transfer,
    swapsIsLive: swapsLivenessSelector(state),
    globalChainId,
    globalNetworkClientId,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  prepareTransaction: (transaction: Record<string, unknown>) =>
    dispatch(prepareTransaction(transaction)),
  setSelectedAsset: (selectedAsset: TokenAsset | CollectibleAsset) =>
    dispatch(setSelectedAsset(selectedAsset)),
  resetTransaction: () => dispatch(resetTransaction()),
  setMaxValueMode: (maxValueMode: boolean) => dispatch(setMaxValueMode(maxValueMode)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(Amount));
