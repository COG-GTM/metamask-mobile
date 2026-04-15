import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
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

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});

interface InternalAccount {
  address: string;
  metadata: {
    importTime: number;
  };
}

interface Transaction {
  id: string;
  status: string;
  chainId: string;
  insertImportTime?: boolean;
  txParams: {
    from: string;
    to: string;
    nonce: string;
  };
  [key: string]: unknown;
}

interface TransactionsViewProps {
  /** ETH to current currency conversion rate */
  conversionRate: number;
  /** Currency code of the currently-active currency */
  currentCurrency: string;
  /** InternalAccount object required to get account name, address and import time */
  selectedInternalAccount: InternalAccount;
  /** navigation object required to push new views */
  navigation: Record<string, unknown>;
  /** An array that represents the user transactions */
  transactions: Transaction[];
  /** A string representing the network name */
  networkType: string;
  /** Array of ERC20 assets */
  tokens: { address: string; [key: string]: unknown }[];
  /** Current chainId */
  chainId: string;
  /** Object of network tokens filter */
  tokenNetworkFilter: Record<string, unknown>;
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

      const submittedTxs: Transaction[] = [];
      const confirmedTxs: Transaction[] = [];
      const submittedNonces: string[] = [];

      const allTransactionsSorted = sortTransactions(transactions).filter(
        (tx, index, self) =>
          self.findIndex((_tx) => _tx.id === tx.id) === index,
      );

      const allTransactions = allTransactionsSorted.filter((tx) => {
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


const mapStateToProps = (state: Record<string, unknown>) => {
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

const mapDispatchToProps = (dispatch: (action: unknown) => void) => ({
  showAlert: (config: { isVisible: boolean; autodismiss: number; content: string; data: Record<string, string> }) => dispatch(showAlert(config)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withNavigation(TransactionsView));
