import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { connect, useSelector } from 'react-redux';
import type { Dispatch } from 'redux';
import { withNavigation } from '@react-navigation/compat';
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
import { PopularList } from '../../../util/networks/customNetworks';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});

interface InternalAccount {
  address: string;
  metadata: { importTime?: number };
  [key: string]: unknown;
}

interface TransactionTxParams {
  from?: string;
  nonce?: number | string;
  [key: string]: unknown;
}

interface TransactionItem {
  id: string;
  status: string;
  chainId?: string;
  insertImportTime?: boolean;
  txParams: TransactionTxParams;
  [key: string]: unknown;
}

interface Token {
  [key: string]: unknown;
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
  selectedInternalAccount?: InternalAccount;
  /**
   * navigation object required to push new views
   */
  navigation: NavigationProp<ParamListBase>;
  /**
   * An array that represents the user transactions
   */
  transactions: TransactionItem[];
  /**
   * A string representing the network name
   */
  networkType?: string;
  /**
   * Array of ERC20 assets
   */
  tokens?: Token[];
  /**
   * Current chainId
   */
  chainId?: string;
  /**
   * Array of network tokens filter
   */
  tokenNetworkFilter?: Record<string, unknown>;
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
  const [allTransactions, setAllTransactions] = useState<TransactionItem[]>([]);
  const [submittedTxs, setSubmittedTxs] = useState<TransactionItem[]>([]);
  const [confirmedTxs, setConfirmedTxs] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean | undefined>();
  const selectedNetworkClientId = useSelector(selectSelectedNetworkClientId);

  const selectedAddress = toChecksumHexAddress(
    selectedInternalAccount?.address ?? '',
  );

  const isPopularNetwork = useSelector(selectIsPopularNetwork);

  const filterTransactions = useCallback(
    (networkId: string) => {
      let accountAddedTimeInsertPointFound = false;
      const addedAccountTime = selectedInternalAccount?.metadata.importTime;

      const submittedTxs: TransactionItem[] = [];
      const confirmedTxs: TransactionItem[] = [];
      const submittedNonces: (number | string)[] = [];

      const allTransactionsSorted = sortTransactions(
        transactions,
      ).filter(
        (tx: TransactionItem, index: number, self: TransactionItem[]) =>
          self.findIndex((_tx: TransactionItem) => _tx.id === tx.id) ===
          index,
      );

      const allTransactions = allTransactionsSorted.filter(
        (tx: TransactionItem) => {
        const filter = filterByAddressAndNetwork(
          tx,
          tokens ?? [],
          selectedAddress,
          networkId,
          chainId ?? '',
          (tokenNetworkFilter ?? {}) as unknown as {
            [key: string]: boolean;
          }[],
        );

        if (!filter) return false;

        tx.insertImportTime = addAccountTimeFlagFilter(
          tx,
          (addedAccountTime ?? 0) as unknown as object,
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
        },
      );

      const allTransactionsFiltered = isPopularNetwork
        ? allTransactions.filter(
            (tx: TransactionItem) =>
              tx.chainId === CHAIN_IDS.MAINNET ||
              tx.chainId === CHAIN_IDS.LINEA_MAINNET ||
              PopularList.some(
                (network: { chainId: string }) =>
                  network.chainId === tx.chainId,
              ),
          )
        : allTransactions.filter(
            (tx: TransactionItem) => tx.chainId === chainId,
          );

      const submittedTxsFiltered = submittedTxs.filter(
        ({ txParams }: TransactionItem) => {
          const { from, nonce } = txParams;
          if (!toLowerCaseEquals(from, selectedAddress)) {
            return false;
          }
          const alreadySubmitted =
            nonce !== undefined && submittedNonces.includes(nonce);
          const alreadyConfirmed = confirmedTxs.find(
            (tx: TransactionItem) =>
              toLowerCaseEquals(
                safeToChecksumAddress(tx.txParams.from ?? ''),
                selectedAddress,
              ) && tx.txParams.nonce === nonce,
          );
          if (alreadyConfirmed) {
            return false;
          }
          if (nonce !== undefined) submittedNonces.push(nonce);
          return !alreadySubmitted;
        },
      );

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

interface AlertConfig {
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data: Record<string, unknown>;
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  showAlert: (config: AlertConfig) => dispatch(showAlert(config)),
});

const TransactionsViewWithNavigation = withNavigation(
  TransactionsView as unknown as Parameters<typeof withNavigation>[0],
);

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TransactionsViewWithNavigation as unknown as React.ComponentType);
