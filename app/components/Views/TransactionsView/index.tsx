import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { connect, useSelector } from 'react-redux';
import type { Dispatch } from 'redux';
import { RootState } from '../../../reducers';
import {
  withNavigation,
  type CompatNavigationProp,
} from '@react-navigation/compat';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
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

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});

interface TransactionEntry {
  id?: string;
  status?: string;
  chainId?: string;
  time?: number;
  insertImportTime?: boolean;
  txParams: { from: string; nonce?: unknown; [key: string]: unknown };
  [key: string]: unknown;
}

interface OwnProps {
  navigation: CompatNavigationProp<NavigationProp<ParamListBase>>;
}

interface StateProps {
  conversionRate: number;
  currentCurrency: string;
  tokens: { address: string; [key: string]: unknown }[];
  selectedInternalAccount: {
    address: string;
    metadata: {
      importTime?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  transactions: Record<string, unknown>[];
  networkType: string;
  chainId: string;
  tokenNetworkFilter: Record<string, unknown>;
}

interface DispatchProps {
  showAlert: (config: Record<string, unknown>) => void;
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
  const [allTransactions, setAllTransactions] = useState<TransactionEntry[]>([]);
  const [submittedTxs, setSubmittedTxs] = useState<TransactionEntry[]>([]);
  const [confirmedTxs, setConfirmedTxs] = useState<TransactionEntry[]>([]);
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

      const localSubmittedTxs: TransactionEntry[] = [];
      const localConfirmedTxs: TransactionEntry[] = [];
      const submittedNonces: unknown[] = [];

      const allTransactionsSorted = (
        sortTransactions(transactions) as TransactionEntry[]
      ).filter(
        (tx, index, self) =>
          self.findIndex((_tx) => _tx.id === tx.id) === index,
      );

      const localAllTransactions = allTransactionsSorted.filter((tx) => {
        const filter = filterByAddressAndNetwork(
          tx,
          tokens,
          selectedAddress,
          networkId,
          chainId,
          tokenNetworkFilter as unknown as { [key: string]: boolean }[],
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

const mapStateToProps = (state: RootState): StateProps => {
  const chainId = selectChainId(state);

  return {
    conversionRate: selectConversionRate(state) as number,
    currentCurrency: selectCurrentCurrency(state),
    tokens: selectTokens(state),
    selectedInternalAccount: selectSelectedInternalAccount(
      state,
    ) as unknown as StateProps['selectedInternalAccount'],
    transactions: selectSortedTransactions(state),
    networkType: selectProviderType(state),
    chainId,
    tokenNetworkFilter: selectTokenNetworkFilter(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  showAlert: (config) =>
    dispatch(showAlert(config as unknown as Parameters<typeof showAlert>[0])),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withNavigation<
    NavigationProp<ParamListBase>,
    Props,
    React.ComponentType<Props>
  >(TransactionsView),
);
