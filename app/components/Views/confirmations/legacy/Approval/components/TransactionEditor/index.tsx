import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import {
  GasEstimateType,
  GAS_ESTIMATE_TYPES,
} from '@metamask/gas-fee-controller';
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
import { setTransactionObject as setTransactionObjectAction } from '../../../../../../../actions/transaction';
import Engine from '../../../../../../../core/Engine';
import collectiblesTransferInformation from '../../../../../../../util/collectibles-transfer.json';
import { safeToChecksumAddress } from '../../../../../../../util/address';
import { shallowEqual } from '../../../../../../../util/general';
import EditGasFee1559 from '../../../../../../UI/EditGasFee1559';
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
import {
  selectNativeCurrencyByChainId,
  selectProviderTypeByChainId,
} from '../../../../../../../selectors/networkController';
import { RootState } from '../../../../../../../reducers';
import type { EIP1559GasTransaction } from '../../../components/EditGasFee1559Update';
import EditGasFeeLegacy, {
  LegacyGasObject,
  LegacyGasTransaction,
} from '../../../components/EditGasFeeLegacyUpdate';
import type { Hex } from '@metamask/utils';
import type { Dispatch } from 'redux';

type DappTransaction = Parameters<typeof estimateGas>[1];
type SetTransactionObject = Parameters<typeof handleGasFeeSelection>[2];

/** Values the legacy flow calls `toString(16)` on. */
interface RadixStringifiable {
  toString(radix?: number): string;
}

const parseEIP1559 = parseTransactionEIP1559 as unknown as (
  args: Record<string, unknown>,
  options?: { onlyGas?: boolean },
) => ParsedEIP1559Gas;

const parseLegacy = parseTransactionLegacy as unknown as (
  args: Record<string, unknown>,
  options?: { onlyGas?: boolean },
) => ParsedLegacyGas;

/** `EditGasFee1559` is still untyped JavaScript. */
const EditGasFee1559View = EditGasFee1559 as unknown as React.ComponentType<
  Record<string, unknown>
>;

interface EditorSelectedAsset {
  address: string;
  decimals: string;
  symbol: string;
  tokenId?: string;
}

interface EditorTransaction {
  assetType?: string;
  chainId?: Hex;
  data?: string;
  from?: string;
  gas?: BN;
  gasPrice?: BN;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  origin?: string;
  selectedAsset: EditorSelectedAsset;
  to?: string;
  type?: string;
  value?: string | BN;
}

