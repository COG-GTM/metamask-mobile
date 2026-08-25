import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Dispatch } from 'redux';
import { connect, useSelector } from 'react-redux';
import { CompatNavigationProp, withNavigation } from '@react-navigation/compat';
import { showAlert } from '../../../actions/alert';
import Transactions from '../../UI/Transactions';
import {
  TX_UNAPPROVED,
  TX_SUBMITTED,
  TX_SIGNED,
  TX_PENDING,
  TX_CONFIRMED,
} from '../../../constants/transaction';
import {
  sortTransactions,
  filterByAddressAndNetwork,
} from '../../../util/activity';
import { safeToChecksumAddress } from '../../../util/address';
import { addAccountTimeFlagFilter } from '../../../util/transactions';
import { toLowerCaseEquals } from '../../../util/general';
import {
  selectChainId,
  selectIsPopularNetwork,
  selectProviderType,
  selectSelectedNetworkClientId,
} from '../../../selectors/networkController';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../selectors/currencyRateController';
import { selectTokens } from '../../../selectors/tokensController';
import { selectSelectedInternalAccount } from '../../../selectors/accountsController';
import { selectSortedTransactions } from '../../../selectors/transactionController';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { selectTokenNetworkFilter } from '../../../selectors/preferencesController';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { PopularList } from '../../../util/networks/customNetworks';
import { RootState } from '../../../reducers';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});

/**
 * Shape of the transactions handled by this view. Transactions come from the
 * transaction controller and are augmented locally with `insertImportTime`.
 */
interface ViewTransaction {
  id?: string;
  status?: string;
  chainId?: string;
  insertImportTime?: boolean;
  txParams: { from?: string; nonce?: string };
  [key: string]: unknown;
}

interface AlertConfig {
  isVisible: boolean;
  autodismiss?: number;
  content?: string;
  data?: { msg: string };
}

interface TransactionsViewProps {
  /**
   * ETH to current currency conversion rate
   */
  conversionRate?: number;
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency?: string;
  /**
   * InternalAccount object required to get account name, address and import time
   */
  selectedInternalAccount?: ReturnType<typeof selectSelectedInternalAccount>;
  /**
   * navigation object required to push new views
   */
  navigation: CompatNavigationProp<NavigationProp<ParamListBase>>;
  /**
   * An array that represents the user transactions
   */
  transactions?: ViewTransaction[];
  /**
   * A string represeting the network name
   */
  networkType?: string;
  /**
   * Array of ERC20 assets
   */
  tokens?: ReturnType<typeof selectTokens>;
  /**
   * Current chainId
   */
  chainId?: string;
  /**
   * Array of network tokens filter
   */
  tokenNetworkFilter?: ReturnType<typeof selectTokenNetworkFilter>;
}

