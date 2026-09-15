import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { connect, useSelector } from 'react-redux';
import { withNavigation, CompatNavigationProp } from '@react-navigation/compat';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Dispatch } from 'redux';
import { RootState } from '../../../reducers';
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
import type { Transaction as TransactionElementTransaction } from '../../UI/TransactionElement/utils';
import { PopularList } from '../../../util/networks/customNetworks';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});

type TransactionsViewTransaction = TransactionElementTransaction;

interface TransactionsViewProps {
  navigation: CompatNavigationProp<StackNavigationProp<ParamListBase>>;
  conversionRate: ReturnType<typeof selectConversionRate>;
  selectedInternalAccount: ReturnType<typeof selectSelectedInternalAccount>;
  networkType: ReturnType<typeof selectProviderType>;
  currentCurrency: ReturnType<typeof selectCurrentCurrency>;
  transactions: TransactionsViewTransaction[];
  chainId: ReturnType<typeof selectChainId>;
  tokens: ReturnType<typeof selectTokens>;
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
  const [allTransactions, setAllTransactions] = useState<
    TransactionsViewTransaction[]
  >([]);
  const [submittedTxs, setSubmittedTxs] = useState<
    TransactionsViewTransaction[]
  >([]);
  const [confirmedTxs, setConfirmedTxs] = useState<
    TransactionsViewTransaction[]
  >([]);
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

      const nextSubmittedTxs: TransactionsViewTransaction[] = [];
      const nextConfirmedTxs: TransactionsViewTransaction[] = [];
      const submittedNonces: (string | undefined)[] = [];

      const allTransactionsSorted: TransactionsViewTransaction[] =
        sortTransactions(transactions).filter(
          (
            tx: TransactionsViewTransaction,
            index: number,
            self: TransactionsViewTransaction[],
          ) => self.findIndex((_tx) => _tx.id === tx.id) === index,
        );

      const nextAllTransactions = allTransactionsSorted.filter((tx) => {
        const filter = filterByAddressAndNetwork(
          tx,
          tokens,
          selectedAddress ?? '',
          networkId,
          chainId,
          tokenNetworkFilter,
        );

        if (!filter) return false;

        tx.insertImportTime = addAccountTimeFlagFilter(
          tx,
          addedAccountTime as number,
          accountAddedTimeInsertPointFound,
        );
        if (tx.insertImportTime) accountAddedTimeInsertPointFound = true;

        switch (tx.status) {
          case TX_SUBMITTED:
          case TX_SIGNED:
          case TX_UNAPPROVED:
          case TX_PENDING:
            nextSubmittedTxs.push(tx);
            return false;
          case TX_CONFIRMED:
            nextConfirmedTxs.push(tx);
            break;
        }

        return filter;
      });

      const allTransactionsFiltered = isPopularNetwork
        ? nextAllTransactions.filter(
            (tx) =>
              tx.chainId === CHAIN_IDS.MAINNET ||
              tx.chainId === CHAIN_IDS.LINEA_MAINNET ||
              PopularList.some((network) => network.chainId === tx.chainId),
          )
        : nextAllTransactions.filter((tx) => tx.chainId === chainId);

      const nextSubmittedTxsFiltered = nextSubmittedTxs.filter(
        ({ txParams }) => {
          const { from, nonce } = txParams;
          if (!toLowerCaseEquals(from, selectedAddress)) {
            return false;
          }
          const alreadySubmitted = submittedNonces.includes(nonce);
          const alreadyConfirmed = nextConfirmedTxs.find(
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
        },
      );

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
      setSubmittedTxs(nextSubmittedTxsFiltered);
      setConfirmedTxs(nextConfirmedTxs);
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
        navigation={navigation as StackNavigationProp<ParamListBase>}
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
)(
  withNavigation<
    StackNavigationProp<ParamListBase>,
    TransactionsViewProps,
    typeof TransactionsView
  >(TransactionsView),
);
