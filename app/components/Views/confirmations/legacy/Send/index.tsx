import React, { ComponentType, PureComponent } from 'react';
import { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import { Dispatch } from 'redux';
import { Hex } from '@metamask/utils';
import { JsonMap } from '@segment/analytics-react-native';
import BN from 'bnjs4';
import {
  TransactionMeta,
  TransactionParams,
  WalletDevice,
} from '@metamask/transaction-controller';
import { Token } from '@metamask/assets-controllers';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  InteractionManager,
  ActivityIndicator,
  Alert,
  StyleSheet,
  View,
} from 'react-native';
import Engine from '../../../../../core/Engine';
import EditAmount from '../SendFlow/Amount';
import ConfirmSend from '../SendFlow/Confirm';
import {
  toBN,
  BNToHex,
  hexToBN,
  fromWei,
  fromTokenMinimalUnit,
} from '../../../../../util/number';
import { toChecksumAddress } from 'ethereumjs-util';
import { strings } from '../../../../../../locales/i18n';
import { getTransactionOptionsTitle } from '../../../../UI/Navbar';
import { connect } from 'react-redux';
import {
  resetTransaction,
  setTransactionObject,
  TransactionAssetType,
  TransactionStateParams,
} from '../../../../../actions/transaction';
import { toggleDappTransactionModal } from '../../../../../actions/modals';
import NotificationManager from '../../../../../core/NotificationManager';
import { showAlert } from '../../../../../actions/alert';
import { MetaMetricsEvents } from '../../../../../core/Analytics';
import {
  getTransactionReviewActionKey,
  decodeTransferData,
  getTransactionToName,
  generateTransferData,
} from '../../../../../util/transactions';
import Logger from '../../../../../util/Logger';
import { getAddress } from '../../../../../util/address';
import { MAINNET } from '../../../../../constants/network';
import BigNumber from 'bignumber.js';
import {
  addTransaction,
  estimateGas,
} from '../../../../../util/transaction-controller';

import { KEYSTONE_TX_CANCELED } from '../../../../../constants/error';
import { ThemeContext, mockTheme } from '../../../../../util/theme';
import { Theme } from '../../../../../util/theme/models';
import {
  getBlockaidTransactionMetricsParams,
  TransactionType as BlockaidTransactionType,
} from '../../../../../util/blockaid';
import { RootState } from '../../../../../reducers';
import { IWithMetricsAwarenessProps } from '../../../../../components/hooks/useMetrics/withMetricsAwareness.types';
import { selectTokenList } from '../../../../../selectors/tokenListController';
import { selectTokens } from '../../../../../selectors/tokensController';
import { selectAccounts } from '../../../../../selectors/accountTrackerController';
import { selectContractBalances } from '../../../../../selectors/tokenBalancesController';
import {
  selectInternalAccounts,
  selectSelectedInternalAccountFormattedAddress,
} from '../../../../../selectors/accountsController';
import { providerErrors } from '@metamask/rpc-errors';
import { withMetricsAwareness } from '../../../../../components/hooks/useMetrics';
import { selectShouldUseSmartTransaction } from '../../../../../selectors/smartTransactionsController';
import { STX_NO_HASH_ERROR } from '../../../../../util/smart-transactions/smart-publish-hook';
import { toLowerCaseEquals } from '../../../../../util/general';
import { selectAddressBook } from '../../../../../selectors/addressBookController';
import TransactionTypes from '../../../../../core/TransactionTypes';
import {
  // Pending updated multichain UX to specify the send chain.
  /* eslint-disable no-restricted-syntax */
  selectEvmChainId,
  selectNetworkClientId,
  /* eslint-enable no-restricted-syntax */
  selectProviderTypeByChainId,
} from '../../../../../selectors/networkController';

const REVIEW = 'review';
const EDIT = 'edit';
const SEND = 'Send';

/**
 * Asset selected in the legacy send flow (native token, ERC20 or collectible).
 */
