import React, { ComponentType, PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dispatch } from 'redux';
import {
  GasEstimateType,
  GAS_ESTIMATE_TYPES,
} from '@metamask/gas-fee-controller';
import { Hex } from '@metamask/utils';
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
  type GasFeeEstimatesByLevel,
} from '../../../../../../../util/transactions';
import {
  setTransactionObject as setTransactionObjectAction,
  TransactionPayload,
} from '../../../../../../../actions/transaction';
import Engine from '../../../../../../../core/Engine';
import collectiblesTransferInformation from '../../../../../../../util/collectibles-transfer.json';
import { safeToChecksumAddress } from '../../../../../../../util/address';
import { shallowEqual } from '../../../../../../../util/general';
import EditGasFee1559, {
  type EIP1559GasOptions,
} from '../../../../../../UI/EditGasFee1559';
import EditGasFeeLegacy from '../../../components/EditGasFeeLegacyUpdate';
import type { EditLegacyGasTransaction } from '../../../components/EditGasFeeLegacyUpdate/types';
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
import { TransactionState } from '../../../../../../../reducers/transaction';
import { TxMeta } from '../../../../../../../util/transaction-reducer-helpers';

export type TransactionEditorMode = typeof EDIT | typeof REVIEW;

type NormalizedTransaction = TransactionState & Partial<TxMeta>;

/**
 * Shape expected by the `app/util/dappTransactions` helpers. The normalized
 * redux transaction is structurally looser, so it is adapted at the boundary.
 */
type DappTransaction = Parameters<typeof estimateGas>[1];
type DappSetTransactionObject = Parameters<typeof handleGasFeeSelection>[2];

const toDappTransaction = (transaction: NormalizedTransaction) =>
  transaction as unknown as DappTransaction;

interface TransactionReviewProps {
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  ready: boolean;
  error?: string | boolean;
  gasSelected: string | null;
  transactionConfirmed?: boolean;
  over: boolean;
  gasEstimateType: GasEstimateType;
  EIP1559GasData: EIP1559GasData;
  onUpdatingValuesStart: () => void;
  onUpdatingValuesEnd: () => void;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  dappSuggestedGas: boolean;
  dappSuggestedGasWarning: boolean;
}

/**
 * `TransactionReview` is an untyped JS component wrapped in `withNavigation`,
 * whose inferred props collapse to `never`; expose the props actually used.
 */
const TransactionReviewView =
  TransactionReview as unknown as ComponentType<TransactionReviewProps>;

const getEstimatedBaseFee = (
  gasFeeEstimates: GasFeeEstimates,
): string | undefined =>
  'estimatedBaseFee' in gasFeeEstimates
    ? gasFeeEstimates.estimatedBaseFee
    : undefined;

const getFeeMarketEstimates = (
  gasFeeEstimates: GasFeeEstimates,
): GasFeeEstimatesByLevel | undefined =>
  'estimatedBaseFee' in gasFeeEstimates
    ? (gasFeeEstimates as GasFeeEstimatesByLevel)
    : undefined;

interface CollectibleTransferInformation {
  name: string;
  tradable: boolean;
  method?: string;
}

const collectibleTransferInfoByAddress: Record<
  string,
  CollectibleTransferInformation | undefined
> = collectiblesTransferInformation;

const tokenIdToString = (tokenId: unknown): string =>
  typeof tokenId === 'number' ? tokenId.toString(16) : String(tokenId);

type GasFeeEstimates = ReturnType<typeof selectGasFeeEstimates>;

const getGasFeeEstimateOption = (
  gasFeeEstimates: GasFeeEstimates,
  option: string | null,
): SelectedGasFee => {
  if (!gasFeeEstimates || !option) return {};
  const value: unknown = (gasFeeEstimates as Record<string, unknown>)[option];
  return value && typeof value === 'object' ? (value as SelectedGasFee) : {};
};

const getLegacyGasFeeEstimate = (
  gasFeeEstimates: GasFeeEstimates,
  option: string | null,
): string | undefined => {
  if (!gasFeeEstimates || !option) return undefined;
  const value: unknown = (gasFeeEstimates as Record<string, unknown>)[option];
  return typeof value === 'string' ? value : undefined;
};

interface DataGenerationOptions {
  selectedAsset?: TransactionState['selectedAsset'];
  value?: TxMeta['value'];
  to?: string;
}

