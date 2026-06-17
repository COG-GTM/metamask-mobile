import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dispatch } from 'redux';
import {
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';
import { connect, useSelector } from 'react-redux';
import { withNavigation } from '@react-navigation/compat';
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

// The underlying activity utilities (sortTransactions, filterByAddressAndNetwork)
// are untyped, so transactions are treated as the selector's element type.
type Transaction = ReturnType<typeof selectSortedTransactions>[number];

// addAccountTimeFlagFilter is an untyped JS util whose JSDoc types are inaccurate.
const addAccountTimeFlag = addAccountTimeFlagFilter as unknown as (
  transaction: unknown,
  addedAccountTime: number | undefined,
  accountAddedTimeInsertPointFound: boolean,
) => boolean;

interface TransactionsViewProps {
  /**
   * ETH to current currency conversion rate
   */
  conversionRate: number;
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency: string;
  /**
   * InternalAccount object required to get account name, address and import time
   */
  selectedInternalAccount: ReturnType<typeof selectSelectedInternalAccount>;
  /**
   * navigation object required to push new views
   */
  navigation: NavigationProp<ParamListBase>;
  /**
   * An array that represents the user transactions
   */
  transactions: Transaction[];
  /**
   * A string represeting the network name
   */
  networkType: string;
  /**
   * Array of ERC20 assets
   */
  tokens: ReturnType<typeof selectTokens>;
  /**
   * Current chainId
   */
  chainId: string;
  /**
   * Array of network tokens filter
   */
  tokenNetworkFilter: ReturnType<typeof selectTokenNetworkFilter>;
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
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [submittedTxs, setSubmittedTxs] = useState<Transaction[]>([]);
  const [confirmedTxs, setConfirmedTxs] = useState<Transaction[]>([]);
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

      const localSubmittedTxs: Transaction[] = [];
      const localConfirmedTxs: Transaction[] = [];
      const submittedNonces: (string | undefined)[] = [];

      const allTransactionsSorted = sortTransactions(transactions).filter(
        (tx, index, self) =>
          self.findIndex((_tx) => _tx.id === tx.id) === index,
      );

      const localAllTransactions = allTransactionsSorted.filter((tx) => {
        const filter = filterByAddressAndNetwork(
          tx,
          tokens,
          selectedAddress as string,
          networkId,
          chainId,
          tokenNetworkFilter,
        );

        if (!filter) return false;

        tx.insertImportTime = addAccountTimeFlag(
          tx,
          addedAccountTime,
          accountAddedTimeInsertPointFound,
        );
        if (tx.insertImportTime) accountAddedTimeInsertPointFound = true;

        switch (tx.status) {
          case TX_SUBMITTED:
          case TX_SIGNED:
          case TX_UNAPPROVED:
          case TX_PENDING:
            localSubmittedTxs.push(tx);
            return false;
          case TX_CONFIRMED:
            localConfirmedTxs.push(tx);
            break;
        }

        return filter;
      });

      const allTransactionsFiltered = isPopularNetwork
        ? localAllTransactions.filter(
            (tx) =>
              tx.chainId === CHAIN_IDS.MAINNET ||
              tx.chainId === CHAIN_IDS.LINEA_MAINNET ||
              PopularList.some((network) => network.chainId === tx.chainId),
          )
        : localAllTransactions.filter((tx) => tx.chainId === chainId);

      const submittedTxsFiltered = localSubmittedTxs.filter(({ txParams }) => {
        const { from, nonce } = txParams;
        if (!toLowerCaseEquals(from, selectedAddress)) {
          return false;
        }
        const alreadySubmitted = submittedNonces.includes(nonce);
        const alreadyConfirmed = localConfirmedTxs.find(
          (tx) =>
            toLowerCaseEquals(
              safeToChecksumAddress(tx.txParams.from),
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
        allTransactionsFiltered?.length
      ) {
        allTransactionsFiltered[
          allTransactionsFiltered.length - 1
        ].insertImportTime = true;
      }

      setAllTransactions(allTransactionsFiltered);
      setSubmittedTxs(submittedTxsFiltered);
      setConfirmedTxs(localConfirmedTxs);
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
  showAlert: (config: Parameters<typeof showAlert>[0]) =>
    dispatch(showAlert(config)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
)(withNavigation(TransactionsView as React.ComponentType<any>));
