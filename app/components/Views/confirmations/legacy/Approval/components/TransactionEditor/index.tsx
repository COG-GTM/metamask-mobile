import React, { ComponentProps, ComponentType, PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import { Hex } from '@metamask/utils';
import { Dispatch } from 'redux';
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
  setTransactionObject,
  TransactionAssetType,
  TransactionObject,
  TransactionSelectedAsset,
} from '../../../../../../../actions/transaction';
import Engine from '../../../../../../../core/Engine';
import collectiblesTransferInformation from '../../../../../../../util/collectibles-transfer.json';
import { safeToChecksumAddress } from '../../../../../../../util/address';
import { shallowEqual } from '../../../../../../../util/general';
import EditGasFee1559 from '../../../../../../UI/EditGasFee1559';
import EditGasFeeLegacy from '../../../components/EditGasFeeLegacyUpdate';
import { EditGasFeeLegacyUpdateProps } from '../../../components/EditGasFeeLegacyUpdate/types';
import {
  EthGasPriceEstimate,
  GAS_ESTIMATE_TYPES,
  GasFeeEstimates,
  LegacyGasPriceEstimate,
} from '@metamask/gas-fee-controller';
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

const EDIT = 'edit';
const REVIEW = 'review';

type DappTransaction = Parameters<typeof estimateGas>[1];

interface EditorAsset extends TransactionSelectedAsset {
  address: string;
  tokenId?: string;
}

/**
 * Normalized legacy transaction state (redux `transaction` slice merged with
 * its nested `transaction` params).
 */
export interface EditorTransaction {
  id?: string;
  assetType?: TransactionAssetType;
  data?: string;
  from: string;
  to?: string;
  value?: BN | string;
  gas?: BN;
  gasPrice?: BN;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  networkClientId?: string;
  origin?: string;
  readableValue?: string;
  selectedAsset: EditorAsset;
  type?: string;
  chainId?: Hex;
}

// The dapp transaction utils declare the redux transaction with every field
// required and `value` as a string, while the store holds optional fields and
// a BN value; the runtime object is the same.
const toDappTransaction = (transaction: EditorTransaction): DappTransaction =>
  transaction as unknown as DappTransaction;

export type EIP1559GasData = {
  suggestedGasLimit?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxFeePerGasHex?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedMaxPriorityFeePerGasHex?: string;
  gasLimitHex?: string;
  totalMaxHex?: string;
  gasFeeMaxNative?: string;
  gasFeeMinNative?: string;
  maxPriorityFeeNative?: string;
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
  error?: string;
};

interface LegacyGasData {
  suggestedGasLimitHex?: string;
  suggestedGasPriceHex?: string;
  totalHex?: string;
  error?: string;
}

interface LegacyGasTransaction extends LegacyGasData {
  suggestedGasLimit?: string;
  suggestedGasPrice?: string;
  transactionFee?: string;
  transactionFeeFiat?: string;
}

interface LegacyGasObject {
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
}

interface EIP1559GasFee {
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  selectedOption?: string | null;
}

interface LegacyGasFee {
  suggestedGasPrice?: string;
  suggestedGasLimit?: string;
}

