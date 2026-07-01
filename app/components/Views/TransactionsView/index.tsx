import React, {
  useState,
  useEffect,
  useCallback,
  ComponentType,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Dispatch } from 'redux';
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

interface FilterableTx {
  txParams: { from: string; nonce: unknown };
}

interface TransactionsViewProps {
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
   * navigation object required to push new views
   */
  navigation: NavigationProp<ParamListBase>;
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
  const [allTransactions, setAllTransactions] = useState<unknown[]>([]);
  const [submittedTxs, setSubmittedTxs] = useState<FilterableTx[]>([]);
  const [confirmedTxs, setConfirmedTxs] = useState<FilterableTx[]>([]);
  const [loading, setLoading] = useState<boolean>();
  const selectedNetworkClientId = useSelector(selectSelectedNetworkClientId);

  const selectedAddress = toChecksumHexAddress(
    selectedInternalAccount?.address as string,
  );

  const isPopularNetwork = useSelector(selectIsPopularNetwork);

  const filterTransactions = useCallback(
    (networkId: string) => {
      let accountAddedTimeInsertPointFound = false;
      const addedAccountTime = selectedInternalAccount?.metadata?.importTime;

      const txsSubmitted: FilterableTx[] = [];
      const txsConfirmed: FilterableTx[] = [];
      const submittedNonces: unknown[] = [];

      const allTransactionsSorted = sortTransactions(transactions).filter(
        (tx, index, self) =>
          self.findIndex((_tx) => _tx.id === tx.id) === index,
      );

      const txsAll = allTransactionsSorted.filter((tx) => {
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
          addedAccountTime as unknown as object,
          accountAddedTimeInsertPointFound as unknown as object,
        );
        if (tx.insertImportTime) accountAddedTimeInsertPointFound = true;

        switch (tx.status) {
          case TX_SUBMITTED:
          case TX_SIGNED:
          case TX_UNAPPROVED:
          case TX_PENDING:
            txsSubmitted.push(tx);
            return false;
          case TX_CONFIRMED:
            txsConfirmed.push(tx);
            break;
        }

        return filter;
      });

      const allTransactionsFiltered = isPopularNetwork
        ? txsAll.filter(
            (tx) =>
              tx.chainId === CHAIN_IDS.MAINNET ||
              tx.chainId === CHAIN_IDS.LINEA_MAINNET ||
              PopularList.some((network) => network.chainId === tx.chainId),
          )
        : txsAll.filter((tx) => tx.chainId === chainId);

      const submittedTxsFiltered = txsSubmitted.filter(({ txParams }) => {
        const { from, nonce } = txParams;
        if (!toLowerCaseEquals(from, selectedAddress)) {
          return false;
        }
        const alreadySubmitted = submittedNonces.includes(nonce);
        const alreadyConfirmed = txsConfirmed.find(
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
      setConfirmedTxs(txsConfirmed);
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

interface ShowAlertConfig {
  isVisible: boolean;
  autodismiss?: number;
  content?: string;
  data?: unknown;
}

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
  showAlert: (config: ShowAlertConfig) =>
    dispatch(showAlert(config as Parameters<typeof showAlert>[0])),
});

const TransactionsViewWithNavigation = withNavigation(
  TransactionsView as unknown as Parameters<typeof withNavigation>[0],
) as unknown as ComponentType<
  ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>
>;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TransactionsViewWithNavigation);
