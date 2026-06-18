import React, { PureComponent } from 'react';
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
import { setTransactionObject } from '../../../../../../../actions/transaction';
import Engine from '../../../../../../../core/Engine';
// @ts-expect-error Legacy JS migration - TS2307
import collectiblesTransferInformation from '../../../../../../../util/collectibles-transfer';
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EDIT = 'edit';
const REVIEW = 'review';

const styles = StyleSheet.create({
  keyboardAwareWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts?: any;
  chainId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contractBalances?: any;
  gasEstimateType?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasFeeEstimates?: any;
  mode?: string;
  onCancel?: () => void;
  onConfirm?: (...args: unknown[]) => void;
  onModeChange?: (mode: string) => void;
  primaryCurrency?: string;
  selectedAddress?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTransactionObject?: (tx: any) => void;
  ticker?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction?: any;
  transactionConfirmed?: boolean;
}

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface State {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  EIP1559GasData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  EIP1559GasDataTemp: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LegacyGasData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LegacyGasDataTemp: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  advancedGasInserted: any;
  amountError: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animateOnChange: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dappSuggestedEIP1559Gas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dappSuggestedGasPrice: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ensRecipient: any;
  error: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasSelected: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasSelectedTemp: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isAnimating: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  legacyGasObject: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  legacyGasTransaction: any;
  over: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pollToken: any;
  ready: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stopUpdateGas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suggestedMaxFeePerGas: any;
  toAddressError: string;
  toFocused: boolean;
}

/**
 * PureComponent that supports editing and reviewing a transaction
 */
class TransactionEditor extends PureComponent<Props, State> {

  // @ts-expect-error Legacy JS migration - TS2740
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  computeGasEstimates = async (gasEstimateTypeChanged: any) => {
    const {
      transaction,
      gasEstimateType,
      gasFeeEstimates,
      // eslint-disable-next-line @typescript-eslint/no-shadow
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
        initialGas = gasFeeEstimates[gasSelected];
        initialGasTemp = gasFeeEstimates[gasSelectedTemp];
      }

      const suggestedGasLimit = fromWei(transaction.gas, 'wei');

      // @ts-expect-error Legacy JS migration - TS2554
      const EIP1559GasData = this.parseTransactionDataEIP1559({
        ...initialGas,
        suggestedGasLimit,
        selectedOption: gasSelected,
      });

      let EIP1559GasDataTemp;
      if (gasSelected === gasSelectedTemp) {
        EIP1559GasDataTemp = EIP1559GasData;
      } else {
        // @ts-expect-error Legacy JS migration - TS2554
        EIP1559GasDataTemp = this.parseTransactionDataEIP1559({
          ...initialGasTemp,
          suggestedGasLimit,
          selectedOption: gasSelectedTemp,
        });
      }

      // @ts-expect-error Legacy JS migration - TS2554
      await this.validate(EIP1559GasData);
      // eslint-disable-next-line react/no-did-update-set-state
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
      const suggestedGasLimit = fromWei(transaction.gas, 'wei');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getGas = (selected: any) =>
        dappSuggestedGasPrice
          ? fromWei(dappSuggestedGasPrice, 'gwei')
          : gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY
            ? this.props.gasFeeEstimates[selected]
            : this.props.gasFeeEstimates.gasPrice;

      const LegacyGasData = this.parseTransactionDataLegacy(
        {
          suggestedGasPrice: getGas(gasSelected),
          suggestedGasLimit,
        },
        { onlyGas: true },
      );

      handleGasFeeSelection(
        hexToBN(LegacyGasData.suggestedGasLimitHex),
        hexToBN(LegacyGasData.suggestedGasPriceHex),
        // @ts-expect-error Legacy JS migration - TS2345
        setTransactionObject,
      );

      let LegacyGasDataTemp;
      if (gasSelected === gasSelectedTemp) {
        LegacyGasDataTemp = LegacyGasData;
      } else {
        // @ts-expect-error Legacy JS migration - TS2554
        LegacyGasDataTemp = this.parseTransactionDataLegacy({
          suggestedGasPrice: getGas(gasSelectedTemp),
          suggestedGasLimit,
        });
      }

      // eslint-disable-next-line react/no-did-update-set-state
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
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const { transaction, setTransactionObject } = this.props;

    const zeroGas = new BN('00');
    const hasGasPrice = Boolean(transaction.gasPrice);
    const hasGasLimit =
      Boolean(transaction.gas) && !new BN(transaction.gas).eq(zeroGas);
    const hasEIP1559Gas =
      Boolean(transaction.maxFeePerGas) &&
      Boolean(transaction.maxPriorityFeePerGas);
    // @ts-expect-error Legacy JS migration - TS2345
    if (!hasGasLimit) handleGetGasLimit(transaction, setTransactionObject);

    if (!hasGasPrice && !hasEIP1559Gas) {
      this.startPolling();
    } else if (hasEIP1559Gas) {
      this.setState(
        {
          dappSuggestedEIP1559Gas: {
            maxFeePerGas: transaction.maxFeePerGas,
            maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
          },
        },
        this.startPolling,
      );
    } else if (hasGasPrice) {
      this.setState(
        { dappSuggestedGasPrice: transaction.gasPrice },
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  parseTransactionDataEIP1559 = (gasFee: any, options: any) => {
    const { ticker } = this.props;

    const parsedTransactionEIP1559 = parseTransactionEIP1559(
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
      parsedTransactionEIP1559.totalMaxHex,
    );

    return parsedTransactionEIP1559;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  parseTransactionDataLegacy = (gasFee: any, options: any) => {
    const { ticker } = this.props;

    const parsedTransactionLegacy = parseTransactionLegacy(
      {
        ...this.props,
        nativeCurrency: ticker,
        selectedGasFee: gasFee,
      },
      { onlyGas: true },
    );

    parsedTransactionLegacy.error = this.validateTotal(
      parsedTransactionLegacy.totalHex,
    );

    return parsedTransactionLegacy;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentDidUpdate = (prevProps: any) => {
    const { transaction } = this.props;
    if (transaction.data !== prevProps.transaction.data) {
      this.handleUpdateData(transaction.data);
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
          !transaction.gas.eq(prevProps?.transaction?.gas) ||
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
      // @ts-expect-error Legacy JS migration - TS2554
      this.validate();
    }
  };

  componentWillUnmount = () => {
    const { GasFeeController } = Engine.context;
    // @ts-expect-error Legacy JS migration - TS2554
    GasFeeController.stopPolling(this.state.pollToken);
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
    // @ts-expect-error Legacy JS migration - TS2554
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleUpdateAmount = async (amount: any, mounting = false) => {
    const {
      transaction: { to, data, assetType, gas: gasLimit },
      transaction,
    } = this.props;
    // If ETH transaction, there is no need to generate new data
    if (assetType === 'ETH') {
      const { gas } = mounting
        ? { gas: gasLimit }
        : await estimateGas({ amount, data, to }, transaction);
      // @ts-expect-error Legacy JS migration - TS2722
      this.props.setTransactionObject({ value: amount, to, gas: hexToBN(gas) });
    }
    // If selectedAsset defined, generates data
    else if (assetType === 'ERC20') {
      const res = await this.handleDataGeneration({ value: amount });
      const gas = mounting ? gasLimit : res.gas;
      // @ts-expect-error Legacy JS migration - TS2722
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleUpdateReadableValue = (readableValue: any) => {
    // @ts-expect-error Legacy JS migration - TS2722
    this.props.setTransactionObject({ readableValue });
  };

  /**
   * Updates data in transaction state, after gas is estimated according to this data
   *
   * @param {string} data - String containing new data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleUpdateData = async (data: any) => {
    const { transaction } = this.props;
    const { gas } = await estimateGas({ data }, transaction);
    this.setState({ data });
    // @ts-expect-error Legacy JS migration - TS2722
    this.props.setTransactionObject({ gas: hexToBN(gas), data });
  };

  /**
   * Handle data generation is selectedAsset is defined in transaction
   *
   * @param {object} opts? - Optional object to customize data generation, containing selectedAsset, value and to
   * @returns {object} - Object containing data and gas, according to new generated data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleDataGeneration = async (opts: any) => {
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
          ? generateTransferData('transfer', {
            toAddress: to,
            amount: tokenAmountToSend,
          })
          : undefined;
      },
      ERC721: () => {
        const address = selectedAsset.address.toLowerCase();
        const collectibleTransferInformation =
          address in collectiblesTransferInformation &&
          collectiblesTransferInformation[address];
        if (!to) return;
        // If not in list,, default to transferFrom
        if (
          !collectibleTransferInformation ||
          (collectibleTransferInformation.tradable &&
            collectibleTransferInformation.method === 'transferFrom')
        ) {
          return generateTransferData('transferFrom', {
            fromAddress: from,
            toAddress: to,
            tokenId: toHexadecimal(selectedAsset.tokenId),
          });
        } else if (
          collectibleTransferInformation.tradable &&
          collectibleTransferInformation.method === 'transfer'
        ) {
          return generateTransferData('transfer', {
            toAddress: to,
            amount: selectedAsset.tokenId.toString(16),
          });
        }
      },
    };
    const data = generateData[assetType]();
    const { gas } = await estimateGas(
      { data, to: selectedAsset.address },
      transaction,
    );
    return { data, gas };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateTotal = (totalGas: any) => {
    let error = '';
    const {
      ticker,
      transaction: { value, from, assetType },
    } = this.props;

    const checksummedFrom = safeToChecksumAddress(from) || '';
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
    // @ts-expect-error Legacy JS migration - TS2554
    const validated = !(await this.validate());
    if (validated) {
      if (data && data.substr(0, 2) !== '0x') {
        this.handleUpdateData(addHexPrefix(data));
      }
    }
    // @ts-expect-error Legacy JS migration - TS2722
    this.props?.onModeChange(REVIEW);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate = async (EIP1559GasData: any, LegacyGasData: any) => {
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
      this.state.LegacyGasData.totalHex,
    );
    const amountError = await validateAmount(
      assetType,
      address,
      tokenId,
      // @ts-expect-error Legacy JS migration - TS2345
      selectedAddress,
      transaction,
      contractBalances,
      false,
    );
    const toAddressError = this.validateToAddress();
    this.setState({
      // @ts-expect-error Legacy JS migration - TS2322
      amountError: totalError || amountError,
      toAddressError,
      error: totalError || amountError || toAddressError,
    });
    return totalError || amountError || toAddressError;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calculateTempGasFee = (gas: any, selected: any) => {
    const { transaction } = this.props;
    if (selected && gas) {
      gas.suggestedGasLimit = fromWei(transaction.gas, 'wei');
    }
    this.setState({
      // @ts-expect-error Legacy JS migration - TS2554
      EIP1559GasDataTemp: this.parseTransactionDataEIP1559({
        ...gas,
        selectedOption: selected,
      }),
      stopUpdateGas: !selected,
      gasSelectedTemp: selected,
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveGasEdition = (gasSelected: any) => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const { gasEstimateType, setTransactionObject } = this.props;
    const { LegacyGasDataTemp } = this.state;

    if (gasEstimateType !== GAS_ESTIMATE_TYPES.FEE_MARKET) {
      handleGasFeeSelection(
        hexToBN(LegacyGasDataTemp.suggestedGasLimitHex),
        hexToBN(LegacyGasDataTemp.suggestedGasPriceHex),
        // @ts-expect-error Legacy JS migration - TS2345
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calculateTotalGasValue = (totalHex: any) => fromWei(totalHex);

  updateEIP1559GasDataFromLegacyTransaction = ({
    legacyGasTransaction,
    totalGasValue,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => ({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveGasEditionLegacy = (legacyGasTransaction: any, legacyGasObject: any) => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const { setTransactionObject, gasEstimateType } = this.props;
    const totalHex = legacyGasTransaction?.totalHex;
    legacyGasTransaction.error = this.validateTotal(totalHex);

    handleGasFeeSelection(
      hexToBN(legacyGasTransaction.suggestedGasLimitHex),
      hexToBN(legacyGasTransaction.suggestedGasPriceHex),
      // @ts-expect-error Legacy JS migration - TS2345
      setTransactionObject,
    );

    this.setState({
      stopUpdateGas: false,
      legacyGasTransaction,
      legacyGasObject,
    });

    // conditionally save to EIP1559GasData when gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET
    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      const totalGasValue = this.calculateTotalGasValue(totalHex);
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
              {/* @ts-expect-error Legacy JS migration - TS2786 */}
              <TransactionReview
                // @ts-expect-error Legacy JS migration - TS2322
                onCancel={this.onCancel}
                // @ts-expect-error Legacy JS migration - TS2322
                onConfirm={this.onConfirm}
                // @ts-expect-error Legacy JS migration - TS2322
                ready={ready}
                // @ts-expect-error Legacy JS migration - TS2322
                error={error}
                // @ts-expect-error Legacy JS migration - TS2322
                gasSelected={gasSelected}
                // @ts-expect-error Legacy JS migration - TS2322
                transactionConfirmed={transactionConfirmed}
                // @ts-expect-error Legacy JS migration - TS2322
                over={over}
                // @ts-expect-error Legacy JS migration - TS2322
                gasEstimateType={gasEstimateType}
                // @ts-expect-error Legacy JS migration - TS2322
                EIP1559GasData={EIP1559GasData}
                // @ts-expect-error Legacy JS migration - TS2322
                onUpdatingValuesStart={this.onUpdatingValuesStart}
                // @ts-expect-error Legacy JS migration - TS2322
                onUpdatingValuesEnd={this.onUpdatingValuesEnd}
                // @ts-expect-error Legacy JS migration - TS2322
                animateOnChange={animateOnChange}
                // @ts-expect-error Legacy JS migration - TS2322
                isAnimating={isAnimating}
                // @ts-expect-error Legacy JS migration - TS2322
                dappSuggestedGas={
                  Boolean(dappSuggestedGasPrice) ||
                  Boolean(dappSuggestedEIP1559Gas)
                }
                // @ts-expect-error Legacy JS migration - TS2322
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
            <EditGasFeeLegacy
              animateOnChange={animateOnChange}
              view={'Transaction'}
              analyticsParams={getGasAnalyticsParams(
                transaction,
                '',
                // @ts-expect-error Legacy JS migration - TS2345
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
            <EditGasFee1559
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
              // @ts-expect-error Legacy JS migration - TS2322
              over={over}
              onUpdatingValuesStart={this.onUpdatingValuesStart}
              onUpdatingValuesEnd={this.onUpdatingValuesEnd}
              animateOnChange={animateOnChange}
              isAnimating={isAnimating}
              view={'Transaction'}
              analyticsParams={getGasAnalyticsParams(
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: any) => {
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
    gasFeeEstimates: selectGasFeeEstimates(state),
    gasEstimateType: selectGasFeeControllerEstimateType(state),
    conversionRate: selectConversionRateByChainId(state, chainId),
    currentCurrency: selectCurrentCurrency(state),
    primaryCurrency: state.settings.primaryCurrency,
    chainId,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTransactionObject: (transaction: any) =>
    dispatch(setTransactionObject(transaction)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TransactionEditor);
