import React, { PureComponent, type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import AnimatedTransactionModal from '../../../../../../UI/AnimatedTransactionModal';
import TransactionReview from '../../../components/TransactionReview';
import {
  hexToBN,
  fromWei,
  renderFromWei,
  toHexadecimal,
} from '../../../../../../../util/number';
import { isValidAddress, addHexPrefix } from 'ethereumjs-util';
import BN from 'bnjs4';
import { strings } from '../../../../../../../../locales/i18n';
import { connect } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  generateTransferData,
  getNormalizedTxState,
  getTicker,
  getActiveTabUrl,
  parseTransactionEIP1559,
  parseTransactionLegacy,
} from '../../../../../../../util/transactions';
import {
  setTransactionObject as setTransactionObjectAction,
} from '../../../../../../../actions/transaction';
import Engine from '../../../../../../../core/Engine';
import collectiblesTransferInformation from '../../../../../../../util/collectibles-transfer.json';
import { safeToChecksumAddress } from '../../../../../../../util/address';
import { shallowEqual } from '../../../../../../../util/general';
import EditGasFee1559 from '../../../../../../UI/EditGasFee1559';
import EditGasFeeLegacy from '../../../components/EditGasFeeLegacyUpdate';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import AppConstants from '../../../../../../../core/AppConstants';
import {
  estimateGas,
  validateAmount,
  getGasAnalyticsParams,
  handleGasFeeSelection,
  handleGetGasLimit,
} from '../../../../../../../util/dappTransactions';
import {
  selectConversionRateByChainId,
  selectCurrentCurrency,
} from '../../../../../../../selectors/currencyRateController';
import { selectAccounts } from '../../../../../../../selectors/accountTrackerController';
import { selectContractBalances } from '../../../../../../../selectors/tokenBalancesController';
import { selectSelectedInternalAccountFormattedAddress } from '../../../../../../../selectors/accountsController';
import { selectGasFeeEstimates } from '../../../../../../../selectors/confirmTransaction';
import { selectGasFeeControllerEstimateType } from '../../../../../../../selectors/gasFeeController';
import { selectNativeCurrencyByChainId, selectProviderTypeByChainId } from '../../../../../../../selectors/networkController';
import type { RootState } from '../../../../../../../reducers';
import type { Dispatch } from 'redux';

const REVIEW = 'review';

const styles = StyleSheet.create({
  keyboardAwareWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});

/**
 * PureComponent that supports editing and reviewing a transaction
 */
interface LegacyTransaction {
  origin?: string;
  chainId?: string;
  type?: string;
  from?: string;
  to?: string;
  value?: string | number;
  gas?: string | number;
  gasPrice?: string | number;
  data?: string;
  assetType?: string;
  readableValue?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  selectedAsset: {
    address: string;
    tokenId: string | number;
  };
}

interface GasData {
  [key: string]: string | number | boolean | BN | null | GasData | undefined;
  suggestedGasLimit?: string | number | BN;
  suggestedGasPrice?: string | number | BN;
  suggestedMaxFeePerGas?: string | number | BN;
  suggestedMaxPriorityFeePerGas?: string | number | BN;
  suggestedGasLimitHex?: string;
  suggestedGasPriceHex?: string;
  totalHex?: string;
  totalMaxHex?: string;
  error?: string;
  renderableGasFeeMinNative?: string;
  renderableGasFeeMinConversion?: string;
  renderableGasFeeMaxNative?: string;
  renderableGasFeeMaxConversion?: string;
  renderableMaxPriorityFeeNative?: string;
  renderableMaxPriorityFeeConversion?: string;
  renderableMaxFeePerGasNative?: string;
  renderableMaxFeePerGasConversion?: string;
  timeEstimate?: string;
  timeEstimateColor?: string;
  timeEstimateId?: string;
  selectedOption?: string | null;
  transactionFee?: string;
  transactionFeeFiat?: string;
  gasLimitHex?: string;
  gasFeeMaxNative?: string;
  gasFeeMinNative?: string;
  maxPriorityFeeNative?: string;
  suggestedMaxFeePerGasHex?: string;
  suggestedMaxPriorityFeePerGasHex?: string;
}

interface State {
  toFocused: boolean;
  ensRecipient?: string;
  ready: boolean;
  error: boolean | string;
  data?: string;
  amountError: string;
  toAddressError: string;
  over: boolean;
  gasSelected: string | null;
  gasSelectedTemp: string | null;
  EIP1559GasData: GasData;
  EIP1559GasDataTemp: GasData;
  LegacyGasData: GasData;
  LegacyGasDataTemp: GasData;
  legacyGasObject: GasData;
  legacyGasTransaction: GasData;
  suggestedMaxFeePerGas?: string | number | BN;
  dappSuggestedGasPrice?: string | null;
  dappSuggestedEIP1559Gas?: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  } | null;
  pollToken?: string;
  advancedGasInserted?: boolean;
  animateOnChange?: boolean;
  stopUpdateGas?: boolean;
  isAnimating?: boolean;
}