interface SendAsset {
  address: string;
  symbol?: string;
  contractName?: string;
  decimals?: number;
  tokenId?: string;
  isETH?: boolean;
}

/**
 * Token resolved from a `send-token` deeplink.
 */
interface SendDeeplinkToken {
  address: string;
  symbol?: string;
  decimals?: number;
}

/**
 * Transaction slice of the redux store as consumed by this screen.
 */
interface SendTransactionState {
  transaction: TransactionStateParams;
  id?: string;
  gas?: BN;
  gasPrice?: BN;
  value?: BN | string;
  to?: string;
  from?: string;
  data?: string;
  selectedAsset: SendAsset;
  assetType?: TransactionAssetType;
  providerType?: string;
  chainId?: Hex;
}

/**
 * Deeplink payload (`txMeta` route param) that can start a transaction.
 */
interface DeeplinkParameters {
  value?: string;
  address?: string;
  uint256?: string;
  gas?: string;
  gasPrice?: string;
}

interface DeeplinkTxMeta {
  target_address: string;
  action?: string;
  source?: string;
  parameters?: DeeplinkParameters | null;
}

/**
 * Transaction state built from a deeplink before being stored in redux.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type NewTxMeta = {
  symbol?: string;
  assetType?: TransactionAssetType;
  paymentRequest?: boolean;
  selectedAsset?: SendAsset | SendDeeplinkToken;
  to?: string;
  ensRecipient?: string;
  transactionTo?: string;
  transactionToName?: string;
  transactionFromName?: string;
  from?: string;
  value?: string | BN;
  transactionValue?: string;
  readableValue?: string;
  data?: string;
  gas?: string | BN;
  gasPrice?: string | BN;
};

/**
 * Gas estimate as consumed by this screen. The controller no longer returns
 * `gasPrice`, so it is always undefined at runtime.
 */
interface GasEstimate {
  gas: string;
  gasPrice?: string;
}

// `toBN` is untyped JS returning `Object`; it always returns a BN instance.
const toBNValue = (value: string | number): BN => toBN(value as string) as BN;

// `getTransactionToName` is untyped JS; `ensRecipient` is optional at runtime.
const getToName = getTransactionToName as (config: {
  addressBook: Parameters<typeof getTransactionToName>[0]['addressBook'];
  chainId: string;
  toAddress: string;
  internalAccounts: InternalAccount[];
  ensRecipient?: string;
}) => string;

interface AlertConfig {
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data: { msg: string };
}

interface SendRouteParams {
  txMeta?: DeeplinkTxMeta;
  mode?: string;
}

// The legacy flow reads the pre-`txParams` field names off the returned meta.
type LegacyTransactionMeta = TransactionMeta & {
  transaction?: TransactionParams;
  data?: string;
};

interface SendOwnProps {
  navigation: NavigationProp<ParamListBase> & {
    pop: () => void;
    replace: (name: string, params?: object) => void;
  };
  route: RouteProp<{ params: SendRouteParams }, 'params'>;
}

type SendStateProps = ReturnType<typeof mapStateToProps>;
type SendDispatchProps = ReturnType<typeof mapDispatchToProps>;

export type SendProps = SendOwnProps &
  SendStateProps &
  SendDispatchProps &
  IWithMetricsAwarenessProps;

type PreparedTransaction = Omit<
  SendTransactionState,
  'gas' | 'gasPrice' | 'value'
> & {
  gas: string;
  gasPrice: string;
  value: string;
};

