import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { useTheme } from '../../../../../util/theme';
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
import { Colors } from '../../../../../util/theme/models';
import type { IUseMetricsHook } from '../../../../../components/hooks/useMetrics';

const REVIEW = 'review';
const EDIT = 'edit';
const SEND = 'Send';

const createStyles = (colors: Colors) =>
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

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface OwnProps {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
  metrics: IUseMetricsHook;
}

interface StateProps {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addressBook: Record<string, any>;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts: Record<string, any>;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contractBalances: Record<string, any>;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
  networkType: string | undefined;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokens: any[];
  globalChainId: string;
  globalNetworkClientId: string;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  internalAccounts: any[];
  selectedAddress: string | undefined;
  dappTransactionModalVisible: boolean;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenList: Record<string, any>;
  shouldUseSmartTransaction: boolean;
}

interface DispatchProps {
  resetTransaction: () => void;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTransactionObject: (transaction: any) => void;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showAlert: (config: any) => void;
  toggleDappTransactionModal: () => void;
}

type Props = OwnProps & StateProps & DispatchProps;

/**
 * View that wraps the wraps the "Send" screen
 */
const Send = (props: Props) => {
  const {
    navigation,
    route,
    metrics,
    resetTransaction: resetTransactionAction,
    setTransactionObject: setTransactionObjectAction,
    showAlert: showAlertAction,
    toggleDappTransactionModal: toggleDappTransactionModalAction,
    transaction,
    addressBook,
    globalChainId,
    globalNetworkClientId,
    internalAccounts,
    selectedAddress,
    contractBalances,
    dappTransactionModalVisible,
    tokens,
    tokenList,
    networkType,
    shouldUseSmartTransaction,
  } = props;

  const { colors } = useTheme();

  const [mode, setMode] = useState(REVIEW);
  const [, setTransactionKey] = useState<number | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [transactionConfirmed, setTransactionConfirmed] = useState(false);
  const [transactionSubmitted, setTransactionSubmitted] = useState(false);

  const mountedRef = useRef(false);
  const unmountHandledRef = useRef(false);
  const transactionSubmittedRef = useRef(false);

  // Keep ref in sync with state for use in cleanup
  useEffect(() => {
    transactionSubmittedRef.current = transactionSubmitted;
  }, [transactionSubmitted]);

  const styles = createStyles(colors);

  /**
   * Returns corresponding tracking params to send
   */
  const getTrackingParams = useCallback(() => {
    const { selectedAsset, assetType } = transaction;
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
  }, [networkType, transaction, shouldUseSmartTransaction]);

  /**
   * Call Analytics to track confirm started event for send screen
   */
  const trackConfirmScreen = useCallback(() => {
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CONFIRM_STARTED)
        .addProperties(getTrackingParams())
        .build(),
    );
  }, [metrics, getTrackingParams]);

  /**
   * Call Analytics to track confirm started event for send screen
   */
  const trackEditScreen = useCallback(async () => {
    const actionKey = await getTransactionReviewActionKey({ transaction });
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_EDIT_TRANSACTION)
        .addProperties({
          ...getTrackingParams(),
          actionKey,
        })
        .build(),
    );
  }, [metrics, getTrackingParams, transaction]);

  /**
   * Call Analytics to track cancel pressed
   */
  const trackOnCancel = useCallback(() => {
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CANCEL_TRANSACTION)
        .addProperties(getTrackingParams())
        .build(),
    );
  }, [metrics, getTrackingParams]);

  /**
   * Call Analytics to track confirm pressed
   */
  const trackOnConfirm = useCallback(() => {
    metrics.trackEvent(
      metrics
        .createEventBuilder(
          MetaMetricsEvents.TRANSACTIONS_COMPLETED_TRANSACTION,
        )
        .addProperties(getTrackingParams())
        .build(),
    );
  }, [metrics, getTrackingParams]);

  /**
   * Returns transaction object with gas, gasPrice and value in hex format
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prepareTransaction = useCallback(
    (tx: any) => ({
      ...tx,
      gas: BNToHex(tx.gas),
      gasPrice: BNToHex(tx.gasPrice),
      value: BNToHex(tx.value),
    }),
    [],
  );

  /**
   * Returns transaction object with gas and gasPrice in hex format, value set to 0 in hex format
   * and to set to selectedAsset address
   */
  const prepareAssetTransaction = useCallback(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tx: any, selectedAsset: any) => ({
      ...tx,
      gas: BNToHex(tx.gas),
      gasPrice: BNToHex(tx.gasPrice),
      value: '0x0',
      to: selectedAsset.address,
    }),
    [],
  );

  /**
   * Removes collectible in case an ERC721 asset is being sent, when not in mainnet
   */
  const removeNft = useCallback(() => {
    const { selectedAsset, assetType, providerType } = transaction;
    if (assetType === 'ERC721' && providerType !== MAINNET) {
      const { NftController } = Engine.context;
      NftController.removeNft(selectedAsset.address, selectedAsset.tokenId);
    }
  }, [transaction]);

  /**
   * Resets gas and gasPrice of transaction
   */
  const reset = useCallback(async () => {
    const { gas, gasPrice } = await estimateGas(
      transaction,
      globalNetworkClientId,
    );
    setTransactionObjectAction({
      gas: hexToBN(gas),
      gasPrice: hexToBN(gasPrice),
    });
    if (mountedRef.current) {
      setTransactionKey(Date.now());
    }
  }, [transaction, globalNetworkClientId, setTransactionObjectAction]);

  /**
   * Cancels transaction and close send screen before clear transaction state
   */
  const onCancel = useCallback(
    (id?: string) => {
      Engine.context.ApprovalController.reject(
        id,
        providerErrors.userRejectedRequest(),
      );
      navigation.pop();
      unmountHandledRef.current = true;
      if (mode === REVIEW) {
        trackOnCancel();
      }
    },
    [navigation, mode, trackOnCancel],
  );

  /**
   * Retrieves ERC20 asset information (symbol and decimals) to be used with deeplinks
   */
  const handleTokenDeeplink = useCallback(
    async (address: string) => {
      const checksummedAddr = toChecksumAddress(address);
      // First check if we have token information in token list
      if (checksummedAddr in tokenList) {
        return tokenList[checksummedAddr];
      }
      // Then check if the token is already in state
      const stateToken = tokens.find(
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token: any) => token.address === checksummedAddr,
      );
      if (stateToken) {
        return stateToken;
      }
      // Finally try to query the contract
      const { AssetsContractController } = Engine.context;
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token: any = { address: checksummedAddr };
      try {
        const decimals =
          await AssetsContractController.getERC20TokenDecimals(checksummedAddr);
        token.decimals = parseInt(String(decimals));
      } catch (e) {
        // Drop tx since we don't have any form to get decimals and send the correct tx
        showAlertAction({
          isVisible: true,
          autodismiss: 2000,
          content: 'clipboard-alert',
          data: { msg: strings(`send.deeplink_failure`) },
        });
        onCancel();
      }
      try {
        token.symbol =
          await AssetsContractController.getERC721AssetSymbol(checksummedAddr);
      } catch (e) {
        token.symbol = 'ERC20';
      }
      return token;
    },
    [tokenList, tokens, showAlertAction, onCancel],
  );

  /**
   * Handle deeplink txMeta recipient
   */
  const handleNewTxMetaRecipient = useCallback(
    async (recipient: string) => {
      const to = await getAddress(recipient, globalChainId);

      if (!to) {
        NotificationManager.showSimpleNotification({
          status: 'simple_notification_rejected',
          duration: 5000,
          title: strings('transaction.invalid_recipient'),
          description: strings('transaction.invalid_recipient_description'),
        });
        navigation.navigate('WalletView');
      }
      return { to };
    },
    [globalChainId, navigation],
  );

  /**
   * Handle txMeta object, setting neccesary state to make a transaction
   */
  const handleNewTxMeta = useCallback(
    async ({
      target_address,
      action,
      parameters = null,
    }: {
      target_address: string;
      action: string;
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parameters?: any;
    }) => {
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let newTxMeta: any = {};
      switch (action) {
        case 'send-eth': {
          const txRecipient =
            await handleNewTxMetaRecipient(target_address);
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
            chainId: globalChainId,
            toAddress: newTxMeta.to,
            internalAccounts,
            ensRecipient: newTxMeta.ensRecipient,
          });

          newTxMeta.transactionTo = newTxMeta.to;
          break;
        }
        case 'send-token': {
          const selectedAsset =
            await handleTokenDeeplink(target_address);

          const { ensRecipient, to } = await handleNewTxMetaRecipient(
            parameters.address,
          );
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
          newTxMeta.gas = toBN(gas);
        }
        if (gasPrice) {
          newTxMeta.gasPrice = toBN(gas);
        }

        // if gas and gasPrice is not defined in the deeplink, we should define them
        if (!gas && !gasPrice) {
          const estimated = await estimateGas(
            transaction,
            globalNetworkClientId,
          );
          newTxMeta = {
            ...newTxMeta,
            gas: estimated.gas,
            gasPrice: estimated.gasPrice,
          };
        }
        // TODO: We should add here support for sending tokens
        // or calling smart contract functions
      }

      if (!newTxMeta.value) {
        newTxMeta.value = toBN(0);
      }

      newTxMeta.from = selectedAddress;
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fromAccount = internalAccounts.find((account: any) =>
        toLowerCaseEquals(account.address, selectedAddress),
      );
      newTxMeta.transactionFromName = fromAccount.metadata.name;
      setTransactionObjectAction(newTxMeta);
      if (mountedRef.current) {
        setReady(true);
        setTransactionKey(Date.now());
      }
    },
    [
      handleNewTxMetaRecipient,
      handleTokenDeeplink,
      addressBook,
      globalChainId,
      internalAccounts,
      selectedAddress,
      transaction,
      globalNetworkClientId,
      setTransactionObjectAction,
    ],
  );

  /**
   * Confirms transaction. In case of selectedAsset handles a token transfer transaction,
   * if not, and Ether transaction.
   * If success, transaction state is cleared, if not transaction is reset alert about the error
   * and returns to edit transaction
   */
  const onConfirm = useCallback(async () => {
    const { AddressBookController, KeyringController, ApprovalController } =
      Engine.context;
    setTransactionConfirmed(true);
    const { selectedAsset, assetType } = transaction;
    let tx = transaction;
    try {
      if (assetType === 'ETH') {
        tx = prepareTransaction(tx);
      } else {
        tx = prepareAssetTransaction(tx, selectedAsset);
      }
      const { result, transactionMeta } = await addTransaction(tx, {
        deviceConfirmedOn: WalletDevice.MM_MOBILE,
        networkClientId: globalNetworkClientId,
        origin: TransactionTypes.MMM,
      });
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
        addressBook[globalChainId] &&
        addressBook[globalChainId][checksummedAddress];
      if (!existingContact) {
        AddressBookController.set(checksummedAddress, '', globalChainId);
      }
      await new Promise((resolve) => {
        resolve(result);
      });
      if (transactionMeta.error) {
        throw transactionMeta.error;
      }
      setTransactionConfirmed(false);
      setTransactionSubmitted(true);
      navigation.pop();
      InteractionManager.runAfterInteractions(() => {
        NotificationManager.watchSubmittedTransaction({
          ...transactionMeta,
          assetType: tx.assetType,
        });
        removeNft();
      });
    } catch (error) {
      const err = error as Error;
      if (
        !err?.message.startsWith(KEYSTONE_TX_CANCELED) &&
        !err?.message.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          err && err.message,
          [{ text: strings('navigation.ok') }],
        );
        Logger.error(
          error as Error,
          'error while trying to send transaction (Send)',
        );
      } else {
        metrics.trackEvent(
          metrics
            .createEventBuilder(
              MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
            )
            .build(),
        );
      }
      setTransactionConfirmed(false);
      await reset();
    }
    InteractionManager.runAfterInteractions(() => {
      trackOnConfirm();
    });
  }, [
    transaction,
    prepareTransaction,
    prepareAssetTransaction,
    globalNetworkClientId,
    globalChainId,
    addressBook,
    navigation,
    removeNft,
    reset,
    metrics,
    trackOnConfirm,
  ]);

  /**
   * Change transaction mode
   * If changed to 'review' sends an Analytics track event
   */
  const onModeChange = useCallback(
    (newMode: string) => {
      navigation && navigation.setParams({ mode: newMode });
      if (mountedRef.current) {
        setMode(newMode);
      }
      InteractionManager.runAfterInteractions(() => {
        newMode === REVIEW && trackConfirmScreen();
        newMode === EDIT && trackEditScreen();
      });
    },
    [navigation, trackConfirmScreen, trackEditScreen],
  );

  const changeToReviewMode = useCallback(
    () => onModeChange(REVIEW),
    [onModeChange],
  );

  const updateNavBar = useCallback(() => {
    navigation.setOptions(
      getTransactionOptionsTitle('send.confirm', navigation, route, colors),
    );
  }, [navigation, route, colors]);

  /**
   * Check if view is called with txMeta object for a deeplink
   */
  const checkForDeeplinks = useCallback(async () => {
    const txMeta = route.params?.txMeta;
    if (txMeta) {
      await handleNewTxMeta(txMeta);
    } else if (mountedRef.current) {
      setReady(true);
    }
  }, [route, handleNewTxMeta]);

  // componentDidMount
  useEffect(() => {
    const { assetType, selectedAsset } = transaction;
    updateNavBar();
    navigation &&
      navigation.setParams({
        mode: REVIEW,
        dispatch: onModeChange,
        disableModeChange:
          assetType === 'ERC20' &&
          contractBalances[selectedAsset.address] === undefined,
      });
    if (dappTransactionModalVisible) {
      toggleDappTransactionModalAction();
    }
    mountedRef.current = true;

    const initAsync = async () => {
      await reset();
      await checkForDeeplinks();
    };
    initAsync();

    return () => {
      if (!transactionSubmittedRef.current && !unmountHandledRef.current) {
        const txId = transaction?.id;
        if (txId) {
          Engine.context.ApprovalController.reject(
            txId,
            providerErrors.userRejectedRequest(),
          );
        }
      }
      resetTransactionAction();
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // componentDidUpdate - handle route changes and contract balance changes
  const prevRouteRef = useRef(route);
  const prevContractBalancesRef = useRef(contractBalances);
  const prevTransactionRef = useRef(transaction);

  useEffect(() => {
    updateNavBar();

    const prevRoute = prevRouteRef.current;
    const { assetType, selectedAsset } = transaction;

    if (prevRoute && route) {
      const prevTxMeta = prevRoute.params?.txMeta;
      const currentTxMeta = route.params?.txMeta;
      if (
        currentTxMeta &&
        currentTxMeta.source &&
        (!prevTxMeta?.source || prevTxMeta.source !== currentTxMeta.source)
      ) {
        handleNewTxMeta(currentTxMeta);
      }
    }

    const contractBalance = contractBalances[selectedAsset?.address];
    const erc20ContractBalanceChanged =
      assetType === 'ERC20' &&
      prevContractBalancesRef.current[selectedAsset?.address] !==
        contractBalance;
    const assetTypeDefined =
      prevTransactionRef.current.assetType === undefined &&
      assetType === 'ERC20';
    if (assetTypeDefined || erc20ContractBalanceChanged) {
      navigation &&
        navigation.setParams({
          disableModeChange: contractBalance === undefined,
        });
    }

    prevRouteRef.current = route;
    prevContractBalancesRef.current = contractBalances;
    prevTransactionRef.current = transaction;
  });

  const renderLoader = () => (
    <View style={styles.loader}>
      <ActivityIndicator size="small" />
    </View>
  );

  const renderModeComponent = () => {
    if (mode === EDIT) {
      return (
        <EditAmount
          transaction={transaction}
          navigation={navigation}
          onConfirm={changeToReviewMode}
        />
      );
    } else if (mode === REVIEW) {
      return (
        <ConfirmSend
          transaction={transaction}
          navigation={navigation}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.wrapper}>
      {ready ? renderModeComponent() : renderLoader()}
    </View>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  resetTransaction: () => dispatch(resetTransaction()),
  setTransactionObject: (tx) => dispatch(setTransactionObject(tx)),
  showAlert: (config) => dispatch(showAlert(config)),
  toggleDappTransactionModal: () => dispatch(toggleDappTransactionModal()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(Send));