interface OwnProps {
  mode?: string;
  onCancel?: () => void;
  onConfirm?: (params: {
    gasEstimateType?: string;
    EIP1559GasData: GasData;
    gasSelected: string | null;
  }) => void;
  onModeChange?: (mode: string) => void;
  transactionConfirmed?: boolean;
  promptedFromApproval?: boolean;
}

interface StateProps {
  accounts: Record<string, { balance: string }>;
  transaction: LegacyTransaction;
  contractBalances?: Record<string, unknown>;
  selectedAddress?: string;
  ticker?: string;
  gasEstimateType?: string;
  gasFeeEstimates: Record<string, GasData> & {
    estimatedBaseFee?: string;
    gasPrice?: GasData;
  };
  primaryCurrency?: string;
  chainId?: string;
  networkType?: string;
  activeTabUrl?: string;
  conversionRate?: string | number | null;
  currentCurrency?: string | number | null;
}

interface DispatchProps {
  setTransactionObject: (transaction: Record<string, unknown>) => void;
}

type Props = OwnProps & StateProps & DispatchProps;

const parseTransactionEIP1559Typed = parseTransactionEIP1559 as unknown as (
  params: unknown,
  options: { onlyGas: boolean },
) => GasData;
const parseTransactionLegacyTyped = parseTransactionLegacy as unknown as (
  params: unknown,
  options: { onlyGas: boolean },
) => GasData;
const handleGasFeeSelectionTyped = handleGasFeeSelection as unknown as (
  gasLimit: unknown,
  gasPrice: unknown,
  setTransactionObject: (transaction: Record<string, unknown>) => void,
) => void;
const handleGetGasLimitTyped = handleGetGasLimit as unknown as (
  transaction: unknown,
  setTransactionObject: (transaction: Record<string, unknown>) => void,
) => void;
const generateTransferDataTyped = generateTransferData as unknown as (
  method: string,
  params: unknown,
) => unknown;
const validateAmountTyped = validateAmount as unknown as (
  ...args: unknown[]
) => Promise<string>;
const estimateGasTyped = estimateGas as unknown as (
  params: unknown,
  transaction: unknown,
) => Promise<{ gas: string }>;
const getGasAnalyticsParamsTyped = getGasAnalyticsParams as unknown as (
  ...args: unknown[]
) => Record<string, unknown>;
const TransactionReviewComponent = TransactionReview as unknown as ComponentType<
  Record<string, unknown>
>;
const EditGasFeeLegacyComponent = EditGasFeeLegacy as unknown as ComponentType<
  Record<string, unknown>
>;
const EditGasFee1559Component = EditGasFee1559 as unknown as ComponentType<
  Record<string, unknown>
>;

class TransactionEditor extends PureComponent<Props, State> {
  state: State = {
    toFocused: false,
    ensRecipient: undefined,
    ready: false,
    // here error is defaulted to true until its confirmed that there is no error
    error: true,
    data: undefined,
    amountError: '',
    toAddressError: '',
    over: false,
    gasSelected: AppConstants.GAS_OPTIONS.MEDIUM,
    gasSelectedTemp: AppConstants.GAS_OPTIONS.MEDIUM,
    EIP1559GasData: {},
    EIP1559GasDataTemp: {},
    LegacyGasData: {},
    LegacyGasDataTemp: {},
    legacyGasObject: {},
    legacyGasTransaction: {},
    suggestedMaxFeePerGas: undefined,
  };