interface SendState {
  mode: string;
  transactionKey?: number;
  ready: boolean;
  transactionConfirmed: boolean;
  transactionSubmitted: boolean;
  transaction?: { id: string };
}

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    loader: {
      backgroundColor: colors.background.default,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

/**
 * View that wraps the wraps the "Send" screen
 */
class Send extends PureComponent<SendProps, SendState> {
  static contextType = ThemeContext;

  state: SendState = {
    mode: REVIEW,
    transactionKey: undefined,
    ready: false,
    transactionConfirmed: false,
    transactionSubmitted: false,
  };

  mounted = false;
  unmountHandled = false;

  /**
   * Resets gas and gasPrice of transaction
   */
  async reset() {
    const { globalNetworkClientId, transaction } = this.props;
    const { gas, gasPrice }: GasEstimate = await estimateGas(
      transaction as unknown as TransactionParams,
      globalNetworkClientId,
    );
    this.props.setTransactionObject({
      gas: hexToBN(gas),
      gasPrice: hexToBN(gasPrice as string),
    });
    return this.mounted && this.setState({ transactionKey: Date.now() });
  }

  /**
   * Transaction state is erased, ready to create a new clean transaction
   */
  clear = () => {
    this.props.resetTransaction();
  };

  /**
   * Check if view is called with txMeta object for a deeplink
   */
  async checkForDeeplinks() {
    const { route } = this.props;
    const txMeta = route.params?.txMeta;
    if (txMeta) {
      await this.handleNewTxMeta(txMeta);
    } else {
      this.mounted && this.setState({ ready: true });
    }
  }

  updateNavBar = () => {
    const colors = (this.context as Theme).colors || mockTheme.colors;
    const { navigation, route } = this.props;
    navigation.setOptions(
      getTransactionOptionsTitle('send.confirm', navigation, route, colors),
    );
  };

  /**
   * Sets state mounted to true, resets transaction and check for deeplinks
   */
  async componentDidMount() {
    const {
      navigation,
      transaction: { assetType, selectedAsset },
      contractBalances,
      dappTransactionModalVisible,
      toggleDappTransactionModal: toggleDappTransactionModalProp,
    } = this.props;
    this.updateNavBar();
    navigation &&
      navigation.setParams({
        mode: REVIEW,
        dispatch: this.onModeChange,
        disableModeChange:
          assetType === 'ERC20' &&
          contractBalances[selectedAsset.address as Hex] === undefined,
      });
    dappTransactionModalVisible && toggleDappTransactionModalProp();
    this.mounted = true;
    await this.reset();
    await this.checkForDeeplinks();
  }

  /**
   * Cancels transaction and sets mounted to false
   */
  async componentWillUnmount() {
    const { transactionSubmitted } = this.state;
    const { transaction } = this.state;
    if (!transactionSubmitted && !this.unmountHandled) {
      transaction && (await this.onCancel(transaction.id));
    }
    this.clear();
    this.mounted = false;
  }

  componentDidUpdate(prevProps: SendProps) {
    const prevRoute = prevProps.route;
    const {
      route,
      transaction: { assetType, selectedAsset },
      contractBalances,
      navigation,
    } = this.props;
    this.updateNavBar();
    if (prevRoute && route) {
      const prevTxMeta = prevRoute.params?.txMeta;
      const currentTxMeta = route.params?.txMeta;
      if (
        currentTxMeta?.source &&
        (!prevTxMeta?.source || prevTxMeta.source !== currentTxMeta.source)
      ) {
        this.handleNewTxMeta(currentTxMeta);
      }
    }

    const contractBalance = contractBalances[selectedAsset.address as Hex];
    const erc20ContractBalanceChanged =
      assetType === 'ERC20' &&
      prevProps.contractBalances[selectedAsset.address as Hex] !==
        contractBalance;
    const assetTypeDefined =
      prevProps.transaction.assetType === undefined && assetType === 'ERC20';
    if (assetTypeDefined || erc20ContractBalanceChanged) {
      navigation &&
        navigation.setParams({
          disableModeChange: contractBalance === undefined,
        });
    }
  }

  /**
   * Handle deeplink txMeta recipient
   */
  handleNewTxMetaRecipient = async (
    recipient: string,
  ): Promise<{ to: string | null; ensRecipient?: string }> => {
    const to = await getAddress(recipient, this.props.globalChainId);

    if (!to) {
      NotificationManager.showSimpleNotification({
        status: 'simple_notification_rejected',
        duration: 5000,
        title: strings('transaction.invalid_recipient'),
        description: strings('transaction.invalid_recipient_description'),
      });
      this.props.navigation.navigate('WalletView');
    }
    return { to };
  };

  /**
   * Handle txMeta object, setting neccesary state to make a transaction
   */
  handleNewTxMeta = async ({
    target_address,
    action,
    parameters = null,
  }: DeeplinkTxMeta) => {
    const { addressBook, globalChainId, internalAccounts, selectedAddress } =
      this.props;

    let newTxMeta: NewTxMeta = {};
    let txRecipient: { to: string | null; ensRecipient?: string };
    switch (action) {
      case 'send-eth':
        txRecipient = await this.handleNewTxMetaRecipient(target_address);
        if (!txRecipient.to) return;
        newTxMeta = {
          symbol: 'ETH',
          assetType: 'ETH',
          paymentRequest: true,
          selectedAsset: { symbol: 'ETH', isETH: true } as SendAsset,
          ...txRecipient,
          to: txRecipient.to,
        };

        if (parameters?.value) {
          newTxMeta.value = BNToHex(toBNValue(parameters.value));
          newTxMeta.transactionValue = newTxMeta.value;
          newTxMeta.readableValue = fromWei(newTxMeta.value);
        }

        newTxMeta.transactionToName = getToName({
          addressBook,
          chainId: globalChainId,
          toAddress: newTxMeta.to as string,
          internalAccounts,
          ensRecipient: newTxMeta.ensRecipient,
        });

        newTxMeta.transactionTo = newTxMeta.to;
        break;
      case 'send-token': {
        const selectedAsset = await this.handleTokenDeeplink(target_address);

        const { ensRecipient, to } = await this.handleNewTxMetaRecipient(
          parameters?.address as string,
        );
        if (!to) return;
        const tokenAmount =
          (parameters?.uint256 &&
            new BigNumber(parameters.uint256).toString(16)) ||
          '0';
        newTxMeta = {
          assetType: 'ERC20',
          paymentRequest: true,
          selectedAsset,
          ensRecipient,
          to: selectedAsset.address,
          transactionTo: to,
          data: generateTransferData('transfer', {
            toAddress: to,
            amount: tokenAmount,
          }),
          value: '0x0',
          readableValue:
            fromTokenMinimalUnit(
              parameters?.uint256 || '0',
              selectedAsset.decimals as number,
            ) || '0',
        };
        newTxMeta.transactionToName = getToName({
          addressBook,
          chainId: globalChainId,
          toAddress: to,
          internalAccounts,
          ensRecipient,
        });
        break;
      }
    }

    if (parameters) {
      const { gas, gasPrice } = parameters;
      if (gas) {
        newTxMeta.gas = toBNValue(gas);
      }
      if (gasPrice) {
        newTxMeta.gasPrice = toBNValue(gas as string);
      }

      // if gas and gasPrice is not defined in the deeplink, we should define them
      if (!gas && !gasPrice) {
        const { gas: estimatedGas, gasPrice: estimatedGasPrice }: GasEstimate =
          await estimateGas(
            this.props.transaction as unknown as TransactionParams,
            this.props.globalNetworkClientId,
          );
        newTxMeta = {
          ...newTxMeta,
          gas: estimatedGas,
          gasPrice: estimatedGasPrice,
        };
      }
      // TODO: We should add here support for sending tokens
      // or calling smart contract functions
    }

    if (!newTxMeta.value) {
      newTxMeta.value = toBNValue(0);
    }

    newTxMeta.from = selectedAddress;
    const fromAccount = internalAccounts.find((account) =>
      toLowerCaseEquals(account.address, selectedAddress),
    );
    newTxMeta.transactionFromName = (fromAccount as InternalAccount).metadata
      .name;
    this.props.setTransactionObject(newTxMeta);
    this.mounted && this.setState({ ready: true, transactionKey: Date.now() });
  };

  /**
   * Retrieves ERC20 asset information (symbol and decimals) to be used with deeplinks
   *
   * @param address - Corresponding ERC20 asset address
   *
   * @returns ERC20 asset, containing address, symbol and decimals
   */
  handleTokenDeeplink = async (
    address: string,
  ): Promise<SendDeeplinkToken> => {
    const { tokens, tokenList } = this.props;
    address = toChecksumAddress(address);
    // First check if we have token information in token list
    if (address in tokenList) {
      return tokenList[address];
    }
    // Then check if the token is already in state
    const stateToken = tokens.find(
      (token: Token) => token.address === address,
    );
    if (stateToken) {
      return stateToken;
    }
    // Finally try to query the contract
    const { AssetsContractController } = Engine.context;
    const token: SendDeeplinkToken = { address };
    try {
      const decimals = await AssetsContractController.getERC20TokenDecimals(
        address,
      );
      token.decimals = parseInt(String(decimals));
    } catch (e) {
      // Drop tx since we don't have any form to get decimals and send the correct tx
      this.props.showAlert({
        isVisible: true,
        autodismiss: 2000,
        content: 'clipboard-alert',
        data: { msg: strings(`send.deeplink_failure`) },
      });
      this.onCancel();
    }
    try {
      token.symbol = await AssetsContractController.getERC721AssetSymbol(
        address,
      );
    } catch (e) {
      token.symbol = 'ERC20';
    }
    return token;
  };

  /**
   * Returns transaction object with gas, gasPrice and value in hex format
   *
   * @param {object} transaction - Transaction object
   */
  prepareTransaction = (transaction: SendTransactionState) => ({
    ...transaction,
    gas: BNToHex(transaction.gas as BN),
    gasPrice: BNToHex(transaction.gasPrice as BN),
    value: BNToHex(transaction.value as BN),
  });

  /**
   * Returns transaction object with gas and gasPrice in hex format, value set to 0 in hex format
   * and to set to selectedAsset address
   *
   * @param {object} transaction - Transaction object
   * @param {object} selectedAsset - Asset object
   */
  prepareAssetTransaction = (
    transaction: SendTransactionState,
    selectedAsset: SendAsset,
  ) => ({
    ...transaction,
    gas: BNToHex(transaction.gas as BN),
    gasPrice: BNToHex(transaction.gasPrice as BN),
    value: '0x0',
    to: selectedAsset.address,
  });

  /**
   * Returns transaction object with gas and gasPrice in hex format
   *
   * @param transaction - Transaction object
   */
  sanitizeTransaction = (transaction: SendTransactionState) => ({
    ...transaction,
    gas: BNToHex(transaction.gas as BN),
    gasPrice: BNToHex(transaction.gasPrice as BN),
  });

  /**
   * Removes collectible in case an ERC721 asset is being sent, when not in mainnet
   */
  removeNft = () => {
    const { selectedAsset, assetType, providerType } = this.props.transaction;
    if (assetType === 'ERC721' && providerType !== MAINNET) {
      const { NftController } = Engine.context;
      NftController.removeNft(
        selectedAsset.address,
        selectedAsset.tokenId as string,
      );
    }
  };

  /**
   * Cancels transaction and close send screen before clear transaction state
   *
   * @param if - Transaction id
   */
  onCancel = (id?: string) => {
    Engine.context.ApprovalController.reject(
      id as string,
      providerErrors.userRejectedRequest(),
    );
    this.props.navigation.pop();
    this.unmountHandled = true;
    this.state.mode === REVIEW && this.trackOnCancel();
  };

  /**
   * Confirms transaction. In case of selectedAsset handles a token transfer transaction,
   * if not, and Ether transaction.
   * If success, transaction state is cleared, if not transaction is reset alert about the error
   * and returns to edit transaction
   */
  onConfirm = async () => {
    const { AddressBookController, KeyringController, ApprovalController } =
      Engine.context;
    this.setState({ transactionConfirmed: true });
    const {
      transaction: { selectedAsset, assetType },
      globalChainId,
      globalNetworkClientId,
      addressBook,
    } = this.props;
    let transaction: SendTransactionState | PreparedTransaction =
      this.props.transaction;
    try {
      if (assetType === 'ETH') {
        transaction = this.prepareTransaction(this.props.transaction);
      } else {
        transaction = this.prepareAssetTransaction(
          this.props.transaction,
          selectedAsset,
        );
      }
      const { result, transactionMeta: addedTransactionMeta } =
        await addTransaction(transaction as unknown as TransactionParams, {
          deviceConfirmedOn: WalletDevice.MM_MOBILE,
          networkClientId: globalNetworkClientId,
          origin: TransactionTypes.MMM,
        });
      const transactionMeta: LegacyTransactionMeta = addedTransactionMeta;
      await KeyringController.resetQRKeyringState();
      await ApprovalController.accept(transactionMeta.id, undefined, {
        waitForResult: true,
      });

      // Add to the AddressBook if it's an unkonwn address
      let checksummedAddress: string | null = null;

      if (assetType === 'ETH') {
        checksummedAddress = toChecksumAddress(
          transactionMeta.transaction?.to as string,
        );
      } else if (assetType === 'ERC20') {
        try {
          const [addressTo] =
            decodeTransferData(
              'transfer',
              transactionMeta.transaction?.data as string,
            ) ?? [];
          if (addressTo) {
            checksummedAddress = toChecksumAddress(addressTo);
          }
        } catch (e) {
          Logger.log('Error decoding transfer data', transactionMeta.data);
        }
      } else if (assetType === 'ERC721') {
        try {
          const data = decodeTransferData(
            'transferFrom',
            transactionMeta.transaction?.data as string,
          );
          const addressTo = data?.[1];
          if (addressTo) {
            checksummedAddress = toChecksumAddress(addressTo);
          }
        } catch (e) {
          Logger.log('Error decoding transfer data', transactionMeta.data);
        }
      }
      const existingContact =
        addressBook[globalChainId]?.[checksummedAddress as string];
      if (!existingContact) {
        AddressBookController.set(
          checksummedAddress as string,
          '',
          globalChainId,
        );
      }
      await new Promise((resolve) => {
        resolve(result);
      });
      if (transactionMeta.error) {
        throw transactionMeta.error;
      }
      this.setState({
        transactionConfirmed: false,
        transactionSubmitted: true,
      });
      this.props.navigation.pop();
      InteractionManager.runAfterInteractions(() => {
        NotificationManager.watchSubmittedTransaction({
          ...transactionMeta,
          assetType: transaction.assetType,
        });
        this.removeNft();
      });
    } catch (caughtError) {
      const error = caughtError as Error;
      if (
        !error?.message.startsWith(KEYSTONE_TX_CANCELED) &&
        !error?.message.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          error?.message,
          [{ text: strings('navigation.ok') }],
        );
        Logger.error(error, 'error while trying to send transaction (Send)');
      } else {
        this.props.metrics.trackEvent(
          this.props.metrics
            .createEventBuilder(
              MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
            )
            .build(),
        );
      }
      this.setState({ transactionConfirmed: false });
      await this.reset();
    }
    InteractionManager.runAfterInteractions(() => {
      this.trackOnConfirm();
    });
  };

  /**
   * Call Analytics to track confirm started event for send screen
   */
  trackConfirmScreen = () => {
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CONFIRM_STARTED)
        .addProperties(this.getTrackingParams())
        .build(),
    );
  };

  /**
   * Call Analytics to track confirm started event for send screen
   */
  trackEditScreen = async () => {
    const { transaction } = this.props;
    const actionKey = await getTransactionReviewActionKey(
      { transaction },
      undefined as unknown as string,
    );
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_EDIT_TRANSACTION)
        .addProperties({
          ...this.getTrackingParams(),
          actionKey,
        })
        .build(),
    );
  };

  /**
   * Call Analytics to track cancel pressed
   */
  trackOnCancel = () => {
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CANCEL_TRANSACTION)
        .addProperties(this.getTrackingParams())
        .build(),
    );
  };

  /**
   * Call Analytics to track confirm pressed
   */
  trackOnConfirm = () => {
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(
          MetaMetricsEvents.TRANSACTIONS_COMPLETED_TRANSACTION,
        )
        .addProperties(this.getTrackingParams())
        .build(),
    );
  };

  /**
   * Returns corresponding tracking params to send
   *
   * @return {object} - Object containing view, network type, activeCurrency and assetType
   */
  getTrackingParams = (): JsonMap => {
    const {
      networkType,
      transaction,
      transaction: { selectedAsset, assetType },
      shouldUseSmartTransaction,
    } = this.props;

    return {
      view: SEND,
      network: networkType,
      activeCurrency:
        (selectedAsset &&
          (selectedAsset.symbol || selectedAsset.contractName)) ||
        'ETH',
      assetType,
      ...getBlockaidTransactionMetricsParams(
        transaction as unknown as BlockaidTransactionType,
      ),
      is_smart_transaction: shouldUseSmartTransaction,
    } as JsonMap;
  };

  /**
   * Change transaction mode
   * If changed to 'review' sends an Analytics track event
   *
   * @param mode - Transaction mode, review or edit
   */
  onModeChange = (mode: string) => {
    const { navigation } = this.props;
    navigation && navigation.setParams({ mode });
    this.mounted && this.setState({ mode });
    InteractionManager.runAfterInteractions(() => {
      mode === REVIEW && this.trackConfirmScreen();
      mode === EDIT && this.trackEditScreen();
    });
  };

  changeToReviewMode = () => this.onModeChange(REVIEW);

  getStyles = () => {
    const colors = (this.context as Theme).colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderLoader() {
    const styles = this.getStyles();
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  renderModeComponent() {
    if (this.state.mode === EDIT) {
      return (
        <EditAmount
          transaction={this.props.transaction}
          navigation={this.props.navigation}
          onConfirm={this.changeToReviewMode}
        />
      );
    } else if (this.state.mode === REVIEW) {
      return (
        <ConfirmSend navigation={this.props.navigation} />
      );
    }
  }

  render = () => {
    const styles = this.getStyles();
    return (
      <View style={styles.wrapper}>
        {this.state.ready ? this.renderModeComponent() : this.renderLoader()}
      </View>
    );
  };
}

const mapStateToProps = (state: RootState) => {
  const globalChainId = selectEvmChainId(state);
  const transaction: SendTransactionState = state.transaction;

  return {
    addressBook: selectAddressBook(state),
    accounts: selectAccounts(state),
    contractBalances: selectContractBalances(state),
    transaction,
    networkType: selectProviderTypeByChainId(state, globalChainId),
    tokens: selectTokens(state),
    globalChainId,
    globalNetworkClientId: selectNetworkClientId(state),
    internalAccounts: selectInternalAccounts(state),
    selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
    dappTransactionModalVisible: state.modals
      .dappTransactionModalVisible as boolean,
    tokenList: selectTokenList(state),
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(
      state,
      transaction?.chainId,
    ),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  resetTransaction: () => dispatch(resetTransaction()),
  setTransactionObject: (transaction: NewTxMeta) =>
    dispatch(setTransactionObject(transaction)),
  showAlert: (config: AlertConfig) => dispatch(showAlert(config)),
  toggleDappTransactionModal: () =>
    dispatch(toggleDappTransactionModal(undefined)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  // withMetricsAwareness only preserves the `metrics` prop in its signature;
  // the remaining props are supplied by connect.
  withMetricsAwareness(
    Send as ComponentType<Partial<SendProps> & IWithMetricsAwarenessProps>,
  ),
);
