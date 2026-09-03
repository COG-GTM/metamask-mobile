import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { connect, useSelector } from 'react-redux';
import type { Dispatch } from 'redux';
import { withNavigation } from '@react-navigation/compat';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  CHAIN_IDS,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { RootState } from '../../../reducers';
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

type TransactionMetaWithImportTime = TransactionMeta & {
  insertImportTime?: boolean;
};

interface OwnProps {
  navigation: NavigationProp<ParamListBase>;
}

interface StateProps {
  conversionRate: ReturnType<typeof selectConversionRate>;
  currentCurrency: ReturnType<typeof selectCurrentCurrency>;
  selectedInternalAccount: InternalAccount | undefined;
  networkType: ReturnType<typeof selectProviderType>;
  transactions: TransactionMetaWithImportTime[];
  chainId: ReturnType<typeof selectChainId>;
  tokens: ReturnType<typeof selectTokens>;
  tokenNetworkFilter: ReturnType<typeof selectTokenNetworkFilter>;
}

interface DispatchProps {
  showAlert: (config: Parameters<typeof showAlert>[0]) => void;
}

type Props = OwnProps & StateProps & DispatchProps;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});

const addAccountTimeFlagFilterTyped = addAccountTimeFlagFilter as unknown as (
  transaction: TransactionMetaWithImportTime,
  addedAccountTime: number | undefined,
  accountAddedTimeInsertPointFound: boolean,
) => boolean;

const TransactionsView = ({
  navigation,
  selectedInternalAccount,
  transactions,
  chainId,
  tokens,
  tokenNetworkFilter,
}: Props) => {
  const [allTransactions, setAllTransactions] = useState<
    TransactionMetaWithImportTime[]
  >([]);
  const [submittedTxs, setSubmittedTxs] = useState<
    TransactionMetaWithImportTime[]
  >([]);
  const [confirmedTxs, setConfirmedTxs] = useState<
    TransactionMetaWithImportTime[]
  >([]);
  const [loading, setLoading] = useState<boolean | undefined>();
  const selectedNetworkClientId = useSelector(selectSelectedNetworkClientId);

  const selectedAddress = selectedInternalAccount?.address
    ? toChecksumHexAddress(selectedInternalAccount.address)
    : undefined;

  const isPopularNetwork = useSelector(selectIsPopularNetwork);

  const filterTransactions = useCallback(
    (networkId: string) => {
      let accountAddedTimeInsertPointFound = false;
      const addedAccountTime = selectedInternalAccount?.metadata.importTime;

      const pendingTransactions: TransactionMetaWithImportTime[] = [];
      const confirmedTransactions: TransactionMetaWithImportTime[] = [];
      const submittedNonces: (string | number | undefined)[] = [];

      const allTransactionsSorted = sortTransactions(transactions).filter(
        (tx, index, self) =>
          self.findIndex((_tx) => _tx.id === tx.id) === index,
      );

      const filteredTransactions = allTransactionsSorted.filter((tx) => {
        const filter = filterByAddressAndNetwork(
          tx,
          tokens,
          selectedAddress ?? '',
          networkId,
          chainId,
          tokenNetworkFilter as unknown as { [key: string]: boolean }[],
        );

        if (!filter) return false;

        tx.insertImportTime = addAccountTimeFlagFilterTyped(
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
            pendingTransactions.push(tx);
            return false;
          case TX_CONFIRMED:
            confirmedTransactions.push(tx);
            break;
        }

        return filter;
      });

      const allTransactionsFiltered = isPopularNetwork
        ? filteredTransactions.filter(
            (tx) =>
              tx.chainId === CHAIN_IDS.MAINNET ||
              tx.chainId === CHAIN_IDS.LINEA_MAINNET ||
              PopularList.some((network) => network.chainId === tx.chainId),
          )
        : filteredTransactions.filter((tx) => tx.chainId === chainId);

      const submittedTxsFiltered = pendingTransactions.filter(
        ({ txParams }) => {
          const { from, nonce } = txParams;
          if (!toLowerCaseEquals(from, selectedAddress)) {
            return false;
          }
          const alreadySubmitted = submittedNonces.includes(nonce);
          const alreadyConfirmed = confirmedTransactions.find(
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
      setSubmittedTxs(submittedTxsFiltered);
      setConfirmedTxs(confirmedTransactions);
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
        navigation={
          navigation as unknown as {
            navigate: (...args: unknown[]) => void;
            push: (...args: unknown[]) => void;
          }
        }
        transactions={allTransactions}
        submittedTransactions={submittedTxs}
        confirmedTransactions={confirmedTxs}
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
    transactions: selectSortedTransactions(
      state,
    ) as unknown as TransactionMetaWithImportTime[],
    networkType: selectProviderType(state),
    chainId,
    tokenNetworkFilter: selectTokenNetworkFilter(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  showAlert: (config) => dispatch(showAlert(config)),
});

const withNavigationTyped = withNavigation as unknown as (
  component: React.ComponentType<Props>,
) => React.ComponentType<Omit<Props, 'navigation'>>;

const TransactionsViewWithNavigation = withNavigationTyped(TransactionsView);

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TransactionsViewWithNavigation);