interface DappSuggestedEIP1559Gas {
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

type ParsedEIP1559Gas = Partial<EIP1559GasTransaction> & {
  suggestedGasLimit?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
};

type ParsedLegacyGas = Partial<LegacyGasTransaction> & {
  suggestedGasLimitHex?: string;
  suggestedGasPriceHex?: string;
};

interface TransactionEditorStateProps {
  accounts: Record<string, { balance: string }>;
  contractBalances: Record<string, string>;
  networkType?: string;
  selectedAddress?: string;
  ticker?: string;
  transaction: EditorTransaction;
  activeTabUrl: string;
  gasFeeEstimates: Record<string, never> & { [key: string]: unknown };
  gasEstimateType: string;
  conversionRate?: number;
  currentCurrency: string;
  primaryCurrency: string;
  chainId?: Hex;
}

interface TransactionEditorDispatchProps {
  setTransactionObject: (transaction: Record<string, unknown>) => void;
}

interface TransactionEditorOwnProps {
  mode?: string;
  onCancel?: () => void;
  onConfirm?: (params: {
    gasEstimateType: GasEstimateType;
    EIP1559GasData: Record<string, string>;
    gasSelected?: string | null;
  }) => void;
  onModeChange?: (mode: string) => void;
  transactionConfirmed?: boolean;
  promptedFromApproval?: boolean;
  dappTransactionModalVisible?: boolean;
}

type TransactionEditorProps = TransactionEditorStateProps &
  TransactionEditorDispatchProps &
  TransactionEditorOwnProps;

interface TransactionEditorComponentState {
  toFocused: boolean;
  ensRecipient?: string;
  ready: boolean;
  error?: boolean | string;
  data?: string;
  amountError?: string;
  toAddressError?: string;
  over: boolean;
  gasSelected: string | null;
  gasSelectedTemp: string | null;
  EIP1559GasData: ParsedEIP1559Gas;
  EIP1559GasDataTemp: ParsedEIP1559Gas;
  LegacyGasData: ParsedLegacyGas;
  LegacyGasDataTemp: ParsedLegacyGas;
  legacyGasObject: LegacyGasObject;
  legacyGasTransaction: ParsedLegacyGas;
  suggestedMaxFeePerGas?: string;
  advancedGasInserted?: boolean;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  stopUpdateGas?: boolean;
  pollToken?: string;
  dappSuggestedGasPrice?: string | BN | null;
  dappSuggestedEIP1559Gas?: DappSuggestedEIP1559Gas | null;
}

const EDIT = 'edit';
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
class TransactionEditor extends PureComponent<
  TransactionEditorProps,
  TransactionEditorComponentState
> {
  static propTypes = {
    /**
     * List of accounts from the AccountTrackerController
     */
    accounts: PropTypes.object,
    /**
     * Current mode this transaction editor is in
     */
    mode: PropTypes.oneOf([EDIT, REVIEW]),
    /**
     * Callback triggered when this transaction is cancelled
     */
    onCancel: PropTypes.func,
    /**
     * Callback triggered when this transaction is confirmed
     */
    onConfirm: PropTypes.func,
    /**
     * Called when a user changes modes
     */
    onModeChange: PropTypes.func,
    /**
     * Transaction object associated with this transaction
     */
    transaction: PropTypes.object,
    /**
     * Whether the transaction was confirmed or not
     */
    transactionConfirmed: PropTypes.bool,
    /**
     * Object containing accounts balances
     */
    contractBalances: PropTypes.object,
    /**
     * String containing the selected address
     */
    selectedAddress: PropTypes.string,
    /**
     * Action that sets transaction attributes from object to a transaction
     */
    setTransactionObject: PropTypes.func.isRequired,
    /**
     * Whether was prompted from approval
     */
    promptedFromApproval: PropTypes.bool,
    /**
     * Current selected ticker
     */
    ticker: PropTypes.string,
    /**
     * Estimate type returned by the gas fee controller, can be market-fee, legacy or eth_gasPrice
     */
    gasEstimateType: PropTypes.string,
    /**
     * Gas fee estimates returned by the gas fee controller
     */
    gasFeeEstimates: PropTypes.object,
    /**
     * ETH or fiat, depending on user setting
     */
    primaryCurrency: PropTypes.string,
    /**
     * ID of the associated chain
     */
    chainId: PropTypes.string,
  };

  state: TransactionEditorComponentState = {
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
            dappSuggestedEIP1559Gas.maxFeePerGas as string,
            'gwei',
          ),
          suggestedMaxPriorityFeePerGas: fromWei(
            dappSuggestedEIP1559Gas.maxPriorityFeePerGas as string,
            'gwei',
          ),
        };
        initialGasTemp = initialGas;
      } else if (dappSuggestedGasPrice) {
        initialGas = {
          suggestedMaxFeePerGas: fromWei(
            dappSuggestedGasPrice as string,
            'gwei',
          ),
          suggestedMaxPriorityFeePerGas: fromWei(
            dappSuggestedGasPrice as string,
            'gwei',
          ),
        };
        initialGasTemp = initialGas;
      } else {
        initialGas = gasFeeEstimates[gasSelected as string];
        initialGasTemp = gasFeeEstimates[gasSelectedTemp as string];
      }

      const suggestedGasLimit = fromWei(transaction.gas, 'wei');

      const EIP1559GasData: ParsedEIP1559Gas = this.parseTransactionDataEIP1559(
        {
          ...initialGas,
          suggestedGasLimit,
          selectedOption: gasSelected,
        },
      );

      let EIP1559GasDataTemp: ParsedEIP1559Gas;
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
      const getGas = (selected: string | null) =>
        dappSuggestedGasPrice
          ? fromWei(dappSuggestedGasPrice as string, 'gwei')
          : gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY
          ? this.props.gasFeeEstimates[selected as string]
          : this.props.gasFeeEstimates.gasPrice;

      const LegacyGasData: ParsedLegacyGas = this.parseTransactionDataLegacy(
        {
          suggestedGasPrice: getGas(gasSelected),
          suggestedGasLimit,
        },
        { onlyGas: true },
      );

      handleGasFeeSelection(
        hexToBN(LegacyGasData.suggestedGasLimitHex as string),
        hexToBN(LegacyGasData.suggestedGasPriceHex as string),
        setTransactionObject as SetTransactionObject,
      );

      let LegacyGasDataTemp: ParsedLegacyGas;
      if (gasSelected === gasSelectedTemp) {
        LegacyGasDataTemp = LegacyGasData;
      } else {
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
    const { transaction, setTransactionObject } = this.props;

    const zeroGas = new BN('00');
    const hasGasPrice = Boolean(transaction.gasPrice);
    const hasGasLimit =
      Boolean(transaction.gas) && !new BN(transaction.gas as BN).eq(zeroGas);
    const hasEIP1559Gas =
      Boolean(transaction.maxFeePerGas) &&
      Boolean(transaction.maxPriorityFeePerGas);
    if (!hasGasLimit)
      handleGetGasLimit(
        transaction as unknown as DappTransaction,
        setTransactionObject as SetTransactionObject,
      );

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

  parseTransactionDataEIP1559 = (gasFee: Record<string, unknown>) => {
    const { ticker } = this.props;

    const parsedTransactionEIP1559: ParsedEIP1559Gas = parseEIP1559(
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

  parseTransactionDataLegacy = (
    gasFee: Record<string, unknown>,
    _options?: { onlyGas: boolean },
  ) => {
    const { ticker } = this.props;

    const parsedTransactionLegacy: ParsedLegacyGas = parseLegacy(
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

  componentDidUpdate = (prevProps: TransactionEditorProps) => {
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
          !transaction.gas.eq(prevProps?.transaction?.gas as BN) ||
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
    (GasFeeController.stopPolling as (pollToken?: string) => void)(
      this.state.pollToken,
    );
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
      onConfirm({
        gasEstimateType,
        EIP1559GasData,
        gasSelected,
      } as unknown as Parameters<NonNullable<TransactionEditorProps['onConfirm']>>[0]);
  };

  /**
   * Updates value in transaction state
   * If is an asset transaction it generates data to send and estimates gas again with new value and new data
   *
   * @param {object} amount - BN object containing transaction amount
   * @param {bool} mounting - Whether the view is mounting, in that case it should use the gas from transaction state
   */
  handleUpdateAmount = async (amount: string | BN, mounting = false) => {
    const {
      transaction: { to, data, assetType, gas: gasLimit },
      transaction,
    } = this.props;
    // If ETH transaction, there is no need to generate new data
    if (assetType === 'ETH') {
      const { gas } = mounting
        ? { gas: gasLimit }
        : await estimateGas(
            { amount: amount as string, data, to },
            transaction as unknown as DappTransaction,
          );
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
    const { gas } = await estimateGas(
      { data },
      transaction as unknown as DappTransaction,
    );
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
    selectedAsset?: EditorSelectedAsset;
    value?: string | BN;
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
    const generateData: Record<string, () => string | undefined> = {
      ERC20: () => {
        // Use raw data when transaction with walletconnect
        // Additional parameters can enrich the transaction information for ERC20, such as orders or goods
        // These additional parameters have been tested on the metamask-extension and Ethereum mainnet
        if (transaction.data) {
          return transaction.data;
        }

        const tokenAmountToSend =
          selectedAsset && value && (value as RadixStringifiable).toString(16);
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
          (
            collectiblesTransferInformation as unknown as Record<
              string,
              { tradable: boolean; method: string }
            >
          )[address];
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
            tokenId: toHexadecimal(selectedAsset.tokenId as string),
          });
        } else if (
          collectibleTransferInformation.tradable &&
          collectibleTransferInformation.method === 'transfer'
        ) {
          return generateTransferData('transfer', {
            toAddress: to,
            amount: (selectedAsset.tokenId as RadixStringifiable).toString(16),
          });
        }
      },
    };
    const data = generateData[assetType]();
    const { gas } = await estimateGas(
      { data, to: selectedAsset.address },
      transaction as unknown as DappTransaction,
    );
    return { data, gas };
  };

  validateTotal = (totalGas?: string) => {
    let error = '';
    const {
      ticker,
      transaction: { value, from, assetType },
    } = this.props;

    const checksummedFrom = safeToChecksumAddress(from as string) || '';
    const fromAccount = this.props.accounts[checksummedFrom];
    const { balance } = fromAccount;
    const weiBalance = hexToBN(balance);
    const totalGasValue = hexToBN(totalGas);
    let valueBN = hexToBN('0x0');
    if (assetType === 'ETH') {
      valueBN = hexToBN(value as string);
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
    this.props?.onModeChange?.(REVIEW);
  };

  validate = async (
    EIP1559GasData?: ParsedEIP1559Gas,
    LegacyGasData?: ParsedLegacyGas,
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
      (EIP1559GasData?.totalMaxHex ||
        this.state.EIP1559GasData.totalMaxHex ||
        LegacyGasData?.totalHex ||
        this.state.LegacyGasData.totalHex) as string,
    );
    const amountError = await validateAmount(
      assetType as Parameters<typeof validateAmount>[0],
      address,
      tokenId as string,
      selectedAddress as string,
      transaction as unknown as DappTransaction,
      contractBalances,
      false,
    );
    const toAddressError = this.validateToAddress();
    this.setState({
      amountError: (totalError || amountError) as string | undefined,
      toAddressError,
      error: totalError || amountError || toAddressError,
    });
    return totalError || amountError || toAddressError;
  };

  calculateTempGasFee = (
    gas: Record<string, unknown> & { suggestedGasLimit?: string },
    selected: string | null,
  ) => {
    const { transaction } = this.props;
    if (selected && gas) {
      gas.suggestedGasLimit = fromWei(transaction.gas, 'wei');
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
      handleGasFeeSelection(
        hexToBN(LegacyGasDataTemp.suggestedGasLimitHex as string),
        hexToBN(LegacyGasDataTemp.suggestedGasPriceHex as string),
        setTransactionObject as SetTransactionObject,
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

  calculateTotalGasValue = (totalHex?: string) => fromWei(totalHex as string);

  updateEIP1559GasDataFromLegacyTransaction = ({
    legacyGasTransaction,
    totalGasValue,
  }: {
    legacyGasTransaction: ParsedLegacyGas;
    totalGasValue: string;
  }) => ({
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
    legacyGasTransaction: ParsedLegacyGas,
    legacyGasObject: LegacyGasObject,
  ) => {
    const { setTransactionObject, gasEstimateType } = this.props;
    const totalHex = legacyGasTransaction?.totalHex;
    legacyGasTransaction.error = this.validateTotal(totalHex);

    handleGasFeeSelection(
      hexToBN(legacyGasTransaction.suggestedGasLimitHex as string),
      hexToBN(legacyGasTransaction.suggestedGasPriceHex as string),
      setTransactionObject as SetTransactionObject,
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
              <TransactionReview
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
            <EditGasFeeLegacy
              animateOnChange={animateOnChange}
              view={'Transaction'}
              analyticsParams={getGasAnalyticsParams(
                transaction as unknown as DappTransaction,
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
            <EditGasFee1559View
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
              analyticsParams={getGasAnalyticsParams(
                transaction as unknown as DappTransaction,
                '',
                gasEstimateType,
              )}
            />
          ))}
      </React.Fragment>
    );
  };
}

const mapStateToProps = (state: RootState) => {
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

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setTransactionObject: (transaction: Record<string, unknown>) =>
    dispatch(setTransactionObjectAction(transaction)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  TransactionEditor as unknown as React.ComponentType<Record<string, unknown>>,
) as unknown as React.ComponentType<TransactionEditorOwnProps>;
