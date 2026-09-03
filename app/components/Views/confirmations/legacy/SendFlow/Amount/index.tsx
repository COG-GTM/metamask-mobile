import React, { ComponentType, PureComponent } from 'react';
import { fontStyles } from '../../../../../../styles/common';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  FlatList,
  InteractionManager,
  ScrollView,
} from 'react-native';
import { connect } from 'react-redux';
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
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import { BNToHex } from '@metamask/controller-utils';
import ErrorMessage from '../ErrorMessage';
import { getGasLimit } from '../../../../../../util/custom-gas';
import Engine from '../../../../../../core/Engine';
import CollectibleMedia from '../../../../../UI/CollectibleMedia';
import collectiblesTransferInformation from '../../../../../../util/collectibles-transfer.json';
import { strings } from '../../../../../../../locales/i18n';
import Device from '../../../../../../util/device';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
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

const LegacyCollectibleMedia = CollectibleMedia as unknown as React.ComponentType<
  Record<string, unknown>
>;
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
import { Dispatch } from 'redux';
import { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import { IWithMetricsAwarenessProps } from '../../../../../../components/hooks/useMetrics/withMetricsAwareness.types';
import { Theme } from '../../../../../../util/theme/models';
import { Hex } from '@metamask/utils';
import { TokenI } from '../../../../../UI/Tokens/types';

const KEYBOARD_OFFSET = Device.isSmallDevice() ? 80 : 120;

interface SelectedAsset {
  address: string;
  symbol: string;
  decimals: number;
  tokenId?: string;
  isETH?: boolean;
  name?: string;
  image?: string;
  standard?: string;
  logo?: string;
  balance?: string;
}

interface TransactionParamsShape {
  from?: string;
  to?: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: string;
  chainId?: Hex;
  networkClientId?: string;
  type?: string;
  proposedNonce?: number;
}

interface TransactionState {
  readableValue?: string;
  value?: string;
  transaction: TransactionParamsShape;
  transactionTo?: string;
  selectedAsset: SelectedAsset;
  assetType?: string;
  paymentRequest?: boolean;
  isPaymentRequest?: boolean;
}

interface OwnProps {
  navigation: NavigationProp<ParamListBase>;
  route: RouteProp<ParamListBase, string>;
  onConfirm?: () => void;
  isPaymentRequest?: boolean;
  transaction?: TransactionState;
}

interface StateProps {
  accounts: Record<string, { balance: string }>;
  collectibles: SelectedAsset[];
  collectibleContracts: SelectedAsset[];
  contractBalances: Record<string, string>;
  conversionRate?: number;
  currentCurrency: string;
  contractExchangeRates: Record<string, { price?: number }>;
  selectedAddress: string;
  tokens: SelectedAsset[];
  ticker: string;
  primaryCurrency: string;
  selectedAsset: SelectedAsset;
  transactionState: TransactionState;
  providerType: string;
  isPaymentRequest?: boolean;
  isNetworkBuyNativeTokenSupported: boolean;
  swapsIsLive: boolean;
  globalChainId: Hex;
  gasFeeEstimates: ReturnType<typeof selectGasFeeEstimates>;
  gasEstimateType: string;
  globalNetworkClientId: string;
  isRedesignedTransferConfirmationEnabled: boolean;
}

interface DispatchProps {
  setSelectedAsset: (asset: SelectedAsset) => void;
  prepareTransaction: (transaction: TransactionParamsShape) => void;
  resetTransaction: () => void;
  setMaxValueMode: (maxValueMode: boolean) => void;
}

type Props = OwnProps &
  StateProps &
  DispatchProps &
  IWithMetricsAwarenessProps;

interface State {
  maxFiatInput?: string | false;
  currentBalance?: string;
  amountError?: string;
  inputValue?: string;
  inputValueConversion?: string;
  renderableInputValueConversion?: string;
  assetsModalVisible: boolean;
  internalPrimaryCurrencyIsCrypto: boolean;
  estimatedTotalGas?: ReturnType<typeof hexToBN>;
  hasExchangeRate: boolean;
  isRedesignedTransferTransactionLoading: boolean;
}

const isSelectedAssetNative = (asset: SelectedAsset) =>
  isNativeToken(asset as unknown as TokenI);

const createStyles = (colors: Theme['colors']) =>
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
class Amount extends PureComponent<Props, State> {
  state: State = {
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

  amountInput = React.createRef<TextInput>();
  tokens: SelectedAsset[] = [];
  collectibles: SelectedAsset[] = [];

  updateNavBar = () => {
    const { navigation, route, resetTransaction: resetTransactionAction } =
      this.props;
    const colors = (
      this.context as React.ContextType<typeof ThemeContext>
    ).colors || mockTheme.colors;
    navigation.setOptions(
      getSendFlowTitle(
        'send.amount',
        navigation,
        route,
        colors,
        resetTransactionAction,
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

    this.tokens = [getEther(ticker) as SelectedAsset, ...tokens];
    this.collectibles = this.processCollectibles();
    // Wait until navigation finishes to focus
    InteractionManager.runAfterInteractions(() =>
      this.amountInput?.current?.focus?.(),
    );
    this.onInputChange(readableValue);
    !selectedAsset.tokenId && this.handleSelectedAssetBalance(selectedAsset);

    const [gas] = await Promise.all([this.estimateGasLimit()]);

    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      const feeMarketEstimates = gasFeeEstimates as {
        medium: {
          suggestedMaxPriorityFeePerGas: string;
          suggestedMaxFeePerGas: string;
        };
        estimatedBaseFee: string;
      };
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
      const gasLimitHex = BNToHex(gas);
      const gasHexes = calculateEIP1559GasFeeHexes({
        gasLimitHex,
        estimatedGasLimitHex: gasLimitHex,
        estimatedBaseFeeHex,
        suggestedMaxFeePerGasHex,
        suggestedMaxPriorityFeePerGasHex,
      });
      this.setState({
        estimatedTotalGas: hexToBN(gasHexes.gasFeeMaxHex),
      });
    } else if (gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
      const legacyGasEstimates = gasFeeEstimates as Record<string, string>;
      const gasPrice = hexToBN(decGWEIToHexWEI(
        legacyGasEstimates[AppConstants.GAS_OPTIONS.MEDIUM],
      ));
      this.setState({
        estimatedTotalGas: hexToBN(
          hexToBN(String(gas)).mul(gasPrice as never).toString(),
        ),
      });
    } else {
      const gasPrice = hexToBN(decGWEIToHexWEI(
        (gasFeeEstimates as { gasPrice: string }).gasPrice,
      ));
      this.setState({
        estimatedTotalGas: hexToBN(
          hexToBN(String(gas)).mul(gasPrice as never).toString(),
        ),
      });
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

    if (isSelectedAssetNative(selectedAsset)) {
      return !!conversionRate;
    }
    const exchangeRate =
      contractExchangeRates?.[selectedAsset.address as Hex]?.price ?? null;
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
      setSelectedAsset: setSelectedAssetAction,
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
      value = inputValue ?? '';
    } else {
      value = inputValueConversion ?? '';
      if (maxFiatInput) {
        value = `${renderFromWei(
          fiatNumberToWei(
            handleWeiNumber(maxFiatInput as string) as never,
            this.props.conversionRate as never,
          ) as never,
          18,
        )}`;
      }
    }
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (value && value.includes(',')) {
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      value = value.replace(',', '.');
    }

    value = formatValueToMatchTokenDecimals(value ?? '', selectedAsset.decimals);
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
        Keyboard.dismiss();
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

    setSelectedAssetAction(selectedAsset);
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
              : BNToHex(transaction.value as never),
        };

        await addTransaction(transactionParams as never, {
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

    const collectibleTransferTransactionProperties: TransactionParamsShape = {};

    const collectibleTransferInformation =
      (collectiblesTransferInformation as unknown as Record<
        string,
        { tradable: boolean; method: string }
      >)[selectedAsset.address.toLowerCase()];
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
          amount: Number(selectedAsset.tokenId).toString(16),
        },
      );
    }
    collectibleTransferTransactionProperties.to = selectedAsset.address;
    collectibleTransferTransactionProperties.value = '0x0';

    return collectibleTransferTransactionProperties;
  }

  prepareTransaction = async (value: string) => {
    const {
      prepareTransaction: prepareTransactionAction,
      selectedAsset,
      transactionState: { transaction, transactionTo },
    } = this.props;

    if (isSelectedAssetNative(selectedAsset)) {
      transaction.data = '0x';
      transaction.to = transactionTo;
      transaction.value = BNToHex(toWei(value) as never);
    } else if (selectedAsset.tokenId) {
      const collectibleTransferTransactionProperties =
        this.getCollectibleTranferTransactionProperties();
      transaction.data = collectibleTransferTransactionProperties.data;
      transaction.to = collectibleTransferTransactionProperties.to;
      transaction.value = collectibleTransferTransactionProperties.value;
    } else {
      const tokenAmount = toTokenMinimalUnit(value, selectedAsset.decimals);
      transaction.data = generateTransferData('transfer', {
        toAddress: transactionTo,
        amount: BNToHex(tokenAmount),
      });
      transaction.to = selectedAsset.address;
      transaction.value = '0x0';
    }
    prepareTransactionAction(transaction as never);
  };

  /**
   * Validates crypto value only
   *
   * @param {string} - Crypto value
   * @returns - Whether there is an error with the amount
   */
  validateAmount = (
    inputValue: string,
    internalPrimaryCurrencyIsCrypto: boolean,
  ) => {
    const { accounts, selectedAddress, selectedAsset, contractBalances } =
      this.props;
    const { estimatedTotalGas, inputValueConversion } = this.state;
    let value = inputValue;

    if (!internalPrimaryCurrencyIsCrypto) {
      value = inputValueConversion ?? '';
    }

    let weiBalance, weiInput, amountError;
    if (isDecimal(value)) {
      // toWei can throw error if input is not a number: Error: while converting number to string, invalid number value
      let weiValue: ReturnType<typeof toWei> | number = 0;
      try {
        weiValue = toWei(value as string);
      } catch (error) {
        amountError = strings('transaction.invalid_amount');
      }

      if (!amountError && Number(value) < 0) {
        amountError = strings('transaction.invalid_amount');
      }

      if (!amountError) {
        if (isSelectedAssetNative(selectedAsset)) {
          weiBalance = hexToBN(accounts[selectedAddress].balance);
        if (typeof weiValue !== 'number') {
          weiInput = weiValue.add(
            estimatedTotalGas as Parameters<typeof weiValue.add>[0],
          );
        }
        } else {
          weiBalance = hexToBN(contractBalances[selectedAsset.address as Hex]);
          weiInput = toTokenMinimalUnit(value, selectedAsset.decimals);
        }
        // TODO: weiBalance is not always guaranteed to be type BN. Need to consolidate type.
        amountError = gte(
          weiBalance as never,
          weiInput as never,
        )
          ? undefined
          : strings('transaction.insufficient');
      }
    } else {
      amountError = strings('transaction.invalid_amount');
    }
    if (amountError) {
      this.setState({ amountError });
      Keyboard.dismiss();
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
    const tokenBalance =
      contractBalances[selectedAsset.address as Hex] || '0x0';
    let input;
    if (isSelectedAssetNative(selectedAsset)) {
      const balanceBN = hexToBN(accounts[selectedAddress].balance);
      const realMaxValue = balanceBN.sub(estimatedTotalGas ?? hexToBN('0x0'));
      const maxValue =
        balanceBN.isZero() || realMaxValue.isNeg() ? hexToBN('0x0') : realMaxValue;
      if (internalPrimaryCurrencyIsCrypto) {
        input = fromWei(maxValue as Parameters<typeof fromWei>[0]);
      } else {
        input = `${weiToFiatNumber(
          maxValue as Parameters<typeof weiToFiatNumber>[0],
          conversionRate as number,
        )}`;
        this.setState({
          maxFiatInput: `${weiToFiatNumber(
            maxValue as Parameters<typeof weiToFiatNumber>[0],
            conversionRate as number,
            12,
          )}`,
        });
      }
    } else {
      const exchangeRate = contractExchangeRates
        ? contractExchangeRates[selectedAsset.address as Hex]?.price
        : undefined;
      if (internalPrimaryCurrencyIsCrypto || !exchangeRate) {
        input = fromTokenMinimalUnitString(
          tokenBalance,
          selectedAsset.decimals,
        );
      } else {
        input = `${balanceToFiatNumber(
          fromTokenMinimalUnitString(tokenBalance, selectedAsset.decimals),
          conversionRate as number,
          exchangeRate,
        )}`;
      }
    }
    this.onInputChange(input, undefined, true);
  };

  onInputChange = (
    inputValue?: string,
    selectedAsset: SelectedAsset = this.props.selectedAsset,
    useMax = false,
  ) => {
    const {
      contractExchangeRates,
      conversionRate,
      currentCurrency,
      ticker,
      setMaxValueMode: setMaxValueModeAction,
    } = this.props;
    const { internalPrimaryCurrencyIsCrypto } = this.state;
    setMaxValueModeAction(useMax ?? false);

    let inputValueConversion,
      renderableInputValueConversion,
      hasExchangeRate,
      comma;
    // Remove spaces from input
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    inputValue = inputValue && inputValue.replace(regex.whiteSpaces, '');
    // Handle semicolon for other languages
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (inputValue && inputValue.includes(',')) {
      comma = true;
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      inputValue = inputValue.replace(',', '.');
    }
    const processedTicker = getTicker(ticker);
    const processedInputValue = isDecimal(inputValue as string)
      ? handleWeiNumber(inputValue as string)
      : '0';
    selectedAsset = selectedAsset || this.props.selectedAsset;
    if (isSelectedAssetNative(selectedAsset)) {
      // toWei can throw error if input is not a number: Error: while converting number to string, invalid number value
      let weiValue: ReturnType<typeof toWei> | number = 0;

      try {
        weiValue = toWei(processedInputValue);
      } catch (error) {
        // Do nothing
      }

      hasExchangeRate = !!conversionRate;
      if (internalPrimaryCurrencyIsCrypto) {
        inputValueConversion = `${weiToFiatNumber(
          weiValue as never,
          conversionRate as number,
        )}`;
        renderableInputValueConversion = `${weiToFiat(
          weiValue as Parameters<typeof weiToFiat>[0],
          conversionRate as number,
          currentCurrency,
        )}`;
      } else {
        inputValueConversion = `${renderFromWei(
          fiatNumberToWei(
            processedInputValue as never,
            conversionRate as never,
          ) as never,
        )}`;
        renderableInputValueConversion = `${inputValueConversion} ${processedTicker}`;
      }
    } else {
      const exchangeRate = contractExchangeRates
        ? contractExchangeRates[selectedAsset.address as Hex]?.price
        : null;
      hasExchangeRate = !!exchangeRate;
      if (internalPrimaryCurrencyIsCrypto) {
        inputValueConversion = `${balanceToFiatNumber(
          processedInputValue as never,
          conversionRate as number,
          exchangeRate as number,
        )}`;
        renderableInputValueConversion = `${balanceToFiat(
          processedInputValue as never,
          conversionRate as number,
          exchangeRate as number,
          currentCurrency,
        )}`;
      } else {
        inputValueConversion = `${renderFromTokenMinimalUnit(
          fiatNumberToTokenMinimalUnit(
            processedInputValue as never,
            conversionRate as never,
            exchangeRate as never,
            selectedAsset.decimals as never,
          ) as never,
          selectedAsset.decimals,
        )}`;
        renderableInputValueConversion = `${inputValueConversion} ${selectedAsset.symbol}`;
      }
    }
    if (comma) {
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      inputValue = inputValue && inputValue.replace('.', ',');
    }
    inputValueConversion =
      inputValueConversion === '0' ? undefined : inputValueConversion;
    this.setState({
      inputValue,
      inputValueConversion,
      renderableInputValueConversion,
      amountError: undefined,
      hasExchangeRate,
      maxFiatInput: !useMax && undefined,
    });
  };

  toggleAssetsModal = () => {
    const { assetsModalVisible } = this.state;
    this.setState({ assetsModalVisible: !assetsModalVisible });
  };

  handleSelectedAssetBalance = (
    selectedAsset: SelectedAsset,
    renderableBalance?: string,
  ) => {
    const { accounts, selectedAddress, contractBalances } = this.props;
    let currentBalance;
    if (renderableBalance) {
      currentBalance = `${renderableBalance} ${selectedAsset.symbol}`;
    } else if (isSelectedAssetNative(selectedAsset)) {
      currentBalance = `${renderFromWei(accounts[selectedAddress].balance)} ${
        selectedAsset.symbol
      }`;
    } else {
      currentBalance = `${renderFromTokenMinimalUnit(
        contractBalances[selectedAsset.address as Hex],
        selectedAsset.decimals,
      )} ${selectedAsset.symbol}`;
    }
    this.setState({ currentBalance });
  };

  pickSelectedAsset = (selectedAsset: SelectedAsset) => {
    this.toggleAssetsModal();
    this.props.setSelectedAsset(selectedAsset);
    if (!selectedAsset.tokenId) {
      this.onInputChange(undefined, selectedAsset);
      this.handleSelectedAssetBalance(selectedAsset);
      // Wait for input to mount first
      setTimeout(
        () =>
          // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
          this.amountInput &&
          this.amountInput.current &&
          this.amountInput.current.focus(),
        500,
      );
    }
  };

  assetKeyExtractor = (asset: SelectedAsset) => {
    if (asset.tokenId) {
      return asset.address + asset.tokenId;
    }
    return asset.address;
  };

  renderToken = (token: SelectedAsset, index: number) => {
    const {
      accounts,
      selectedAddress,
      conversionRate,
      currentCurrency,
      contractBalances,
      contractExchangeRates,
    } = this.props;
    let balance, balanceFiat;
    const { address, decimals, symbol } = token;
    const colors = (
      this.context as React.ContextType<typeof ThemeContext>
    ).colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (isSelectedAssetNative(token)) {
      balance = renderFromWei(accounts[selectedAddress].balance);
      balanceFiat = weiToFiat(
        hexToBN(accounts[selectedAddress].balance),
        conversionRate,
        currentCurrency,
      );
    } else {
      balance = renderFromTokenMinimalUnit(
        contractBalances[address as Hex],
        decimals,
      );
      const exchangeRate = contractExchangeRates
        ? contractExchangeRates[address as Hex]?.price
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
          {isSelectedAssetNative(token) ? (
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

  renderCollectible = (collectible: SelectedAsset, index: number) => {
    const { name } = collectible;
    const colors = (
      this.context as React.ContextType<typeof ThemeContext>
    ).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <TouchableOpacity
        key={index}
        style={styles.assetElementWrapper}
        // eslint-disable-next-line react/jsx-no-bind
        onPress={() => this.pickSelectedAsset(collectible)}
      >
        <View style={styles.assetElement}>
          <LegacyCollectibleMedia
            small
            collectible={
              collectible as unknown as React.ComponentProps<
                typeof CollectibleMedia
              >['collectible']
            }
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

  renderAsset = ({ item: asset, index }: { item: SelectedAsset; index: number }) => {
    if (!asset.tokenId) {
      return this.renderToken(asset, index);
    }
    return this.renderCollectible(asset, index);
  };

  processCollectibles = () => {
    const { collectibleContracts } = this.props;
    const collectibles: SelectedAsset[] = [];
    const sortedCollectibles = [...this.props.collectibles].sort((a, b) => {
      if (a.address < b.address) return -1;
      if (a.address > b.address) return 1;
      return 0;
    });
    sortedCollectibles.forEach((collectible: SelectedAsset) => {
      const address = collectible.address.toLowerCase();
      const isTradable =
        (collectiblesTransferInformation as Record<
          string,
          { tradable: boolean }
        >)[address]?.tradable !== false;
      if (!isTradable) return;
      const collectibleContract = collectibleContracts.find(
        (contract: SelectedAsset) => contract.address.toLowerCase() === address,
      );
      if (!collectibleContract) return;
      if (!collectibleContract) return;
      if (!collectible.name) collectible.name = collectibleContract.name;
      if (!collectible.image) collectible.image = collectibleContract.logo;
      collectibles.push(collectible);
    });
    return collectibles;
  };

  renderAssetsModal = () => {
    const { assetsModalVisible } = this.state;
    const tradableCollectibles = this.collectibles.filter(
      ({ standard }) => standard === 'ERC721',
    );
    const colors = (
      this.context as React.ContextType<typeof ThemeContext>
    ).colors || mockTheme.colors;
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
    const colors = (
      this.context as React.ContextType<typeof ThemeContext>
    ).colors || mockTheme.colors;
    const themeAppearance = (
      this.context as React.ContextType<typeof ThemeContext>
    ).themeAppearance || 'light';
    const styles = createStyles(colors);
    const navigateToSwap = () => {
      (
        navigation as NavigationProp<ParamListBase> & {
          replace: (name: string, params: Record<string, unknown>) => void;
        }
      ).replace('Swaps', {
        screen: 'SwapsAmountView',
        params: {
          sourceToken: swapsUtils.NATIVE_SWAPS_TOKEN_ADDRESS,
          destinationToken: selectedAsset.address,
          sourcePage: 'SendFlow',
        },
      });
    };

    const isSwappable =
      !isSelectedAssetNative(selectedAsset) &&
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
        isSelectedAssetNative(selectedAsset)
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
                  {renderableInputValueConversion as never}
                </Text>
                <View
                  {...({ styles: styles.switchWrapper } as Record<string, unknown>)}
                >
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
              isSelectedAssetNative(selectedAsset) ? (
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
    const colors = (
      this.context as React.ContextType<typeof ThemeContext>
    ).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.collectibleInputWrapper}>
        <View style={styles.collectibleInputImageWrapper}>
                <LegacyCollectibleMedia
            small
            containerStyle={styles.CollectibleMedia}
            iconStyle={styles.CollectibleMedia}
            collectible={selectedAsset}
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
    const colors = (
      this.context as React.ContextType<typeof ThemeContext>
    ).colors || mockTheme.colors;
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
                  {(_textStyle: unknown) => (
                <View style={styles.warningTextContainer}>
                  <Text
                    {...({ red: true } as Record<string, unknown>)}
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
                  <View
                    style={
                      (styles as typeof styles & { arrow: object }).arrow
                    }
                  >
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

Amount.contextType = ThemeContext;

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
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
    conversionRate: selectConversionRateByChainId(
      state,
      globalChainId,
    ) as number | undefined,
    currentCurrency: selectCurrentCurrency(state),
    gasEstimateType: selectGasFeeControllerEstimateType(state),
    gasFeeEstimates: selectGasFeeEstimates(state),
    providerType: selectProviderTypeByChainId(
      state,
      globalChainId,
    ) as string,
    primaryCurrency: state.settings.primaryCurrency,
    selectedAddress: selectSelectedInternalAccountFormattedAddress(state) as string,
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

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  prepareTransaction: (transaction) =>
    dispatch(prepareTransaction(transaction)),
  setSelectedAsset: (selectedAsset) =>
    dispatch(setSelectedAsset(selectedAsset)),
  resetTransaction: () => dispatch(resetTransaction()),
  setMaxValueMode: (maxValueMode) => dispatch(setMaxValueMode(maxValueMode)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(Amount as unknown as ComponentType<IWithMetricsAwarenessProps>));
