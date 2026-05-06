import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Dispatch } from 'redux';
import type { ParamListBase } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
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
import type { RootState } from '../../../reducers';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});

interface TransactionItem {
  id: string;
  status: string;
  chainId: string;
  txParams: {
    from: string;
    nonce: string;
    [key: string]: unknown;
  };
  insertImportTime?: boolean;
  [key: string]: unknown;
}

interface TokenItem {
  address: string;
  symbol: string;
  [key: string]: unknown;
}

interface InternalAccount {
  address: string;
  metadata: {
    importTime?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface OwnProps {
  navigation: StackNavigationProp<ParamListBase>;
  tabLabel?: string;
}

interface StateProps {
  conversionRate: number;
  currentCurrency: string;
  selectedInternalAccount: InternalAccount;
  transactions: TransactionItem[];
  networkType: string;
  chainId: string;
  tokens: TokenItem[];
  tokenNetworkFilter: Record<string, unknown>;
}

interface DispatchProps {
  showAlert: (config: {
    isVisible: boolean;
    autodismiss: number;
    content: string;
    data: { msg: string };
  }) => void;
}

type Props = OwnProps & StateProps & DispatchProps;

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
}: Props) => {
  const [allTransactions, setAllTransactions] = useState<TransactionItem[]>([]);
  const [submittedTxs, setSubmittedTxs] = useState<TransactionItem[]>([]);
  const [confirmedTxs, setConfirmedTxs] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean | undefined>();
  const selectedNetworkClientId = useSelector(selectSelectedNetworkClientId);

  const selectedAddress = toChecksumHexAddress(
    selectedInternalAccount?.address,
  );

  const isPopularNetwork = useSelector(selectIsPopularNetwork);

  const filterTransactions = useCallback(
    (networkId: string) => {
      let accountAddedTimeInsertPointFound = false;
      const addedAccountTime = selectedInternalAccount?.metadata.importTime;

      const submittedTxsLocal: TransactionItem[] = [];
      const confirmedTxsLocal: TransactionItem[] = [];
      const submittedNonces: string[] = [];

      const allTransactionsSorted = sortTransactions(transactions).filter(
        (tx: TransactionItem, index: number, self: TransactionItem[]) =>
          self.findIndex((_tx: TransactionItem) => _tx.id === tx.id) === index,
      );

      const allTransactionsLocal = allTransactionsSorted.filter(
        (tx: TransactionItem) => {
          const filter = filterByAddressAndNetwork(
            tx,
            tokens,
            selectedAddress,
            networkId,
            chainId,
            tokenNetworkFilter,
          );

          if (!filter) return false;

          tx.insertImportTime = addAccountTimeFlagFilter(
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
              submittedTxsLocal.push(tx);
              return false;
            case TX_CONFIRMED:
              confirmedTxsLocal.push(tx);
              break;
          }

          return filter;
        },
      );

      const allTransactionsFiltered = isPopularNetwork
        ? allTransactionsLocal.filter(
            (tx: TransactionItem) =>
              tx.chainId === CHAIN_IDS.MAINNET ||
              tx.chainId === CHAIN_IDS.LINEA_MAINNET ||
              PopularList.some(
                (network: { chainId: string }) =>
                  network.chainId === tx.chainId,
              ),
          )
        : allTransactionsLocal.filter(
            (tx: TransactionItem) => tx.chainId === chainId,
          );

      const submittedTxsFiltered = submittedTxsLocal.filter(({ txParams }) => {
        const { from, nonce } = txParams;
        if (!toLowerCaseEquals(from, selectedAddress)) {
          return false;
        }
        const alreadySubmitted = submittedNonces.includes(nonce);
        const alreadyConfirmed = confirmedTxsLocal.find(
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
      setConfirmedTxs(confirmedTxsLocal);
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

const mapStateToProps = (state: RootState): StateProps => {
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

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  showAlert: (config) => dispatch(showAlert(config)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withNavigation(TransactionsView));
