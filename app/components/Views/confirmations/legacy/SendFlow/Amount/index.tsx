import React, { ComponentType, PureComponent, RefObject } from 'react';
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
} from 'react-native';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import type BN4 from 'bnjs4';
import type BN from 'bn.js';
import { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import { TransactionParams } from '@metamask/transaction-controller';
import { Nft, NftContract } from '@metamask/assets-controllers';
import {
  EthGasPriceEstimate,
  GasFeeEstimates,
  GAS_ESTIMATE_TYPES,
  LegacyGasPriceEstimate,
} from '@metamask/gas-fee-controller';
import { Hex } from '@metamask/utils';
import {
  setSelectedAsset,
  prepareTransaction,
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
import { BNToHex } from '@metamask/controller-utils';
import ErrorMessage from '../ErrorMessage';
import { getGasLimit } from '../../../../../../util/custom-gas';
import Engine from '../../../../../../core/Engine';
import CollectibleMedia from '../../../../../UI/CollectibleMedia';
import collectiblesTransferInformation from '../../../../../../util/collectibles-transfer.json';
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
  // Pending updated multichain UX to specify the send chain.
  /* eslint-disable no-restricted-syntax */
  selectEvmChainId,
  selectNetworkClientId,
  /* eslint-enable no-restricted-syntax */
  selectNativeCurrencyByChainId,
  selectProviderTypeByChainId,
} from '../../../../../../selectors/networkController';
import { selectContractExchangeRatesByChainId } from '../../../../../../selectors/tokenRatesController';
import { isNativeToken } from '../../../utils/generic';
import { selectConfirmationRedesignFlags } from '../../../../../../selectors/featureFlagController/confirmations';
import { MMM_ORIGIN } from '../../../constants/confirmations';
import { RootState } from '../../../../../../reducers';
import { Colors, Theme } from '../../../../../../util/theme/models';
import { TokenI } from '../../../../../UI/Tokens/types';
import { IWithMetricsAwarenessProps } from '../../../../../../components/hooks/useMetrics/withMetricsAwareness.types';

const KEYBOARD_OFFSET = Device.isSmallDevice() ? 80 : 120;

/**
 * Asset selected in the send flow: the native token, an ERC20 token or a collectible.
 */
export interface SendFlowAsset {
  address: string;
  symbol?: string;
  decimals?: number;
  name?: string | null;
  image?: string | null;
  logo?: string;
  standard?: string | null;
  tokenId?: string;
  isETH?: boolean;
  isNative?: boolean;
}

export type SendFlowToken = SendFlowAsset;

export type SendFlowCollectible = Nft & SendFlowAsset;

interface SendFlowTransaction extends Omit<TransactionParams, 'value'> {
  value?: string | BN4;
}

interface SendFlowTransactionState {
  transaction: SendFlowTransaction;
  transactionTo?: string;
  readableValue?: string;
  selectedAsset: SendFlowAsset;
  isPaymentRequest?: boolean;
  paymentRequest?: boolean;
}

interface CollectibleTransferInformation {
  name: string;
  tradable: boolean;
  method?: string;
}

const collectiblesTransferInformationByAddress: Record<
  string,
  CollectibleTransferInformation | undefined
> = collectiblesTransferInformation;

// bnjs4 and bn.js v5 instances share the same runtime API; only their typings differ.
const bn4ToHex = (value: BN4) => BNToHex(value as unknown as BN);

const isNativeAsset = (asset: SendFlowAsset) =>
  isNativeToken(asset as unknown as TokenI);

const createStyles = (colors: Colors) =>
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

/**
 * View that wraps the wraps the "Send" screen
 */
interface AmountOwnProps {
  /**
   * Object that represents the navigator
   */
  navigation: NavigationProp<ParamListBase> & {
    replace: (name: string, params?: object) => void;
  };
  /**
   * Object that contains navigation props
   */
  route: RouteProp<ParamListBase, string>;
  /**
   * function to call when the 'Next' button is clicked
   */
  onConfirm?: () => void;
  /**
   * Transaction state override, defaults to the redux transaction state
   */
  transaction?: SendFlowTransactionState;
}

type AmountStateProps = ReturnType<typeof mapStateToProps>;
type AmountDispatchProps = ReturnType<typeof mapDispatchToProps>;

export type AmountProps = AmountOwnProps &
  AmountStateProps &
  AmountDispatchProps &
  IWithMetricsAwarenessProps;

interface AmountState {
  amountError?: string;
  inputValue?: string;
  inputValueConversion?: string;
  renderableInputValueConversion?: string;
  assetsModalVisible: boolean;
  internalPrimaryCurrencyIsCrypto: boolean;
  estimatedTotalGas?: BN4;
  hasExchangeRate: boolean;
  isRedesignedTransferTransactionLoading: boolean;
  maxFiatInput?: string;
  currentBalance?: string;
}

/**
 * View that wraps the wraps the "Send" screen
 */
class Amount extends PureComponent<AmountProps, AmountState> {
  static contextType = ThemeContext;

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

  amountInput: RefObject<TextInput> = React.createRef();
  tokens: SendFlowToken[] = [];
  collectibles: SendFlowCollectible[] = [];

  updateNavBar = () => {
    const {
      navigation,
      route,
      resetTransaction: resetTransactionProp,
    } = this.props;
    const colors = (this.context as Theme).colors || mockTheme.colors;
    navigation.setOptions(
      getSendFlowTitle(
        'send.amount',
        navigation,
        route,
        colors,
        resetTransactionProp,
        undefined,
      ),
    );
  };

  componentDidMount = async () => {
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

    this.tokens = [getEther(ticker) as SendFlowToken, ...tokens];
    this.collectibles = this.processCollectibles();
    // Wait until navigation finishes to focus
    InteractionManager.runAfterInteractions(() =>
      this.amountInput?.current?.focus?.(),
    );
    this.onInputChange(readableValue);
    !selectedAsset.tokenId && this.handleSelectedAssetBalance(selectedAsset);

    const [estimatedGas] = await Promise.all([this.estimateGasLimit()]);
    // estimateGas returns a bn.js v5 instance; the rest of this file works with bnjs4.
    const gas = estimatedGas as unknown as BN4;

    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      const feeMarketEstimates = gasFeeEstimates as GasFeeEstimates;
      const mediumGasFeeEstimates =
        feeMarketEstimates[AppConstants.GAS_OPTIONS.MEDIUM];
      const estimatedBaseFeeHex = decGWEIToHexWEI(
        feeMarketEstimates.estimatedBaseFee,
      );
      const suggestedMaxPriorityFeePerGasHex = decGWEIToHexWEI(
        mediumGasFeeEstimates.suggestedMaxPriorityFeePerGas,
      );
      const suggestedMaxFeePerGasHex = decGWEIToHexWEI(
        mediumGasFeeEstimates.suggestedMaxFeePerGas,
      );
      const gasLimitHex = bn4ToHex(gas);
      const gasHexes = calculateEIP1559GasFeeHexes({
        gasLimitHex,
        estimatedGasLimitHex: undefined,
        estimatedBaseFeeHex,
        suggestedMaxFeePerGasHex,
        suggestedMaxPriorityFeePerGasHex,
      });
      this.setState({
        estimatedTotalGas: hexToBN(gasHexes.gasFeeMaxHex),
      });
    } else if (gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
      const gasPrice = hexToBN(
        decGWEIToHexWEI(
          (gasFeeEstimates as LegacyGasPriceEstimate)[
            AppConstants.GAS_OPTIONS.MEDIUM
          ],
        ),
      );
      this.setState({ estimatedTotalGas: gas.mul(gasPrice) });
    } else {
      const gasPrice = hexToBN(
        decGWEIToHexWEI((gasFeeEstimates as EthGasPriceEstimate).gasPrice),
      );
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

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  hasExchangeRate = () => {
    const { selectedAsset, conversionRate, contractExchangeRates } = this.props;

    if (isNativeAsset(selectedAsset)) {
      return !!conversionRate;
    }
    const exchangeRate =
      contractExchangeRates?.[selectedAsset.address]?.price ?? null;
    return !!exchangeRate;
  };

  /**
   * Method to validate collectible ownership.
   *
   * @returns Promise that resolves ownershio as a boolean.
   */
  validateCollectibleOwnership = async () => {
    const { NftController } = Engine.context;
    const {
      transactionState: {
        selectedAsset: { address, tokenId },
      },
      selectedAddress,
    } = this.props;
    try {
      return await NftController.isNftOwner(
        selectedAddress,
        address,
        tokenId as string,
      );
    } catch (e) {
      return false;
    }
  };

  onNext = async () => {
    const {
      navigation,
      selectedAsset,
      setSelectedAsset: setSelectedAssetProp,
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

    let value;
    if (internalPrimaryCurrencyIsCrypto) {
      value = inputValue;
    } else {
      value = inputValueConversion;
      if (maxFiatInput) {
        value = `${renderFromWei(
          fiatNumberToWei(
            handleWeiNumber(maxFiatInput),
            this.props.conversionRate,
          ) as BN4,
          18,
        )}`;
      }
    }
    if (value?.includes(',')) {
      value = (inputValue as string).replace(',', '.');
    }

    value = formatValueToMatchTokenDecimals(
      value,
      selectedAsset.decimals as number,
    );
    if (
      !selectedAsset.tokenId &&
      this.validateAmount(value, internalPrimaryCurrencyIsCrypto)
    ) {
      return;
    } else if (selectedAsset.tokenId) {
      const isOwner = await this.validateCollectibleOwnership();
      if (!isOwner) {
        this.setState({
          amountError: strings('transaction.invalid_collectible_ownership'),
        });
        dismissKeyboard();
        return;
      }
    }

    await this.prepareTransaction(value);

    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.SEND_FLOW_ADDS_AMOUNT)
        .addProperties({ network: providerType })
        .build(),
    );

    setSelectedAssetProp(selectedAsset);
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
              : bn4ToHex(transaction.value as BN4),
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

  getCollectibleTranferTransactionProperties() {
    const {
      selectedAsset,
      transactionState: { transaction, transactionTo },
    } = this.props;

    const collectibleTransferTransactionProperties: {
      data?: string;
      to?: string;
      value?: string;
    } = {};

    const collectibleTransferInformation =
      collectiblesTransferInformationByAddress[selectedAsset.address.toLowerCase()];
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
          tokenId: toHexadecimal(selectedAsset.tokenId),
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
          // tokenId is a decimal string at runtime; String#toString ignores the radix.
          amount: (selectedAsset.tokenId as unknown as number).toString(16),
        },
      );
    }
    collectibleTransferTransactionProperties.to = selectedAsset.address;
    collectibleTransferTransactionProperties.value = '0x0';

    return collectibleTransferTransactionProperties;
  }

  prepareTransaction = async (value: string) => {
    const {
      prepareTransaction: prepareTransactionProp,
      selectedAsset,
      transactionState: { transaction, transactionTo },
    } = this.props;

    if (isNativeAsset(selectedAsset)) {
      transaction.data = '0x';
      transaction.to = transactionTo;
      transaction.value = bn4ToHex(toWei(value));
    } else if (selectedAsset.tokenId) {
      const collectibleTransferTransactionProperties =
        this.getCollectibleTranferTransactionProperties();
      transaction.data = collectibleTransferTransactionProperties.data;
      transaction.to = collectibleTransferTransactionProperties.to;
      transaction.value = collectibleTransferTransactionProperties.value;
    } else {
      const tokenAmount = toTokenMinimalUnit(
        value,
        selectedAsset.decimals as number,
      );
      transaction.data = generateTransferData('transfer', {
        toAddress: transactionTo,
        amount: bn4ToHex(tokenAmount),
      });
      transaction.to = selectedAsset.address;
      transaction.value = '0x0';
    }
    prepareTransactionProp(transaction);
  };

  /**
   * Validates crypto value only
   *
   * @param {string} - Crypto value
   * @returns - Whether there is an error with the amount
   */
  validateAmount = (
    inputValue: string | undefined,
    internalPrimaryCurrencyIsCrypto: boolean,
  ) => {
    const { accounts, selectedAddress, selectedAsset, contractBalances } =
      this.props;
    const { estimatedTotalGas, inputValueConversion } = this.state;
    let value = inputValue;

    if (!internalPrimaryCurrencyIsCrypto) {
      value = inputValueConversion;
    }

    let weiBalance: BN4 | undefined;
    let weiInput: BN4 | undefined;
    let amountError: string | undefined;
    if (isDecimal(value as string)) {
      // toWei can throw error if input is not a number: Error: while converting number to string, invalid number value
      let weiValue: BN4 | 0 = 0;
      try {
        weiValue = toWei(value as string);
      } catch (error) {
        amountError = strings('transaction.invalid_amount');
      }

      if (!amountError && Number(value) < 0) {
        amountError = strings('transaction.invalid_amount');
      }

      if (!amountError) {
        if (isNativeAsset(selectedAsset)) {
          weiBalance = hexToBN(accounts[selectedAddress].balance);
          weiInput = (weiValue as BN4).add(estimatedTotalGas as BN4);
        } else {
          weiBalance = hexToBN(contractBalances[selectedAsset.address]);
          weiInput = toTokenMinimalUnit(
            value as string,
            selectedAsset.decimals as number,
          );
        }
        // TODO: weiBalance is not always guaranteed to be type BN. Need to consolidate type.
        amountError = gte(
          weiBalance as unknown as number,
          weiInput as unknown as number,
        )
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
  estimateGasLimit = async () => {
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

  useMax = () => {
    const {
      accounts,
      selectedAddress,
      contractBalances,
      selectedAsset,
      conversionRate,
      contractExchangeRates,
    } = this.props;
    const { internalPrimaryCurrencyIsCrypto, estimatedTotalGas } = this.state;
    const tokenBalance = contractBalances[selectedAsset.address] || '0x0';
    let input;
    if (isNativeAsset(selectedAsset)) {
      const balanceBN = hexToBN(accounts[selectedAddress].balance);
      const realMaxValue = balanceBN.sub(estimatedTotalGas as BN4);
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
        ? contractExchangeRates[selectedAsset.address]?.price
        : undefined;
      if (internalPrimaryCurrencyIsCrypto || !exchangeRate) {
        input = fromTokenMinimalUnitString(
          tokenBalance,
          selectedAsset.decimals as number,
        );
      } else {
        input = `${balanceToFiatNumber(
          fromTokenMinimalUnitString(
            tokenBalance,
            selectedAsset.decimals as number,
          ),
          conversionRate,
          exchangeRate,
        )}`;
      }
    }
    this.onInputChange(input, undefined, true);
  };

  onInputChange = (
    inputValue?: string,
    selectedAsset?: SendFlowAsset,
    useMax?: boolean,
  ) => {
    const {
      contractExchangeRates,
      conversionRate,
      currentCurrency,
      ticker,
      setMaxValueMode: setMaxValueModeProp,
    } = this.props;
    const { internalPrimaryCurrencyIsCrypto } = this.state;

    setMaxValueModeProp(useMax ?? false);

    let inputValueConversion: string | undefined;
    let renderableInputValueConversion: string | undefined;
    let hasExchangeRate: boolean;
    let comma: boolean | undefined;
    // Remove spaces from input
    inputValue = inputValue?.replace(regex.whiteSpaces, '');
    // Handle semicolon for other languages
    if (inputValue?.includes(',')) {
      comma = true;
      inputValue = inputValue.replace(',', '.');
    }
    const processedTicker = getTicker(ticker);
    const processedInputValue = isDecimal(inputValue as string)
      ? handleWeiNumber(inputValue as string)
      : '0';
    selectedAsset = selectedAsset || this.props.selectedAsset;
    if (isNativeAsset(selectedAsset)) {
      // toWei can throw error if input is not a number: Error: while converting number to string, invalid number value
      let weiValue: BN4 | 0 = 0;

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
          fiatNumberToWei(processedInputValue, conversionRate) as BN4,
        )}`;
        renderableInputValueConversion = `${inputValueConversion} ${processedTicker}`;
      }
    } else {
      const exchangeRate = contractExchangeRates
        ? contractExchangeRates[selectedAsset.address]?.price
        : null;
      hasExchangeRate = !!exchangeRate;
      if (internalPrimaryCurrencyIsCrypto) {
        inputValueConversion = `${balanceToFiatNumber(
          processedInputValue,
          conversionRate,
          exchangeRate as number,
        )}`;
        renderableInputValueConversion = `${balanceToFiat(
          processedInputValue,
          conversionRate,
          exchangeRate as number,
          currentCurrency,
        )}`;
      } else {
        inputValueConversion = `${renderFromTokenMinimalUnit(
          fiatNumberToTokenMinimalUnit(
            processedInputValue,
            conversionRate,
            exchangeRate as number,
            selectedAsset.decimals as number,
          ) as BN4,
          selectedAsset.decimals as number,
        )}`;
        renderableInputValueConversion = `${inputValueConversion} ${selectedAsset.symbol}`;
      }
    }
    if (comma) inputValue = inputValue?.replace('.', ',');
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

  toggleAssetsModal = () => {
    const { assetsModalVisible } = this.state;
    this.setState({ assetsModalVisible: !assetsModalVisible });
  };

  handleSelectedAssetBalance = (
    selectedAsset: SendFlowAsset,
    renderableBalance?: string,
  ) => {
    const { accounts, selectedAddress, contractBalances } = this.props;
    let currentBalance;
    if (renderableBalance) {
      currentBalance = `${renderableBalance} ${selectedAsset.symbol}`;
    } else if (isNativeAsset(selectedAsset)) {
      currentBalance = `${renderFromWei(accounts[selectedAddress].balance)} ${
        selectedAsset.symbol
      }`;
    } else {
      currentBalance = `${renderFromTokenMinimalUnit(
        contractBalances[selectedAsset.address],
        selectedAsset.decimals as number,
      )} ${selectedAsset.symbol}`;
    }
    this.setState({ currentBalance });
  };

  pickSelectedAsset = (selectedAsset: SendFlowAsset) => {
    this.toggleAssetsModal();
    this.props.setSelectedAsset(selectedAsset);
    if (!selectedAsset.tokenId) {
      this.onInputChange(undefined, selectedAsset);
      this.handleSelectedAssetBalance(selectedAsset);
      // Wait for input to mount first
      setTimeout(() => this.amountInput?.current?.focus(), 500);
    }
  };

  assetKeyExtractor = (asset: SendFlowAsset) => {
    if (asset.tokenId) {
      return asset.address + asset.tokenId;
    }
    return asset.address;
  };

  renderToken = (token: SendFlowAsset, index: number) => {
    const {
      accounts,
      selectedAddress,
      conversionRate,
      currentCurrency,
      contractBalances,
      contractExchangeRates,
    } = this.props;
    let balance: string;
    let balanceFiat: string | undefined;
    const { address, decimals, symbol } = token;
    const colors = (this.context as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (isNativeAsset(token)) {
      balance = renderFromWei(accounts[selectedAddress].balance);
      balanceFiat = weiToFiat(
        hexToBN(accounts[selectedAddress].balance),
        conversionRate,
        currentCurrency,
      );
    } else {
      balance = renderFromTokenMinimalUnit(
        contractBalances[address],
        decimals as number,
      );
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
        // eslint-disable-next-line react/jsx-no-bind
        onPress={() => this.pickSelectedAsset(token)}
      >
        <View style={styles.assetElement}>
          {isNativeAsset(token) ? (
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

  renderCollectible = (collectible: SendFlowCollectible, index: number) => {
    const { name } = collectible;
    const colors = (this.context as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <TouchableOpacity
        key={index}
        style={styles.assetElementWrapper}
        // eslint-disable-next-line react/jsx-no-bind
        onPress={() => this.pickSelectedAsset(collectible)}
      >
        <View style={styles.assetElement}>
          <CollectibleMedia small collectible={collectible} />
          <View style={styles.assetInformationWrapper}>
            <Text style={styles.textAssetTitle}>{name}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  renderAsset = (props: ListRenderItemInfo<SendFlowAsset>) => {
    const { item: asset, index } = props;
    if (!asset.tokenId) {
      return this.renderToken(asset, index);
    }
    return this.renderCollectible(asset as SendFlowCollectible, index);
  };

  processCollectibles = () => {
    const { collectibleContracts } = this.props;
    const collectibles: SendFlowCollectible[] = [];
    const sortedCollectibles = [...this.props.collectibles].sort((a, b) => {
      if (a.address < b.address) return -1;
      if (a.address > b.address) return 1;
      return 0;
    });
    sortedCollectibles.forEach((collectible) => {
      const address = collectible.address.toLowerCase();
      const isTradable =
        !collectiblesTransferInformationByAddress[address] ||
        collectiblesTransferInformationByAddress[address]?.tradable;
      if (!isTradable) return;
      const collectibleContract = collectibleContracts.find(
        (contract) => contract.address.toLowerCase() === address,
      );
      if (!collectible.name)
        collectible.name = collectibleContract?.name as string;
      if (!collectible.image)
        collectible.image = collectibleContract?.logo as string;
      collectibles.push(collectible);
    });
    return collectibles;
  };

  renderAssetsModal = () => {
    const { assetsModalVisible } = this.state;
    const tradableCollectibles = this.collectibles.filter(
      ({ standard }) => standard === 'ERC721',
    );
    const colors = (this.context as Theme).colors || mockTheme.colors;
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

  switchCurrency = async () => {
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

  renderTokenInput = () => {
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
    const colors = (this.context as Theme).colors || mockTheme.colors;
    const themeAppearance = (this.context as Theme).themeAppearance || 'light';
    const styles = createStyles(colors);
    const navigateToSwap = () => {
      navigation.replace('Swaps', {
        screen: 'SwapsAmountView',
        params: {
          sourceToken: swapsUtils.NATIVE_SWAPS_TOKEN_ADDRESS,
          destinationToken: selectedAsset.address,
          sourcePage: 'SendFlow',
        },
      });
    };

    const isSwappable =
      !isNativeAsset(selectedAsset) &&
      AppConstants.SWAPS.ACTIVE &&
      swapsIsLive &&
      isSwapsAllowed(globalChainId) &&
      amountError === strings('transaction.insufficient');

    const navigateToBuyOrSwaps = () => {
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
        isNativeAsset(selectedAsset)
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
              keyboardAppearance={themeAppearance}
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
                <View>
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
              isNativeAsset(selectedAsset) ? (
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

  renderCollectibleInput = () => {
    const { amountError } = this.state;
    const { selectedAsset } = this.props;
    const colors = (this.context as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.collectibleInputWrapper}>
        <View style={styles.collectibleInputImageWrapper}>
          <CollectibleMedia
            small
            collectible={selectedAsset as SendFlowCollectible}
          />
        </View>
        <View style={styles.collectibleInputInformationWrapper}>
          <Text style={styles.collectibleName}>{selectedAsset.name}</Text>
          <Text style={styles.collectibleId}>{`#${renderShortText(
            selectedAsset.tokenId,
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

  render = () => {
    const {
      estimatedTotalGas,
      hasExchangeRate,
      isRedesignedTransferTransactionLoading,
    } = this.state;
    const {
      selectedAsset,
      transactionState: { isPaymentRequest },
    } = this.props;
    const colors = (this.context as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <SafeAreaView
        edges={['bottom']}
        style={styles.wrapper}
        testID={AmountViewSelectorsIDs.CONTAINER}
      >
        <ScrollView style={styles.scrollWrapper}>
          {!hasExchangeRate && !selectedAsset.tokenId ? (
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
                    {selectedAsset.symbol || strings('wallet.collectible')}
                  </Text>
                  <View>
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
                {!selectedAsset.tokenId && (
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
            {selectedAsset.tokenId
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

const mapStateToProps = (state: RootState, ownProps: AmountOwnProps) => {
  const transaction: SendFlowTransactionState =
    ownProps.transaction || state.transaction;
  const globalChainId = selectEvmChainId(state);
  const globalNetworkClientId = selectNetworkClientId(state);

  return {
    accounts: selectAccounts(state) as Record<string, { balance: string }>,
    contractExchangeRates: selectContractExchangeRatesByChainId(
      state,
      globalChainId,
    ) as Record<string, { price?: number } | undefined>,
    contractBalances: selectContractBalances(state) as Record<string, Hex>,
    collectibles: collectiblesSelector(state) as SendFlowCollectible[],
    collectibleContracts: collectibleContractsSelector(state) as NftContract[],
    conversionRate: selectConversionRateByChainId(
      state,
      globalChainId,
    ) as number,
    currentCurrency: selectCurrentCurrency(state),
    gasEstimateType: selectGasFeeControllerEstimateType(state),
    gasFeeEstimates: selectGasFeeEstimates(state),
    providerType: selectProviderTypeByChainId(state, globalChainId),
    primaryCurrency: state.settings.primaryCurrency as string,
    selectedAddress: selectSelectedInternalAccountFormattedAddress(
      state,
    ) as string,
    ticker: selectNativeCurrencyByChainId(state, globalChainId),
    tokens: selectTokens(state) as SendFlowToken[],
    transactionState: transaction,
    selectedAsset: state.transaction.selectedAsset as SendFlowAsset,
    isPaymentRequest: state.transaction.paymentRequest as boolean,
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
  prepareTransaction: (transaction: SendFlowTransaction) =>
    dispatch(prepareTransaction(transaction)),
  setSelectedAsset: (selectedAsset: SendFlowAsset) =>
    dispatch(setSelectedAsset(selectedAsset)),
  resetTransaction: () => dispatch(resetTransaction()),
  setMaxValueMode: (maxValueMode: boolean) =>
    dispatch(setMaxValueMode(maxValueMode)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  // withMetricsAwareness only preserves the `metrics` prop in its signature;
  // the remaining props are supplied by connect.
  withMetricsAwareness(
    Amount as ComponentType<Partial<AmountProps> & IWithMetricsAwarenessProps>,
  ),
);