export interface EIP1559GasData {
  suggestedGasLimit?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxFeePerGasHex?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedMaxPriorityFeePerGasHex?: string;
  renderableGasFeeMinNative?: string;
  renderableGasFeeMinConversion?: string;
  renderableGasFeeMaxNative?: string;
  renderableGasFeeMaxConversion?: string;
  renderableMaxPriorityFeeNative?: string;
  renderableMaxPriorityFeeConversion?: string;
  renderableMaxFeePerGasNative?: string;
  renderableMaxFeePerGasConversion?: string;
  gasFeeMaxNative?: string;
  gasFeeMinNative?: string;
  maxPriorityFeeNative?: string;
  gasLimitHex?: string;
  totalMaxHex?: string;
  timeEstimate?: string;
  timeEstimateColor?: string;
  timeEstimateId?: string;
  error?: string;
  [key: string]: unknown;
}

export interface LegacyGasData {
  suggestedGasLimit?: string;
  suggestedGasLimitHex?: string;
  suggestedGasPrice?: string;
  suggestedGasPriceHex?: string;
  totalHex?: string;
  transactionFee?: string;
  transactionFeeFiat?: string;
  error?: string;
  [key: string]: unknown;
}

export interface LegacyGasObject {
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
}

interface SelectedGasFee {
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  selectedOption?: string | null;
  [key: string]: unknown;
}

interface DappSuggestedEIP1559Gas {
  maxFeePerGas: TxMeta['maxFeePerGas'];
  maxPriorityFeePerGas: TxMeta['maxPriorityFeePerGas'];
}

export interface TransactionEditorConfirmArgs {
  gasEstimateType: GasEstimateType;
  EIP1559GasData: EIP1559GasData;
  gasSelected: string | null;
}

interface TransactionEditorOwnProps {
  /**
   * Current mode this transaction editor is in
   */
  mode?: TransactionEditorMode;
  /**
   * Callback triggered when this transaction is cancelled
   */
  onCancel?: () => void;
  /**
   * Callback triggered when this transaction is confirmed
   */
  onConfirm?: (args: TransactionEditorConfirmArgs) => void;
  /**
   * Called when a user changes modes
   */
  onModeChange?: (mode: TransactionEditorMode) => void;
  /**
   * Whether the transaction was confirmed or not
   */
  transactionConfirmed?: boolean;
  /**
   * Whether was prompted from approval
   */
  promptedFromApproval?: boolean;
  dappTransactionModalVisible?: boolean;
}

interface TransactionEditorStateProps {
  /**
   * List of accounts from the AccountTrackerController
   */
  accounts: ReturnType<typeof selectAccounts>;
  /**
   * Object containing accounts balances
   */
  contractBalances: ReturnType<typeof selectContractBalances>;
  networkType?: string;
  /**
   * String containing the selected address
   */
  selectedAddress?: string;
  /**
   * Current selected ticker
   */
  ticker?: string;
  /**
   * Transaction object associated with this transaction
   */
  transaction: NormalizedTransaction;
  activeTabUrl?: string;
  /**
   * Gas fee estimates returned by the gas fee controller
   */
  gasFeeEstimates: ReturnType<typeof selectGasFeeEstimates>;
  /**
   * Estimate type returned by the gas fee controller, can be market-fee, legacy or eth_gasPrice
   */
  gasEstimateType: GasEstimateType;
  conversionRate: ReturnType<typeof selectConversionRateByChainId>;
  currentCurrency: ReturnType<typeof selectCurrentCurrency>;
  /**
   * ETH or fiat, depending on user setting
   */
  primaryCurrency: string;
  /**
   * ID of the associated chain
   */
  chainId: Hex;
}

interface TransactionEditorDispatchProps {
  /**
   * Action that sets transaction attributes from object to a transaction
   */
  setTransactionObject: (transaction: TransactionPayload) => void;
}

export type TransactionEditorProps = TransactionEditorOwnProps &
  TransactionEditorStateProps &
  TransactionEditorDispatchProps;

