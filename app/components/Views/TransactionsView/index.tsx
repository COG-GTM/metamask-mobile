import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { connect, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import {
  CompatNavigationProp,
  withNavigation,
} from '@react-navigation/compat';
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
import {
  CHAIN_IDS,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { PopularList } from '../../../util/networks/customNetworks';
import { RootState } from '../../../reducers';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});

// `addAccountTimeFlagFilter` lives in a JavaScript module whose JSDoc types its
// timestamp and flag parameters as `object`, so it is re-typed here.
const shouldAddAccountTimeFlag = addAccountTimeFlagFilter as unknown as (
  transaction: TransactionMeta,
  addedAccountTime: number | undefined,
  accountAddedTimeInsertPointFound: boolean,
) => boolean;

interface TransactionWithImportTime extends TransactionMeta {
  insertImportTime?: boolean;
}

interface OwnProps {
  /**
   * navigation object required to push new views
   */
  navigation: CompatNavigationProp<NavigationProp<ParamListBase>>;
}

interface StateProps {
  /**
   * ETH to current currency conversion rate
   */
  conversionRate: ReturnType<typeof selectConversionRate>;
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency: ReturnType<typeof selectCurrentCurrency>;
  /**
   * InternalAccount object required to get account name, address and import time
   */
  selectedInternalAccount: ReturnType<typeof selectSelectedInternalAccount>;
  /**
   * An array that represents the user transactions
   */
  transactions: ReturnType<typeof selectSortedTransactions>;
  /**
   * A string represeting the network name
   */
  networkType: ReturnType<typeof selectProviderType>;
  /**
   * Array of ERC20 assets
   */
  tokens: ReturnType<typeof selectTokens>;
  /**
   * Current chainId
   */
  chainId: ReturnType<typeof selectChainId>;
  /**
   * Array of network tokens filter
   */
  tokenNetworkFilter: ReturnType<typeof selectTokenNetworkFilter>;
}

interface DispatchProps {
  showAlert: (config: Parameters<typeof showAlert>[0]) => void;
}

type TransactionsViewProps = OwnProps & StateProps & DispatchProps;

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
    TransactionWithImportTime[]
  >([]);
  const [submittedTxs, setSubmittedTxs] = useState<TransactionMeta[]>([]);
  const [confirmedTxs, setConfirmedTxs] = useState<TransactionMeta[]>([]);
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

      // eslint-disable-next-line @typescript-eslint/no-shadow
      const submittedTxs: TransactionMeta[] = [];
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const confirmedTxs: TransactionMeta[] = [];
      const submittedNonces: (string | undefined)[] = [];

      const allTransactionsSorted = sortTransactions(transactions).filter(
        (tx, index, self) =>
          self.findIndex((_tx) => _tx.id === tx.id) === index,
      );

      // eslint-disable-next-line @typescript-eslint/no-shadow
      const allTransactions = allTransactionsSorted.filter((tx) => {
        const filter = filterByAddressAndNetwork(
          tx,
          tokens,
          selectedAddress ?? '',
          networkId,
          chainId,
          tokenNetworkFilter,
        );

        if (!filter) return false;

        tx.insertImportTime = shouldAddAccountTimeFlag(
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
        allTransactionsFiltered?.length
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
  showAlert: (config: Parameters<typeof showAlert>[0]) =>
    dispatch(showAlert(config)),
});

// `withNavigation` is typed to only accept components whose props are exactly
// its injected props, so it is re-typed here to describe what it actually does:
// inject `navigation` and expose the remaining props.
const withCompatNavigation = withNavigation as <
  P extends { navigation: CompatNavigationProp<NavigationProp<ParamListBase>> },
>(
  Comp: React.ComponentType<P>,
) => React.ComponentType<Omit<P, 'navigation'>>;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withCompatNavigation(TransactionsView));