interface DappSuggestedEIP1559Gas {
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
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

type GasLevel = 'low' | 'medium' | 'high';

interface ParseTransactionOptions {
  onlyGas?: boolean;
}

interface ParseTransactionEIP1559Args {
  selectedGasFee: EIP1559GasFee & { estimatedBaseFee?: string };
  nativeCurrency?: string;
  conversionRate?: number | null;
  currentCurrency?: string;
}

interface ParseTransactionLegacyArgs {
  selectedGasFee: LegacyGasFee;
  nativeCurrency?: string;
  ticker?: string;
  conversionRate?: number | null;
  currentCurrency?: string;
}

interface TransactionReviewProps {
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  ready: boolean;
  error: string | boolean | undefined;
  gasSelected: string | null | undefined;
  transactionConfirmed?: boolean;
  over: boolean;
  gasEstimateType: string;
  EIP1559GasData: EIP1559GasData;
  onUpdatingValuesStart: () => void;
  onUpdatingValuesEnd: () => void;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  dappSuggestedGas: boolean;
  dappSuggestedGasWarning: boolean;
}

// `fromWei` is untyped JavaScript whose parameter types are inferred from its
// default values (number/string), while callers pass BN values.
const fromWeiValue = fromWei as (
  value?: BN | string | number,
  unit?: string,
) => string;
// The transaction parsers are untyped JavaScript: TypeScript infers every
// destructured argument as required and the returned hex fields as BigNumber,
// neither of which matches the runtime contract used here.
const parseEIP1559 = parseTransactionEIP1559 as unknown as (
  args: ParseTransactionEIP1559Args,
  options?: ParseTransactionOptions,
) => EIP1559GasData;
const parseLegacy = parseTransactionLegacy as unknown as (
  args: ParseTransactionLegacyArgs,
  options?: ParseTransactionOptions,
) => LegacyGasTransaction;

// The shared review/edit components are untyped or typed from JSX
// destructuring, so their props do not reflect what callers provide.
const TransactionReviewComponent = TransactionReview as unknown as ComponentType<
  TransactionReviewProps
>;
const EditGasFeeLegacyComponent = EditGasFeeLegacy as unknown as ComponentType<
  Omit<EditGasFeeLegacyUpdateProps, 'isAnimating' | 'chainId'> & {
    isAnimating?: boolean;
    chainId?: string;
  }
>;
const EditGasFee1559Component = EditGasFee1559 as ComponentType<
  Partial<ComponentProps<typeof EditGasFee1559>> & { over?: boolean }
>;

// `String.prototype.toString` ignores its radix argument, so hex-encoding a
// value that may already be a string is a no-op for strings.
const toBase16 = (value: BN | string | number): string =>
  typeof value === 'string' ? value : value.toString(16);

export interface TransactionEditorConfirmArgs {
  gasEstimateType: string;
  EIP1559GasData: EIP1559GasData;
  gasSelected: string | null | undefined;
}

interface TransactionEditorOwnProps {
  mode?: typeof EDIT | typeof REVIEW;
  onCancel?: () => void;
  onConfirm?: (args: TransactionEditorConfirmArgs) => void;
  onModeChange?: (mode: string) => void;
  transactionConfirmed?: boolean;
  promptedFromApproval?: boolean;
  dappTransactionModalVisible?: boolean;
}

type TransactionEditorStateProps = ReturnType<typeof mapStateToProps>;
type TransactionEditorDispatchProps = ReturnType<typeof mapDispatchToProps>;

export type TransactionEditorProps = TransactionEditorOwnProps &
  TransactionEditorStateProps &
  TransactionEditorDispatchProps;

interface TransactionEditorState {
  toFocused: boolean;
  ensRecipient?: string;
  ready: boolean;
  error: string | boolean | undefined;
  data?: string;
  amountError?: string | boolean;
  toAddressError?: string;
  over: boolean;
  gasSelected: string | null | undefined;
  gasSelectedTemp: string | null | undefined;
  EIP1559GasData: EIP1559GasData;
  EIP1559GasDataTemp: EIP1559GasData;
  LegacyGasData: LegacyGasData;
  LegacyGasDataTemp: LegacyGasData;
  legacyGasObject: LegacyGasObject;
  legacyGasTransaction: LegacyGasTransaction;
  suggestedMaxFeePerGas?: string;
  dappSuggestedGasPrice?: BN | null;
  dappSuggestedEIP1559Gas?: DappSuggestedEIP1559Gas | null;
  advancedGasInserted?: boolean;
  animateOnChange?: boolean;
  stopUpdateGas?: boolean;
  isAnimating?: boolean;
  pollToken?: string;
}

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
  TransactionEditorState
> {
  state: TransactionEditorState = {
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
      setTransactionObject: setTransactionObjectProp,
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
      let initialGas: EIP1559GasFee, initialGasTemp: EIP1559GasFee;
      if (dappSuggestedEIP1559Gas) {
        initialGas = {
          suggestedMaxFeePerGas: fromWeiValue(
            dappSuggestedEIP1559Gas.maxFeePerGas,
            'gwei',
          ),
          suggestedMaxPriorityFeePerGas: fromWeiValue(
            dappSuggestedEIP1559Gas.maxPriorityFeePerGas,
            'gwei',
          ),
        };
        initialGasTemp = initialGas;
      } else if (dappSuggestedGasPrice) {
        initialGas = {
          suggestedMaxFeePerGas: fromWeiValue(dappSuggestedGasPrice, 'gwei'),
          suggestedMaxPriorityFeePerGas: fromWeiValue(dappSuggestedGasPrice, 'gwei'),
        };
        initialGasTemp = initialGas;
      } else {
        const feeMarketEstimates = gasFeeEstimates as GasFeeEstimates;
        initialGas = feeMarketEstimates[gasSelected as GasLevel];
        initialGasTemp = feeMarketEstimates[gasSelectedTemp as GasLevel];
      }

      const suggestedGasLimit = fromWeiValue(transaction.gas, 'wei');

      const EIP1559GasData = this.parseTransactionDataEIP1559({
        ...initialGas,
        suggestedGasLimit,
        selectedOption: gasSelected,
      });

      let EIP1559GasDataTemp: EIP1559GasData;
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
      const suggestedGasLimit = fromWeiValue(transaction.gas, 'wei');
      const getGas = (selected: string | null | undefined) =>
        dappSuggestedGasPrice
          ? fromWeiValue(dappSuggestedGasPrice, 'gwei')
          : gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY
            ? (this.props.gasFeeEstimates as LegacyGasPriceEstimate)[
                selected as GasLevel
              ]
            : (this.props.gasFeeEstimates as EthGasPriceEstimate).gasPrice;

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
        setTransactionObjectProp,
      );

      let LegacyGasDataTemp: LegacyGasData;
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
    const { transaction, setTransactionObject: setTransactionObjectProp } = this.props;

    const zeroGas = new BN('00');
    const hasGasPrice = Boolean(transaction.gasPrice);
    const hasGasLimit =
      !!transaction.gas && !new BN(transaction.gas).eq(zeroGas);
    const hasEIP1559Gas =
      Boolean(transaction.maxFeePerGas) &&
      Boolean(transaction.maxPriorityFeePerGas);
    if (!hasGasLimit)
      handleGetGasLimit(toDappTransaction(transaction), setTransactionObjectProp);

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
      this.handleUpdateReadableValue(fromWeiValue(transaction.value));
    }
    if (transaction?.data) {
      this.setState({ data: transaction.data });
    }
  };

  parseTransactionDataEIP1559 = (
    gasFee: EIP1559GasFee,
    _options?: ParseTransactionOptions,
  ): EIP1559GasData => {
    const { ticker } = this.props;

    const parsedTransactionEIP1559 = parseEIP1559(
      {
        ...this.props,
        nativeCurrency: ticker,
        selectedGasFee: {
          ...gasFee,
          estimatedBaseFee: (this.props.gasFeeEstimates as GasFeeEstimates)
            .estimatedBaseFee,
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
    gasFee: LegacyGasFee,
    _options?: ParseTransactionOptions,
  ): LegacyGasTransaction => {
    const { ticker } = this.props;

    const parsedTransactionLegacy = parseLegacy(
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
    GasFeeController.stopPolling();
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
  handleUpdateAmount = async (amount: BN | string, mounting = false) => {
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
            toDappTransaction(transaction),
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
  handleUpdateData = async (data?: string) => {
    const { transaction } = this.props;
    const { gas } = await estimateGas({ data }, toDappTransaction(transaction));
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
    selectedAsset?: EditorAsset;
    value?: BN | string;
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

        const tokenAmountToSend = selectedAsset && value && toBase16(value);
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
          address in collectiblesTransferInformationByAddress &&
          collectiblesTransferInformationByAddress[address];
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
            amount: toBase16(selectedAsset.tokenId as string),
          });
        }
      },
    };
    const data = generateData[assetType]();
    const { gas } = await estimateGas(
      { data, to: selectedAsset.address },
      toDappTransaction(transaction),
    );
    return { data, gas };
  };

  validateTotal = (totalGas?: string) => {
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
    let error: string | undefined;
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
    EIP1559GasData?: EIP1559GasData,
    LegacyGasData?: LegacyGasData,
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
      this.state.LegacyGasData.totalHex,
    );
    const amountError = await validateAmount(
      assetType as Parameters<typeof validateAmount>[0],
      address,
      tokenId as string,
      selectedAddress as string,
      toDappTransaction(transaction),
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

  calculateTempGasFee = (gas: EIP1559GasFee, selected: string | null) => {
    const { transaction } = this.props;
    if (selected && gas) {
      gas.suggestedGasLimit = fromWeiValue(transaction.gas, 'wei');
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

  saveGasEdition = (gasSelected: string | null | undefined) => {
    const { gasEstimateType, setTransactionObject: setTransactionObjectProp } = this.props;
    const { LegacyGasDataTemp } = this.state;

    if (gasEstimateType !== GAS_ESTIMATE_TYPES.FEE_MARKET) {
      handleGasFeeSelection(
        hexToBN(LegacyGasDataTemp.suggestedGasLimitHex),
        hexToBN(LegacyGasDataTemp.suggestedGasPriceHex),
        setTransactionObjectProp,
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

  calculateTotalGasValue = (totalHex?: string): string => fromWeiValue(totalHex);

  updateEIP1559GasDataFromLegacyTransaction = ({
    legacyGasTransaction,
    totalGasValue,
  }: {
    legacyGasTransaction: LegacyGasTransaction;
    totalGasValue: string;
  }): EIP1559GasData => ({
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
    legacyGasTransaction: LegacyGasTransaction,
    legacyGasObject: LegacyGasObject,
  ) => {
    const { setTransactionObject: setTransactionObjectProp, gasEstimateType } = this.props;
    const totalHex = legacyGasTransaction?.totalHex;
    legacyGasTransaction.error = this.validateTotal(totalHex);

    handleGasFeeSelection(
      hexToBN(legacyGasTransaction.suggestedGasLimitHex),
      hexToBN(legacyGasTransaction.suggestedGasPriceHex),
      setTransactionObjectProp,
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
              analyticsParams={getGasAnalyticsParams(
                toDappTransaction(transaction),
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
              gasOptions={gasFeeEstimates as GasFeeEstimates}
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
                toDappTransaction(transaction),
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
  const transaction: EditorTransaction = getNormalizedTxState(state);
  const chainId = transaction?.chainId;

  return {
    accounts: selectAccounts(state),
    contractBalances: selectContractBalances(state),
    networkType: selectProviderTypeByChainId(state, chainId as Hex),
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
  setTransactionObject: (transaction: TransactionObject) =>
    dispatch(setTransactionObject(transaction)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TransactionEditor);