const TransactionsView = ({
  navigation,
  conversionRate,
  selectedInternalAccount,
  networkType,
  currentCurrency,
  transactions,
  chainId,
  tokens,
  tokenNetworkFilter,
}: TransactionsViewProps) => {
  const [allTransactions, setAllTransactions] = useState<ViewTransaction[]>([]);
  const [submittedTxs, setSubmittedTxs] = useState<ViewTransaction[]>([]);
  const [confirmedTxs, setConfirmedTxs] = useState<ViewTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>();
  const selectedNetworkClientId = useSelector(selectSelectedNetworkClientId);

  const selectedAddress = toChecksumHexAddress(
    selectedInternalAccount?.address,
  );

  const isPopularNetwork = useSelector(selectIsPopularNetwork);

  const filterTransactions = useCallback(
    (networkId: string) => {
      let accountAddedTimeInsertPointFound = false;
      const addedAccountTime = selectedInternalAccount?.metadata.importTime;

      const submittedTxs: ViewTransaction[] = [];
      const confirmedTxs: ViewTransaction[] = [];
      const submittedNonces: (string | undefined)[] = [];

      const allTransactionsSorted: ViewTransaction[] = sortTransactions(
        transactions ?? [],
      ).filter(
        (tx: ViewTransaction, index: number, self: ViewTransaction[]) =>
          self.findIndex((_tx) => _tx.id === tx.id) === index,
      );

      const allTransactions = allTransactionsSorted.filter((tx) => {
        const filter = filterByAddressAndNetwork(
          tx,
          tokens as Parameters<typeof filterByAddressAndNetwork>[1],
          selectedAddress as string,
          networkId,
          chainId as string,
          tokenNetworkFilter,
        );

        if (!filter) return false;

        tx.insertImportTime = addAccountTimeFlagFilter(
          tx,
          addedAccountTime as unknown as object,
          accountAddedTimeInsertPointFound as unknown as object,
        );
        if (tx.insertImportTime) accountAddedTimeInsertPointFound = true;

        switch (tx.status) {
          case TX_SUBMITTED:
          case TX_SIGNED:
          case TX_UNAPPROVED:
          case TX_PENDING:
            submittedTxs.push(tx);
            return false;
          case TX_CONFIRMED:
            confirmedTxs.push(tx);
            break;
        }

        return filter;
      });

      const allTransactionsFiltered = isPopularNetwork
        ? allTransactions.filter(
            (tx) =>
              tx.chainId === CHAIN_IDS.MAINNET ||
              tx.chainId === CHAIN_IDS.LINEA_MAINNET ||
              PopularList.some((network) => network.chainId === tx.chainId),
          )
        : allTransactions.filter((tx) => tx.chainId === chainId);

      const submittedTxsFiltered = submittedTxs.filter(({ txParams }) => {
        const { from, nonce } = txParams;
        if (!toLowerCaseEquals(from, selectedAddress)) {
          return false;
        }
        const alreadySubmitted = submittedNonces.includes(nonce);
        const alreadyConfirmed = confirmedTxs.find(
          (tx) =>
            toLowerCaseEquals(
              safeToChecksumAddress(tx.txParams.from as string),
              selectedAddress,
            ) && tx.txParams.nonce === nonce,
        );
        if (alreadyConfirmed) {
          return false;
        }
        submittedNonces.push(nonce);
        return !alreadySubmitted;
      });

      // If the account added insert point is not found, add it to the last transaction
      if (
        !accountAddedTimeInsertPointFound &&
        allTransactionsFiltered &&
        allTransactionsFiltered.length
      ) {
        allTransactionsFiltered[
          allTransactionsFiltered.length - 1
        ].insertImportTime = true;
      }

      setAllTransactions(allTransactionsFiltered);
      setSubmittedTxs(submittedTxsFiltered);
      setConfirmedTxs(confirmedTxs);
      setLoading(false);
    },
    [
      transactions,
      selectedInternalAccount,
      selectedAddress,
      tokens,
      chainId,
      tokenNetworkFilter,
      isPopularNetwork,
    ],
  );

  useEffect(() => {
    setLoading(true);

    if (selectedNetworkClientId) {
      filterTransactions(selectedNetworkClientId);
    }
  }, [filterTransactions, selectedNetworkClientId]);

  return (
    <View style={styles.wrapper}>
      <Transactions
        navigation={navigation}
        transactions={allTransactions}
        submittedTransactions={submittedTxs}
        confirmedTransactions={confirmedTxs}
        conversionRate={conversionRate}
        currentCurrency={currentCurrency}
        selectedAddress={selectedAddress}
        networkType={networkType}
        loading={loading}
      />
    </View>
  );
};

const mapStateToProps = (state: RootState) => {
  const chainId = selectChainId(state);

  return {
    conversionRate: selectConversionRate(state),
    currentCurrency: selectCurrentCurrency(state),
    tokens: selectTokens(state),
    selectedInternalAccount: selectSelectedInternalAccount(state),
    transactions: selectSortedTransactions(state),
    networkType: selectProviderType(state),
    chainId,
    tokenNetworkFilter: selectTokenNetworkFilter(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  showAlert: (config: AlertConfig) =>
    dispatch(showAlert(config as Parameters<typeof showAlert>[0])),
});

const ConnectedTransactionsView = connect(
  mapStateToProps,
  mapDispatchToProps,
)(withNavigation(TransactionsView));

/**
 * `withNavigation` erases the remaining own props in its types, so the public
 * type only exposes the props consumers actually pass.
 */
export default ConnectedTransactionsView as unknown as React.ComponentType<{
  tabLabel?: string;
}>;