interface TransactionEditorState {
  toFocused: boolean;
  ensRecipient?: string;
  ready: boolean;
  error?: string | boolean;
  data?: string;
  amountError?: string | boolean;
  toAddressError?: string;
  over: boolean;
  gasSelected: string | null;
  gasSelectedTemp: string | null;
  EIP1559GasData: EIP1559GasData;
  EIP1559GasDataTemp: EIP1559GasData;
  LegacyGasData: LegacyGasData;
  LegacyGasDataTemp: LegacyGasData;
  legacyGasObject: LegacyGasObject;
  legacyGasTransaction: LegacyGasData;
  suggestedMaxFeePerGas?: string;
  dappSuggestedGasPrice?: TxMeta['gasPrice'] | null;
  dappSuggestedEIP1559Gas?: DappSuggestedEIP1559Gas | null;
  advancedGasInserted?: boolean;
  animateOnChange?: boolean;
  stopUpdateGas?: boolean;
  isAnimating?: boolean;
  pollToken?: string;
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
      let initialGas: SelectedGasFee, initialGasTemp: SelectedGasFee;
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
        initialGas = getGasFeeEstimateOption(gasFeeEstimates, gasSelected);
        initialGasTemp = getGasFeeEstimateOption(
          gasFeeEstimates,
          gasSelectedTemp,
        );
      }

      const suggestedGasLimit = fromWei(transaction.gas, 'wei');

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
      const suggestedGasLimit = fromWei(transaction.gas, 'wei');
      const getGas = (selected: string | null): string | undefined =>
        dappSuggestedGasPrice
          ? fromWei(dappSuggestedGasPrice, 'gwei')
          : gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY
          ? getLegacyGasFeeEstimate(this.props.gasFeeEstimates, selected)
          : getLegacyGasFeeEstimate(this.props.gasFeeEstimates, 'gasPrice');

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
        setTransactionObject as unknown as DappSetTransactionObject,
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
    const { transaction, setTransactionObject } = this.props;

    const zeroGas = new BN('00');
    const hasGasPrice = Boolean(transaction.gasPrice);
    const hasGasLimit =
      transaction.gas !== undefined && !new BN(transaction.gas).eq(zeroGas);
    const hasEIP1559Gas =
      Boolean(transaction.maxFeePerGas) &&
      Boolean(transaction.maxPriorityFeePerGas);
    if (!hasGasLimit)
      handleGetGasLimit(
        toDappTransaction(transaction),
        setTransactionObject as unknown as DappSetTransactionObject,
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

    if (transaction && transaction.value) {
      this.handleUpdateAmount(transaction.value, true);
    }
    if (transaction && transaction.assetType === 'ETH') {
      this.handleUpdateReadableValue(fromWei(transaction.value));
    }
    if (transaction && transaction.data) {
      this.setState({ data: transaction.data });
    }
  };

  parseTransactionDataEIP1559 = (gasFee: SelectedGasFee): EIP1559GasData => {
    const { ticker } = this.props;

    const { conversionRate, currentCurrency, gasFeeEstimates } = this.props;

    const parsedTransactionEIP1559 = parseTransactionEIP1559(
      {
        selectedGasFee: {
          ...gasFee,
          estimatedBaseFee: getEstimatedBaseFee(gasFeeEstimates),
        },
        swapsParams: undefined,
        contractExchangeRates: undefined,
        conversionRate: conversionRate as number,
        currentCurrency,
        nativeCurrency: ticker as string,
        gasFeeEstimates: getFeeMarketEstimates(gasFeeEstimates),
      },
      { onlyGas: true },
    ) as unknown as EIP1559GasData;

    parsedTransactionEIP1559.error = this.validateTotal(
      parsedTransactionEIP1559.totalMaxHex,
    );

    return parsedTransactionEIP1559;
  };

  parseTransactionDataLegacy = (
    gasFee: LegacyGasData,
    _options?: { onlyGas: boolean },
  ): LegacyGasData => {
    const { ticker } = this.props;

    const { conversionRate, currentCurrency } = this.props;

    const parsedTransactionLegacy = parseTransactionLegacy(
      {
        contractExchangeRates: undefined,
        conversionRate: conversionRate as number,
        currentCurrency,
        ticker,
        selectedGasFee: gasFee,
        multiLayerL1FeeTotal: undefined,
      },
      { onlyGas: true },
    ) as unknown as LegacyGasData;

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
          !transaction.gas.eq(prevProps?.transaction?.gas ?? new BN(0)) ||
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
  handleUpdateAmount = async (amount: BN, mounting = false) => {
    const {
      transaction: { to, data, assetType, gas: gasLimit },
      transaction,
    } = this.props;
    // If ETH transaction, there is no need to generate new data
    if (assetType === 'ETH') {
      const { gas } = mounting
        ? { gas: gasLimit }
        : await estimateGas(
            { amount: amount as unknown as string, data, to },
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
  handleUpdateData = async (data: string | undefined) => {
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
  handleDataGeneration = async (opts: DataGenerationOptions) => {
    const {
      transaction: { from },
      transaction,
    } = this.props;
    const selectedAsset = opts.selectedAsset
      ? opts.selectedAsset
      : transaction.selectedAsset;
    const assetType: 'ERC721' | 'ERC20' = selectedAsset.tokenId
      ? 'ERC721'
      : 'ERC20';
    const value = opts.value ? opts.value : transaction.value;
    const to = opts.to ? opts.to : transaction.to;
    const generateData: Record<'ERC20' | 'ERC721', () => string | undefined> = {
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
        const address = String(selectedAsset.address).toLowerCase();
        const collectibleTransferInformation =
          address in collectiblesTransferInformation &&
          collectibleTransferInfoByAddress[address];
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
        }
        if (
          collectibleTransferInformation.tradable &&
          collectibleTransferInformation.method === 'transfer'
        ) {
          return generateTransferData('transfer', {
            toAddress: to,
            amount: tokenIdToString(selectedAsset.tokenId),
          });
        }
        return undefined;
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

    const checksummedFrom = (from && safeToChecksumAddress(from)) || '';
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
    this.setState({ toFocused: true });
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
      address as string,
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

  calculateTempGasFee = (gas: SelectedGasFee, selected: string | null) => {
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

  saveGasEdition = (gasSelected: string | null | undefined) => {
    const { gasEstimateType, setTransactionObject } = this.props;
    const { LegacyGasDataTemp } = this.state;

    if (gasEstimateType !== GAS_ESTIMATE_TYPES.FEE_MARKET) {
      handleGasFeeSelection(
        hexToBN(LegacyGasDataTemp.suggestedGasLimitHex),
        hexToBN(LegacyGasDataTemp.suggestedGasPriceHex),
        setTransactionObject as unknown as DappSetTransactionObject,
      );
    }

    this.setState(
      {
        LegacyGasData: { ...this.state.LegacyGasDataTemp },
        EIP1559GasData: { ...this.state.EIP1559GasDataTemp },
        gasSelected: gasSelected ?? null,
        gasSelectedTemp: gasSelected ?? null,
        advancedGasInserted: !gasSelected,
        stopUpdateGas: false,
        dappSuggestedGasPrice: null,
        dappSuggestedEIP1559Gas: null,
      },
      this.review,
    );
  };

  calculateTotalGasValue = (totalHex?: string): string => fromWei(totalHex);

  updateEIP1559GasDataFromLegacyTransaction = ({
    legacyGasTransaction,
    totalGasValue,
  }: {
    legacyGasTransaction: LegacyGasData;
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
    gasTransaction: EditLegacyGasTransaction | undefined,
    legacyGasObject: LegacyGasObject,
  ) => {
    const { setTransactionObject, gasEstimateType } = this.props;
    const legacyGasTransaction: LegacyGasData = { ...gasTransaction };
    const totalHex = legacyGasTransaction?.totalHex;
    legacyGasTransaction.error = this.validateTotal(totalHex);

    handleGasFeeSelection(
      hexToBN(legacyGasTransaction.suggestedGasLimitHex),
      hexToBN(legacyGasTransaction.suggestedGasPriceHex),
      setTransactionObject as unknown as DappSetTransactionObject,
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
              <TransactionReviewView
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
                toDappTransaction(transaction),
                '',
                gasEstimateType,
              )}
              isAnimating={Boolean(isAnimating)}
              onCancel={this.cancelGasEditionLegacy}
              onSave={this.saveGasEditionLegacy}
              onlyGas={false}
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
              gasOptions={gasFeeEstimates as unknown as EIP1559GasOptions}
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

const mapStateToProps = (state: RootState): TransactionEditorStateProps => {
  const transaction: NormalizedTransaction = getNormalizedTxState(state);
  const chainId = transaction?.chainId as Hex;

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

const mapDispatchToProps = (
  dispatch: Dispatch,
): TransactionEditorDispatchProps => ({
  setTransactionObject: (transaction: TransactionPayload) =>
    dispatch(setTransactionObjectAction(transaction)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TransactionEditor);