  computeGasEstimates = async (gasEstimateTypeChanged: boolean) => {
    const {
      transaction,
      gasEstimateType,
      gasFeeEstimates,
      setTransactionObject,
    } = this.props;
    const { dappSuggestedGasPrice, dappSuggestedEIP1559Gas } = this.state;

    const gasSelected = gasEstimateTypeChanged
      ? AppConstants.GAS_OPTIONS.MEDIUM
      : this.state.gasSelected;
    const gasSelectedTemp = gasEstimateTypeChanged
      ? AppConstants.GAS_OPTIONS.MEDIUM
      : this.state.gasSelectedTemp;

    const dappSuggestedGas = dappSuggestedGasPrice || dappSuggestedEIP1559Gas;

    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      let initialGas, initialGasTemp;
      if (dappSuggestedEIP1559Gas) {
        initialGas = {
          suggestedMaxFeePerGas: fromWei(
            dappSuggestedEIP1559Gas.maxFeePerGas,
            'gwei',
          ),
          suggestedMaxPriorityFeePerGas: fromWei(
            dappSuggestedEIP1559Gas.maxPriorityFeePerGas,
            'gwei',
          ),
        };
        initialGasTemp = initialGas;
      } else if (dappSuggestedGasPrice) {
        initialGas = {
          suggestedMaxFeePerGas: fromWei(dappSuggestedGasPrice, 'gwei'),
          suggestedMaxPriorityFeePerGas: fromWei(dappSuggestedGasPrice, 'gwei'),
        };
        initialGasTemp = initialGas;
      } else {
        initialGas = gasFeeEstimates[gasSelected ?? ''] as GasData;
        initialGasTemp = gasFeeEstimates[gasSelectedTemp ?? ''] as GasData;
      }

      const suggestedGasLimit = fromWei(
        transaction.gas as string | number,
        'wei',
      );

      const EIP1559GasData = this.parseTransactionDataEIP1559({
        ...initialGas,
        suggestedGasLimit,
        selectedOption: gasSelected,
      });

      let EIP1559GasDataTemp;
      if (gasSelected === gasSelectedTemp) {
        EIP1559GasDataTemp = EIP1559GasData;
      } else {
        EIP1559GasDataTemp = this.parseTransactionDataEIP1559({
          ...initialGasTemp,
          suggestedGasLimit,
          selectedOption: gasSelectedTemp,
        });
      }

      await this.validate(EIP1559GasData);
      this.setState(
        {
          ready: true,
          EIP1559GasData,
          EIP1559GasDataTemp,
          LegacyGasData: {},
          LegacyGasDataTemp: {},
          advancedGasInserted: Boolean(dappSuggestedGas),
          gasSelected: dappSuggestedGas ? null : gasSelected,
          gasSelectedTemp,
          animateOnChange: true,
          suggestedMaxFeePerGas: initialGas.suggestedMaxFeePerGas,
        },
        () => {
          this.setState({ animateOnChange: false });
        },
      );
    } else if (this.props.gasEstimateType !== GAS_ESTIMATE_TYPES.NONE) {
      const suggestedGasLimit = fromWei(
        transaction.gas as string | number,
        'wei',
      );
      const getGas = (selected: string): string | number | BN =>
        (dappSuggestedGasPrice
          ? fromWei(dappSuggestedGasPrice, 'gwei')
          : gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY
            ? this.props.gasFeeEstimates[selected]
            : this.props.gasFeeEstimates.gasPrice) as unknown as
          | string
          | number
          | BN;

      const LegacyGasData = this.parseTransactionDataLegacy(
        {
          suggestedGasPrice: getGas(gasSelected ?? ''),
          suggestedGasLimit,
        },
      );

      handleGasFeeSelectionTyped(
        hexToBN(LegacyGasData.suggestedGasLimitHex as string),
        hexToBN(LegacyGasData.suggestedGasPriceHex as string),
        setTransactionObject,
      );

      let LegacyGasDataTemp;
      if (gasSelected === gasSelectedTemp) {
        LegacyGasDataTemp = LegacyGasData;
      } else {
        LegacyGasDataTemp = this.parseTransactionDataLegacy({
          suggestedGasPrice: getGas(gasSelectedTemp ?? ''),
          suggestedGasLimit,
        });
      }

      this.setState(
        {
          ready: true,
          LegacyGasData,
          LegacyGasDataTemp,
          EIP1559GasData: {},
          EIP1559GasDataTemp: {},
          advancedGasInserted: Boolean(dappSuggestedGasPrice),
          gasSelected: dappSuggestedGasPrice ? null : gasSelected,
          gasSelectedTemp,
          animateOnChange: true,
        },
        () => {
          this.setState({ animateOnChange: false });
        },
      );

      await this.validate(undefined, LegacyGasData);
    }
  };

  startPolling = async () => {
    const { GasFeeController } = Engine.context;
    const pollToken = await GasFeeController.getGasFeeEstimatesAndStartPolling(
      this.state.pollToken,
    );
    this.setState({ pollToken });
  };

  componentDidMount = async () => {
    const { transaction, setTransactionObject } = this.props;

    const zeroGas = new BN('00');
    const hasGasPrice = Boolean(transaction.gasPrice);
    const hasGasLimit =
      Boolean(transaction.gas) &&
      !new BN(transaction.gas as string | number).eq(zeroGas);
    const hasEIP1559Gas =
      Boolean(transaction.maxFeePerGas) &&
      Boolean(transaction.maxPriorityFeePerGas);
    if (!hasGasLimit) handleGetGasLimitTyped(transaction, setTransactionObject);

    if (!hasGasPrice && !hasEIP1559Gas) {
      this.startPolling();
    } else if (hasEIP1559Gas) {
      this.setState(
        {
          dappSuggestedEIP1559Gas: {
            maxFeePerGas: transaction.maxFeePerGas as string,
            maxPriorityFeePerGas: transaction.maxPriorityFeePerGas as string,
          },
        },
        this.startPolling,
      );
    } else if (hasGasPrice) {
      this.setState(
        { dappSuggestedGasPrice: transaction.gasPrice as string },
        this.startPolling,
      );
    }

    if (transaction?.value) {
      this.handleUpdateAmount(transaction.value, true);
    }
    if (transaction && transaction.assetType === 'ETH') {
      this.handleUpdateReadableValue(fromWei(transaction.value));
    }
    if (transaction?.data) {
      this.setState({ data: transaction.data });
    }
  };

  parseTransactionDataEIP1559 = (gasFee: GasData) => {
    const { ticker } = this.props;

    const parsedTransactionEIP1559 = parseTransactionEIP1559Typed(
      {
        ...this.props,
        nativeCurrency: ticker,
        selectedGasFee: {
          ...gasFee,
          estimatedBaseFee: this.props.gasFeeEstimates.estimatedBaseFee,
        },
      },
      { onlyGas: true },
    );

    parsedTransactionEIP1559.error = this.validateTotal(
      parsedTransactionEIP1559.totalMaxHex ?? '0x0',
    );

    return parsedTransactionEIP1559;
  };

  parseTransactionDataLegacy = (gasFee: GasData) => {
    const { ticker } = this.props;

    const parsedTransactionLegacy = parseTransactionLegacyTyped(
      {
        ...this.props,
        nativeCurrency: ticker,
        selectedGasFee: gasFee,
      },
      { onlyGas: true },
    );

    parsedTransactionLegacy.error = this.validateTotal(
      parsedTransactionLegacy.totalHex ?? '0x0',
    );

    return parsedTransactionLegacy;
  };

  componentDidUpdate = (prevProps: Props) => {
    const { transaction } = this.props;
    if (transaction.data !== prevProps.transaction.data) {
      this.handleUpdateData(transaction.data as string);
    }

    const gasEstimateTypeChanged =
      prevProps.gasEstimateType !== this.props.gasEstimateType;

    if (
      (!this.state.stopUpdateGas && !this.state.advancedGasInserted) ||
      gasEstimateTypeChanged
    ) {
      if (
        this.props.gasFeeEstimates &&
        transaction.gas &&
        (!shallowEqual(prevProps.gasFeeEstimates, this.props.gasFeeEstimates) ||
          !new BN(transaction.gas as string | number).eq(
            prevProps?.transaction?.gas as unknown as BN,
          ) ||
          !this.state.ready)
      ) {
        this.computeGasEstimates(gasEstimateTypeChanged);
      }
    }

    if (
      prevProps.transaction !== this.props.transaction ||
      prevProps.selectedAddress !== this.props.selectedAddress ||
      prevProps.contractBalances !== this.props.contractBalances
    ) {
      this.validate();
    }
  };

  componentWillUnmount = () => {
    const { GasFeeController } = Engine.context;
    (
      GasFeeController.stopPolling as unknown as (pollToken: string) => void
    )(this.state.pollToken as string);
  };

  /**
   * Call callback when transaction is cancelled
   */
  onCancel = () => {
    const { onCancel } = this.props;
    onCancel && onCancel();
  };

  /**
   * Call callback when transaction is confirmed, after being validated
   */
  onConfirm = async () => {
    const { onConfirm, gasEstimateType } = this.props;
    const { EIP1559GasData, gasSelected } = this.state;
    !(await this.validate()) &&
      onConfirm &&
      onConfirm({ gasEstimateType, EIP1559GasData, gasSelected });
  };

  /**
   * Updates value in transaction state
   * If is an asset transaction it generates data to send and estimates gas again with new value and new data
   *
   * @param {object} amount - BN object containing transaction amount
   * @param {bool} mounting - Whether the view is mounting, in that case it should use the gas from transaction state
   */
  handleUpdateAmount = async (
    amount: string | number,
    mounting = false,
  ) => {
    const {
      transaction: { to, data, assetType, gas: gasLimit },
      transaction,
    } = this.props;
    // If ETH transaction, there is no need to generate new data
    if (assetType === 'ETH') {
      const { gas } = mounting
        ? { gas: gasLimit }
        : await estimateGasTyped({ amount, data, to }, transaction);
      this.props.setTransactionObject({ value: amount, to, gas: hexToBN(gas) });
    }
    // If selectedAsset defined, generates data
    else if (assetType === 'ERC20') {
      const res = await this.handleDataGeneration({ value: amount });
      const gas = mounting ? gasLimit : res.gas;
      this.props.setTransactionObject({
        value: amount,
        to,
        gas: hexToBN(gas),
        data: res.data,
      });
    }
  };

  /**
   * Updates readableValue in state
   *
   * @param {string} readableValue - String containing the readable value
   */
  handleUpdateReadableValue = (readableValue: string) => {
    this.props.setTransactionObject({ readableValue });
  };

  /**
   * Updates data in transaction state, after gas is estimated according to this data
   *
   * @param {string} data - String containing new data
   */
  handleUpdateData = async (data: string) => {
    const { transaction } = this.props;
    const { gas } = await estimateGasTyped({ data }, transaction);
    this.setState({ data });
    this.props.setTransactionObject({ gas: hexToBN(gas), data });
  };

  /**
   * Handle data generation is selectedAsset is defined in transaction
   *
   * @param {object} opts? - Optional object to customize data generation, containing selectedAsset, value and to
   * @returns {object} - Object containing data and gas, according to new generated data
   */
  handleDataGeneration = async (opts: {
    selectedAsset?: NonNullable<LegacyTransaction['selectedAsset']>;
    value?: string | number;
    to?: string;
  }) => {
    const {
      transaction: { from },
      transaction,
    } = this.props;
    const selectedAsset = opts.selectedAsset
      ? opts.selectedAsset
      : transaction.selectedAsset;
    const assetType = selectedAsset.tokenId ? 'ERC721' : 'ERC20';
    const value = opts.value ? opts.value : transaction.value;
    const to = opts.to ? opts.to : transaction.to;
    const generateData = {
      ERC20: () => {
        // Use raw data when transaction with walletconnect
        // Additional parameters can enrich the transaction information for ERC20, such as orders or goods
        // These additional parameters have been tested on the metamask-extension and Ethereum mainnet
        if (transaction.data) {
          return transaction.data;
        }

        const tokenAmountToSend = selectedAsset && value?.toString(16);
        return to && tokenAmountToSend
          ? generateTransferDataTyped('transfer', {
            toAddress: to,
            amount: tokenAmountToSend,
          })
          : undefined;
      },
      ERC721: () => {
        const address = selectedAsset.address.toLowerCase();
        const collectibleTransferInformation =
          address in collectiblesTransferInformation &&
          (
            collectiblesTransferInformation as unknown as Record<
              string,
              { name: string; tradable: boolean; method: string }
            >
          )[address];
        if (!to) return;
        // If not in list,, default to transferFrom
        if (
          !collectibleTransferInformation ||
          (collectibleTransferInformation.tradable &&
            collectibleTransferInformation.method === 'transferFrom')
        ) {
          return generateTransferDataTyped('transferFrom', {
            fromAddress: from,
            toAddress: to,
            tokenId: toHexadecimal(selectedAsset.tokenId),
          });
        } else if (
          collectibleTransferInformation.tradable &&
          collectibleTransferInformation.method === 'transfer'
        ) {
          return generateTransferDataTyped('transfer', {
            toAddress: to,
            amount: selectedAsset.tokenId.toString(16),
          });
        }
      },
    };
    const data = generateData[assetType]();
    const { gas } = await estimateGasTyped(
      { data, to: selectedAsset.address },
      transaction,
    );
    return { data, gas };
  };

  validateTotal = (totalGas: string | number) => {
    let error = '';
    const {
      ticker,
      transaction: { value, from, assetType },
    } = this.props;

    const checksummedFrom = safeToChecksumAddress(from ?? '') || '';
    const fromAccount = this.props.accounts[checksummedFrom];
    const { balance } = fromAccount;
    const weiBalance = hexToBN(balance);
    const totalGasValue = hexToBN(totalGas);
    let valueBN = hexToBN('0x0');
    if (assetType === 'ETH') {
      valueBN = hexToBN(value);
    }
    const total = valueBN.add(totalGasValue);
    if (!weiBalance.gte(total)) {
      const amount = renderFromWei(total.sub(weiBalance));
      const tokenSymbol = getTicker(ticker);
      this.setState({ over: true });
      error = strings('transaction.insufficient_amount', {
        amount,
        tokenSymbol,
      });
    }
    return error;
  };

  /**
   * Validates transaction to address
   *
   * @returns {string} - String containing error message whether the transaction to address is valid or not
   */
  validateToAddress = () => {
    let error;
    const {
      transaction: { to },
      promptedFromApproval,
    } = this.props;
    // If it comes from a dapp it could be a contract deployment
    if (promptedFromApproval && !to) return error;
    !to && (error = strings('transaction.required'));
    !to && this.state.toFocused && (error = strings('transaction.required'));
    to &&
      !isValidAddress(to) &&
      (error = strings('transaction.invalid_address'));
    to && to.length !== 42 && (error = strings('transaction.invalid_address'));
    return error;
  };

  review = async () => {
    const { data } = this.state;
    await this.setState({ toFocused: true });
    const validated = !(await this.validate());
    if (validated) {
      if (data && data.substr(0, 2) !== '0x') {
        this.handleUpdateData(addHexPrefix(data));
      }
    }
    this.props.onModeChange?.(REVIEW);
  };

  validate = async (
    EIP1559GasData?: GasData,
    LegacyGasData?: GasData,
  ) => {
    const {
      transaction: {
        assetType,
        selectedAsset: { address, tokenId },
      },
      selectedAddress,
      transaction,
      contractBalances,
    } = this.props;

    const totalError = this.validateTotal(
      EIP1559GasData?.totalMaxHex ||
      this.state.EIP1559GasData.totalMaxHex ||
      LegacyGasData?.totalHex ||
      this.state.LegacyGasData.totalHex || '0x0',
    );
    const amountError = await validateAmountTyped(
      assetType,
      address,
      tokenId,
      selectedAddress,
      transaction,
      contractBalances,
      false,
    );
    const toAddressError = this.validateToAddress();
    this.setState({
      amountError: totalError || amountError,
      toAddressError,
      error: totalError || amountError || toAddressError,
    });
    return totalError || amountError || toAddressError;
  };

  calculateTempGasFee = (gas: GasData, selected: string | null) => {
    const { transaction } = this.props;
    if (selected && gas) {
      gas.suggestedGasLimit = fromWei(
        transaction.gas as string | number,
        'wei',
      );
    }
    this.setState({
      EIP1559GasDataTemp: this.parseTransactionDataEIP1559({
        ...gas,
        selectedOption: selected,
      }),
      stopUpdateGas: !selected,
      gasSelectedTemp: selected,
    });
  };

  saveGasEdition = (gasSelected: string | null) => {
    const { gasEstimateType, setTransactionObject } = this.props;
    const { LegacyGasDataTemp } = this.state;

    if (gasEstimateType !== GAS_ESTIMATE_TYPES.FEE_MARKET) {
      handleGasFeeSelectionTyped(
        hexToBN(LegacyGasDataTemp.suggestedGasLimitHex as string),
        hexToBN(LegacyGasDataTemp.suggestedGasPriceHex as string),
        setTransactionObject,
      );
    }

    this.setState(
      {
        LegacyGasData: { ...this.state.LegacyGasDataTemp },
        EIP1559GasData: { ...this.state.EIP1559GasDataTemp },
        gasSelected,
        gasSelectedTemp: gasSelected,
        advancedGasInserted: !gasSelected,
        stopUpdateGas: false,
        dappSuggestedGasPrice: null,
        dappSuggestedEIP1559Gas: null,
      },
      this.review,
    );
  };

  calculateTotalGasValue = (totalHex: string) => fromWei(totalHex);

  updateEIP1559GasDataFromLegacyTransaction = ({
    legacyGasTransaction,
    totalGasValue,
  }: {
    legacyGasTransaction: GasData;
    totalGasValue: string;
  }): GasData => ({
    // These values are updated to EIP1559GasData to reflect the gas values on the review UI
    suggestedGasLimit: legacyGasTransaction.suggestedGasLimit,
    renderableGasFeeMaxNative: legacyGasTransaction.transactionFee,
    renderableGasFeeMinConversion: legacyGasTransaction.transactionFeeFiat,
    renderableGasFeeMinNative: legacyGasTransaction.transactionFee,
    gasFeeMaxNative: totalGasValue,
    gasFeeMinNative: totalGasValue,
    maxPriorityFeeNative: totalGasValue,
    renderableMaxPriorityFeeNative: legacyGasTransaction.transactionFee,
    renderableMaxFeePerGasNative: legacyGasTransaction.transactionFee,
    gasLimitHex: legacyGasTransaction?.suggestedGasLimitHex,
    totalMaxHex: legacyGasTransaction?.totalHex,

    // These values are updated to be able to submit to the network
    suggestedMaxFeePerGas: legacyGasTransaction?.suggestedGasPrice,
    suggestedMaxFeePerGasHex: legacyGasTransaction?.suggestedGasPriceHex,
    suggestedMaxPriorityFeePerGas: legacyGasTransaction?.suggestedGasPrice,
    suggestedMaxPriorityFeePerGasHex:
      legacyGasTransaction?.suggestedGasPriceHex,
  });

  saveGasEditionLegacy = (
    legacyGasTransaction: GasData,
    legacyGasObject: GasData,
  ) => {
    const { setTransactionObject, gasEstimateType } = this.props;
    const totalHex = legacyGasTransaction?.totalHex;
    legacyGasTransaction.error = this.validateTotal(totalHex ?? '0x0');

    handleGasFeeSelectionTyped(
      hexToBN(legacyGasTransaction.suggestedGasLimitHex as string),
      hexToBN(legacyGasTransaction.suggestedGasPriceHex as string),
      setTransactionObject,
    );

    this.setState({
      stopUpdateGas: false,
      legacyGasTransaction,
      legacyGasObject,
    });

    // conditionally save to EIP1559GasData when gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET
    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      const totalGasValue = this.calculateTotalGasValue(totalHex ?? '0x0');
      const get1559TransactionData =
        this.updateEIP1559GasDataFromLegacyTransaction({
          legacyGasTransaction,
          totalGasValue,
        });

      this.setState({
        EIP1559GasData: {
          ...this.state.EIP1559GasData,
          ...get1559TransactionData,
        },
      });
    }
    this.review();
  };

  cancelGasEdition = () => {
    this.setState({
      LegacyGasDataTemp: { ...this.state.LegacyGasData },
      EIP1559GasDataTemp: { ...this.state.EIP1559GasData },
      stopUpdateGas: false,
      gasSelectedTemp: this.state.gasSelected,
    });
    this.props.onModeChange?.('review');
  };

  cancelGasEditionLegacy = () => {
    this.setState({
      stopUpdateGas: false,
    });
    this.review();
  };

  renderWarning = () => {
    const { dappSuggestedGasPrice, dappSuggestedEIP1559Gas } = this.state;
    const {
      transaction: { origin },
      gasEstimateType,
    } = this.props;
    if (
      dappSuggestedGasPrice &&
      gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET
    )
      return strings('transaction.dapp_suggested_gas', { origin });
    if (
      dappSuggestedEIP1559Gas ||
      gasEstimateType !== GAS_ESTIMATE_TYPES.FEE_MARKET
    )
      return strings('transaction.dapp_suggested_eip1559_gas', { origin });

    return null;
  };

  onUpdatingValuesStart = () => {
    this.setState({ isAnimating: true });
  };
  onUpdatingValuesEnd = () => {
    this.setState({ isAnimating: false });
  };

  render = () => {
    const {
      mode,
      transactionConfirmed,
      onModeChange,
      gasFeeEstimates,
      primaryCurrency,
      gasEstimateType,
      transaction,
      chainId,
    } = this.props;
    const {
      ready,
      error,
      over,
      EIP1559GasData,
      EIP1559GasDataTemp,
      gasSelected,
      dappSuggestedGasPrice,
      dappSuggestedEIP1559Gas,
      animateOnChange,
      isAnimating,
      legacyGasObject,
      suggestedMaxFeePerGas,
      legacyGasTransaction,
    } = this.state;

    const selectedLegacyGasObject = {
      legacyGasLimit: legacyGasObject?.legacyGasLimit,
      suggestedGasPrice:
        legacyGasObject?.suggestedGasPrice || suggestedMaxFeePerGas,
    };

    const showLegacyGasEditModal =
      transaction?.type === '0x0' ||
      gasEstimateType !== GAS_ESTIMATE_TYPES.FEE_MARKET;

    return (
      <React.Fragment>
        {mode === 'review' && (
          <KeyboardAwareScrollView
            contentContainerStyle={styles.keyboardAwareWrapper}
          >
            <AnimatedTransactionModal
              onModeChange={onModeChange}
              ready={ready}
              review={this.review}
            >
              <TransactionReviewComponent
                onCancel={this.onCancel}
                onConfirm={this.onConfirm}
                ready={ready}
                error={error}
                gasSelected={gasSelected}
                transactionConfirmed={transactionConfirmed}
                over={over}
                gasEstimateType={gasEstimateType}
                EIP1559GasData={EIP1559GasData}
                onUpdatingValuesStart={this.onUpdatingValuesStart}
                onUpdatingValuesEnd={this.onUpdatingValuesEnd}
                animateOnChange={animateOnChange}
                isAnimating={isAnimating}
                dappSuggestedGas={
                  Boolean(dappSuggestedGasPrice) ||
                  Boolean(dappSuggestedEIP1559Gas)
                }
                dappSuggestedGasWarning={
                  Boolean(dappSuggestedGasPrice) &&
                  gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET
                }
              />
              {/** View fixes layout issue after removing <CustomGas/> */}
              <View />
            </AnimatedTransactionModal>
          </KeyboardAwareScrollView>
        )}

        {mode !== 'review' &&
          (showLegacyGasEditModal ? (
            <EditGasFeeLegacyComponent
              animateOnChange={animateOnChange}
              view={'Transaction'}
              analyticsParams={getGasAnalyticsParamsTyped(
                transaction,
                '',
                gasEstimateType,
              )}
              isAnimating={isAnimating}
              onCancel={this.cancelGasEditionLegacy}
              onSave={this.saveGasEditionLegacy}
              selectedGasObject={selectedLegacyGasObject}
              warning={this.renderWarning()}
              hasDappSuggestedGas={
                Boolean(dappSuggestedGasPrice) ||
                Boolean(dappSuggestedEIP1559Gas)
              }
              error={legacyGasTransaction.error}
              onUpdatingValuesStart={this.onUpdatingValuesStart}
              onUpdatingValuesEnd={this.onUpdatingValuesEnd}
              chainId={chainId}
            />
          ) : (
            <EditGasFee1559Component
              selected={gasSelected}
              gasFee={EIP1559GasDataTemp}
              gasOptions={gasFeeEstimates}
              onChange={this.calculateTempGasFee}
              gasFeeNative={EIP1559GasDataTemp.renderableGasFeeMinNative}
              gasFeeConversion={
                EIP1559GasDataTemp.renderableGasFeeMinConversion
              }
              gasFeeMaxNative={EIP1559GasDataTemp.renderableGasFeeMaxNative}
              gasFeeMaxConversion={
                EIP1559GasDataTemp.renderableGasFeeMaxConversion
              }
              maxPriorityFeeNative={
                EIP1559GasDataTemp.renderableMaxPriorityFeeNative
              }
              maxPriorityFeeConversion={
                EIP1559GasDataTemp.renderableMaxPriorityFeeConversion
              }
              maxFeePerGasNative={
                EIP1559GasDataTemp.renderableMaxFeePerGasNative
              }
              maxFeePerGasConversion={
                EIP1559GasDataTemp.renderableMaxFeePerGasConversion
              }
              primaryCurrency={primaryCurrency}
              chainId={transaction.chainId}
              timeEstimate={EIP1559GasDataTemp.timeEstimate}
              timeEstimateColor={EIP1559GasDataTemp.timeEstimateColor}
              timeEstimateId={EIP1559GasDataTemp.timeEstimateId}
              onCancel={this.cancelGasEdition}
              onSave={this.saveGasEdition}
              dappSuggestedGas={
                Boolean(dappSuggestedGasPrice) ||
                Boolean(dappSuggestedEIP1559Gas)
              }
              warning={this.renderWarning()}
              error={EIP1559GasDataTemp.error}
              over={over}
              onUpdatingValuesStart={this.onUpdatingValuesStart}
              onUpdatingValuesEnd={this.onUpdatingValuesEnd}
              animateOnChange={animateOnChange}
              isAnimating={isAnimating}
              view={'Transaction'}
              analyticsParams={getGasAnalyticsParamsTyped(
                transaction,
                '',
                gasEstimateType,
              )}
            />
          ))}
      </React.Fragment>
    );
  };
}

const mapStateToProps = (state: RootState): StateProps => {
  const transaction = getNormalizedTxState(state);
  const chainId = transaction?.chainId;

  return {
    accounts: selectAccounts(state),
    contractBalances: selectContractBalances(state),
    networkType: selectProviderTypeByChainId(state, chainId),
    selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
    ticker: selectNativeCurrencyByChainId(state, chainId),
    transaction,
    activeTabUrl: getActiveTabUrl(state),
    gasFeeEstimates: selectGasFeeEstimates(state) as unknown as StateProps['gasFeeEstimates'],
    gasEstimateType: selectGasFeeControllerEstimateType(state),
    conversionRate: selectConversionRateByChainId(state, chainId),
    currentCurrency: selectCurrentCurrency(state),
    primaryCurrency: state.settings.primaryCurrency,
    chainId,
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setTransactionObject: (transaction) =>
    dispatch(setTransactionObjectAction(transaction)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TransactionEditor);
