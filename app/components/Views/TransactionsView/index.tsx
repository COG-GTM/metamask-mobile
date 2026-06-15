import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { connect, useSelector } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import {
  TransactionMeta,
  CHAIN_IDS,
} from '@metamask/transaction-controller';
import { withNavigation, CompatNavigationProp } from '@react-navigation/compat';
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
import { PopularList } from '../../../util/networks/customNetworks';
import { RootState } from '../../../reducers';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});

interface TransactionsViewStateProps {
  conversionRate: ReturnType<typeof selectConversionRate>;
  currentCurrency: ReturnType<typeof selectCurrentCurrency>;
  tokens: ReturnType<typeof selectTokens>;
  selectedInternalAccount: ReturnType<typeof selectSelectedInternalAccount>;
  transactions: ReturnType<typeof selectSortedTransactions>;
  networkType: ReturnType<typeof selectProviderType>;
  chainId: ReturnType<typeof selectChainId>;
  tokenNetworkFilter: ReturnType<typeof selectTokenNetworkFilter>;
}

interface TransactionsViewDispatchProps {
  showAlert: (config: Parameters<typeof showAlert>[0]) => void;
}

interface TransactionsViewOwnProps {
  /**
   * navigation object required to push new views
   */
  navigation: CompatNavigationProp<NavigationProp<ParamListBase>>;
}

type TransactionsViewProps = TransactionsViewOwnProps &
  TransactionsViewStateProps &
  TransactionsViewDispatchProps;

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
  const [allTransactions, setAllTransactions] = useState<TransactionMeta[]>([]);
  const [submittedTxs, setSubmittedTxs] = useState<TransactionMeta[]>([]);
  const [confirmedTxs, setConfirmedTxs] = useState<TransactionMeta[]>([]);
  const [loading, setLoading] = useState<boolean>();
  const selectedNetworkClientId = useSelector(selectSelectedNetworkClientId);

  const selectedAddress = toChecksumHexAddress(
    selectedInternalAccount?.address as string,
  );

  const isPopularNetwork = useSelector(selectIsPopularNetwork);

  const filterTransactions = useCallback(
    (networkId: string) => {
      let accountAddedTimeInsertPointFound = false;
      const addedAccountTime = selectedInternalAccount?.metadata.importTime;

      const collectedSubmittedTxs: TransactionMeta[] = [];
      const collectedConfirmedTxs: TransactionMeta[] = [];
      const submittedNonces: (string | undefined)[] = [];

      const allTransactionsSorted = sortTransactions(transactions).filter(
        (tx, index, self) =>
          self.findIndex((_tx) => _tx.id === tx.id) === index,
      );

      const collectedTransactions = allTransactionsSorted.filter((tx) => {
        const filter = filterByAddressAndNetwork(
          tx,
          tokens,
          selectedAddress,
          networkId,
          chainId,
          tokenNetworkFilter as unknown as { [key: string]: boolean }[],
        );

        if (!filter) return false;

        tx.insertImportTime = (
          addAccountTimeFlagFilter as unknown as (
            transaction: unknown,
            addedAccountTime: number | undefined,
            accountAddedTimeInsertPointFound: boolean,
          ) => boolean
        )(tx, addedAccountTime, accountAddedTimeInsertPointFound);
        if (tx.insertImportTime) accountAddedTimeInsertPointFound = true;

        switch (tx.status) {
          case TX_SUBMITTED:
          case TX_SIGNED:
          case TX_UNAPPROVED:
          case TX_PENDING:
            collectedSubmittedTxs.push(tx);
            return false;
          case TX_CONFIRMED:
            collectedConfirmedTxs.push(tx);
            break;
        }

        return filter;
      });

      const allTransactionsFiltered = isPopularNetwork
        ? collectedTransactions.filter(
            (tx) =>
              tx.chainId === CHAIN_IDS.MAINNET ||
              tx.chainId === CHAIN_IDS.LINEA_MAINNET ||
              PopularList.some((network) => network.chainId === tx.chainId),
          )
        : collectedTransactions.filter((tx) => tx.chainId === chainId);

      const submittedTxsFiltered = collectedSubmittedTxs.filter(({ txParams }) => {
        const { from, nonce } = txParams;
        if (!toLowerCaseEquals(from, selectedAddress)) {
          return false;
        }
        const alreadySubmitted = submittedNonces.includes(nonce);
        const alreadyConfirmed = collectedConfirmedTxs.find(
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
      setConfirmedTxs(collectedConfirmedTxs);
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

const mapStateToProps = (state: RootState): TransactionsViewStateProps => {
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

const mapDispatchToProps = (
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>,
): TransactionsViewDispatchProps => ({
  showAlert: (config: Parameters<typeof showAlert>[0]) =>
    dispatch(showAlert(config)),
});

const withNavigationTyped = withNavigation as unknown as (
  Component: React.ComponentType<TransactionsViewProps>,
) => React.ComponentType<Omit<TransactionsViewProps, 'navigation'>>;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withNavigationTyped(TransactionsView));
