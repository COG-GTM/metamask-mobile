import React, { PureComponent } from 'react';
import {
  InteractionManager,
  ActivityIndicator,
  Alert,
  StyleSheet,
  View,
} from 'react-native';
import { Theme } from '@metamask/design-tokens';
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
import { WalletDevice } from '@metamask/transaction-controller';
import {
  addTransaction,
  estimateGas,
} from '../../../../../util/transaction-controller';

import { KEYSTONE_TX_CANCELED } from '../../../../../constants/error';
import { ThemeContext, mockTheme } from '../../../../../util/theme';
import { getBlockaidTransactionMetricsParams } from '../../../../../util/blockaid';
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
import { RootState } from '../../../../../reducers';

const REVIEW = 'review';
const EDIT = 'edit';
const SEND = 'Send';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any) =>
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

/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Replace "any" with type
interface SendProps {
  navigation?: any;
  resetTransaction: () => void;
  networkType?: string;
  setTransactionObject: (transaction: any) => void;
  tokens?: any[];
  transaction: any;
  showAlert?: (config: any) => void;
  addressBook?: any;
  globalNetworkClientId?: string;
  globalChainId?: string;
  internalAccounts?: any[];
  selectedAddress?: string;
  contractBalances?: any;
  toggleDappTransactionModal?: () => void;
  dappTransactionModalVisible?: boolean;
  tokenList?: any;
  route?: any;
  metrics?: any;
  shouldUseSmartTransaction?: boolean;
  accounts?: any;
}

interface SendState {
  mode: string;
  transactionKey?: any;
  ready: boolean;
  transactionConfirmed: boolean;
  transactionSubmitted: boolean;
  transaction?: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { gas, gasPrice } = (await estimateGas(
      transaction,
      globalNetworkClientId as string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    )) as any;
    this.props.setTransactionObject({
      gas: hexToBN(gas),
      gasPrice: hexToBN(gasPrice),
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
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
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
      toggleDappTransactionModal,
    } = this.props;
    this.updateNavBar();
    navigation &&
      navigation.setParams({
        mode: REVIEW,
        dispatch: this.onModeChange,
        disableModeChange:
          assetType === 'ERC20' &&
          contractBalances[selectedAsset.address] === undefined,
      });
    dappTransactionModalVisible && toggleDappTransactionModal?.();
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
        currentTxMeta &&
        currentTxMeta.source &&
        (!prevTxMeta.source || prevTxMeta.source !== currentTxMeta.source)
      ) {
        this.handleNewTxMeta(currentTxMeta);
      }
    }

    const contractBalance = contractBalances[selectedAsset.address];
    const erc20ContractBalanceChanged =
      assetType === 'ERC20' &&
      prevProps.contractBalances[selectedAsset.address] !== contractBalance;
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
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleNewTxMetaRecipient = async (recipient: any) => {
    const to = await getAddress(recipient, this.props.globalChainId as string);

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
  // TODO: Replace "any" with type
  /* eslint-disable @typescript-eslint/no-explicit-any */
  handleNewTxMeta = async ({
    target_address,
    action,
    parameters = null,
  }: {
    target_address: any;
    action: any;
    parameters?: any;
  }) => {
    const { addressBook, globalChainId, internalAccounts, selectedAddress } =
      this.props;

    let newTxMeta: any = {};
    let txRecipient;
    switch (action) {
      case 'send-eth':
        txRecipient = await this.handleNewTxMetaRecipient(target_address);
        if (!txRecipient.to) return;
        newTxMeta = {
          symbol: 'ETH',
          assetType: 'ETH',
          paymentRequest: true,
          selectedAsset: { symbol: 'ETH', isETH: true },
          ...txRecipient,
        };

        if (parameters && parameters.value) {
          newTxMeta.value = BNToHex(toBN(parameters.value));
          newTxMeta.transactionValue = newTxMeta.value;
          newTxMeta.readableValue = fromWei(newTxMeta.value);
        }

        newTxMeta.transactionToName = getTransactionToName({
          addressBook,
          chainId: globalChainId as string,
          toAddress: newTxMeta.to,
          internalAccounts,
          ensRecipient: newTxMeta.ensRecipient,
        });

        newTxMeta.transactionTo = newTxMeta.to;
        break;
      case 'send-token': {
        const selectedAsset = await this.handleTokenDeeplink(target_address);

        const { ensRecipient, to } = (await this.handleNewTxMetaRecipient(
          parameters.address,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        )) as any;
        if (!to) return;
        const tokenAmount =
          (parameters.uint256 &&
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
              parameters.uint256 || '0',
              selectedAsset.decimals,
            ) || '0',
        };
        newTxMeta.transactionToName = getTransactionToName({
          addressBook,
          chainId: globalChainId as string,
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
        newTxMeta.gas = toBN(gas);
      }
      if (gasPrice) {
        newTxMeta.gasPrice = toBN(gas);
      }

      // if gas and gasPrice is not defined in the deeplink, we should define them
      if (!gas && !gasPrice) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { gas, gasPrice } = (await estimateGas(
          this.props.transaction,
          this.props.globalNetworkClientId as string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        )) as any;
        newTxMeta = {
          ...newTxMeta,
          gas,
          gasPrice,
        };
      }
      // TODO: We should add here support for sending tokens
      // or calling smart contract functions
    }

    if (!newTxMeta.value) {
      newTxMeta.value = toBN(0 as any);
    }

    newTxMeta.from = selectedAddress;
    const fromAccount = (internalAccounts as any).find((account: any) =>
      toLowerCaseEquals(account.address, selectedAddress),
    );
    newTxMeta.transactionFromName = fromAccount.metadata.name;
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
  handleTokenDeeplink = async (address: any) => {
    const { tokens, tokenList } = this.props;
    address = toChecksumAddress(address);
    // First check if we have token information in token list
    if (address in tokenList) {
      return tokenList[address];
    }
    // Then check if the token is already in state
    const stateToken = (tokens as any).find(
      (token: any) => token.address === address,
    );
    if (stateToken) {
      return stateToken;
    }
    // Finally try to query the contract
    const { AssetsContractController } = Engine.context;
    const token: any = { address };
    try {
      const decimals = await AssetsContractController.getERC20TokenDecimals(
        address,
      );
      token.decimals = parseInt(String(decimals));
    } catch (e) {
      // Drop tx since we don't have any form to get decimals and send the correct tx
      this.props.showAlert?.({
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
  prepareTransaction = (transaction: any) => ({
    ...transaction,
    gas: BNToHex(transaction.gas),
    gasPrice: BNToHex(transaction.gasPrice),
    value: BNToHex(transaction.value),
  });

  /**
   * Returns transaction object with gas and gasPrice in hex format, value set to 0 in hex format
   * and to set to selectedAsset address
   *
   * @param {object} transaction - Transaction object
   * @param {object} selectedAsset - Asset object
   */
  prepareAssetTransaction = (transaction: any, selectedAsset: any) => ({
    ...transaction,
    gas: BNToHex(transaction.gas),
    gasPrice: BNToHex(transaction.gasPrice),
    value: '0x0',
    to: selectedAsset.address,
  });

  /**
   * Returns transaction object with gas and gasPrice in hex format
   *
   * @param transaction - Transaction object
   */
  sanitizeTransaction = (transaction: any) => ({
    ...transaction,
    gas: BNToHex(transaction.gas),
    gasPrice: BNToHex(transaction.gasPrice),
  });

  /**
   * Removes collectible in case an ERC721 asset is being sent, when not in mainnet
   */
  removeNft = () => {
    const { selectedAsset, assetType, providerType } = this.props.transaction;
    if (assetType === 'ERC721' && providerType !== MAINNET) {
      const { NftController } = Engine.context;
      NftController.removeNft(selectedAsset.address, selectedAsset.tokenId);
    }
  };

  /**
   * Cancels transaction and close send screen before clear transaction state
   *
   * @param if - Transaction id
   */
  onCancel = (id?: any) => {
    Engine.context.ApprovalController.reject(
      id,
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
    let { transaction } = this.props;
    try {
      if (assetType === 'ETH') {
        transaction = this.prepareTransaction(transaction);
      } else {
        transaction = this.prepareAssetTransaction(transaction, selectedAsset);
      }
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { result, transactionMeta } = (await addTransaction(transaction, {
        deviceConfirmedOn: WalletDevice.MM_MOBILE,
        networkClientId: globalNetworkClientId as string,
        origin: TransactionTypes.MMM,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any;
      await KeyringController.resetQRKeyringState();
      await ApprovalController.accept(transactionMeta.id, undefined, {
        waitForResult: true,
      });

      // Add to the AddressBook if it's an unkonwn address
      let checksummedAddress = null;

      if (assetType === 'ETH') {
        checksummedAddress = toChecksumAddress(transactionMeta.transaction.to);
      } else if (assetType === 'ERC20') {
        try {
          const [addressTo] = decodeTransferData(
            'transfer',
            transactionMeta.transaction.data,
          );
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
            transactionMeta.transaction.data,
          );
          const addressTo = data[1];
          if (addressTo) {
            checksummedAddress = toChecksumAddress(addressTo);
          }
        } catch (e) {
          Logger.log('Error decoding transfer data', transactionMeta.data);
        }
      }
      const existingContact =
        addressBook[globalChainId as string] &&
        addressBook[globalChainId as string][checksummedAddress as string];
      if (!existingContact) {
        AddressBookController.set(
          checksummedAddress as string,
          '',
          globalChainId as `0x${string}`,
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
    } catch (error) {
      if (
        !(error as Error)?.message.startsWith(KEYSTONE_TX_CANCELED) &&
        !(error as Error)?.message.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          error ? (error as Error).message : undefined,
          [{ text: strings('navigation.ok') }],
        );
        Logger.error(
          error as Error,
          'error while trying to send transaction (Send)',
        );
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
  getTrackingParams = () => {
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
      ...getBlockaidTransactionMetricsParams(transaction),
      is_smart_transaction: shouldUseSmartTransaction,
    };
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
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
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
        <ConfirmSend
          transaction={this.props.transaction}
          navigation={this.props.navigation}
        />
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

  return {
    addressBook: selectAddressBook(state),
    accounts: selectAccounts(state),
    contractBalances: selectContractBalances(state),
    transaction: state.transaction,
    networkType: selectProviderTypeByChainId(state, globalChainId),
    tokens: selectTokens(state),
    globalChainId,
    globalNetworkClientId: selectNetworkClientId(state),
    internalAccounts: selectInternalAccounts(state),
    selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
    dappTransactionModalVisible: state.modals.dappTransactionModalVisible,
    tokenList: selectTokenList(state),
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(
      state,
      state.transaction?.chainId,
    ),
  };
};

// TODO: Replace "any" with type
/* eslint-disable @typescript-eslint/no-explicit-any */
const mapDispatchToProps = (dispatch: any) => ({
  resetTransaction: () => dispatch(resetTransaction()),
  setTransactionObject: (transaction: any) =>
    dispatch(setTransactionObject(transaction)),
  showAlert: (config: any) => dispatch(showAlert(config)),
  toggleDappTransactionModal: () => dispatch(toggleDappTransactionModal()),
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
)(withMetricsAwareness(Send as any));
