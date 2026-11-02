import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import {
  newAssetTransaction,
  setSelectedAsset,
} from '../../../../../../actions/transaction';
import Routes from '../../../../../../constants/navigation/Routes';
import { selectAccountsByChainId } from '../../../../../../selectors/accountTrackerController';
import { selectSelectedInternalAccount } from '../../../../../../selectors/accountsController';
import { doENSReverseLookup } from '../../../../../../util/ENSUtils';
import { renderFromWei, hexToBN } from '../../../../../../util/number';
import { getEther, getTicker } from '../../../../../../util/transactions';
import { AddressFrom } from '../../../../../UI/AddressInputs';
import { SFAddressFromProps } from './AddressFrom.types';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { selectNativeCurrencyByChainId } from '../../../../../../selectors/networkController';
import { RootState } from '../../../../../../reducers';
import { Hex } from '@metamask/utils';

const SendFlowAddressFrom = ({
  chainId,
  fromAccountBalanceState,
  setFromAddress,
}: SFAddressFromProps) => {
  const navigation = useNavigation();

  const ticker = useSelector((state: RootState) =>
    selectNativeCurrencyByChainId(state, chainId as Hex),
  );
  const accountsByChainId = useSelector(selectAccountsByChainId);
  const accounts = accountsByChainId[chainId];

  const selectedInternalAccount = useSelector(selectSelectedInternalAccount);
  const checksummedSelectedAddress = selectedInternalAccount
    ? toChecksumHexAddress(selectedInternalAccount.address)
    : null;

  const [accountAddress, setAccountAddress] = useState(
    checksummedSelectedAddress,
  );
  const [accountName, setAccountName] = useState(
    selectedInternalAccount?.metadata.name,
  );
  const [accountBalance, setAccountBalance] = useState('');

  const dispatch = useDispatch();

  const selectedAsset = useSelector(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => state.transaction.selectedAsset,
  );

  const selectedAssetAction = useCallback(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (asset: any) => dispatch(setSelectedAsset(asset)),
    [dispatch],
  );

  const newAssetTransactionAction = useCallback(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (asset: any) => dispatch(newAssetTransaction(asset)),
    [dispatch],
  );

  const selectedAssetRef = useRef(selectedAsset);

  useEffect(() => {
    if (
      selectedAssetRef.current.isETH ||
      Object.keys(selectedAssetRef.current).length === 0
    ) {
      newAssetTransactionAction(getEther(ticker as string));
      selectedAssetAction(getEther(ticker as string));
    } else {
      newAssetTransactionAction(selectedAssetRef.current);
    }
  }, [newAssetTransactionAction, selectedAssetAction, ticker]);

  const [selectedAccountEns, setSelectedAccountEns] = useState<
    string | undefined
  >();

  useEffect(() => {
    let cancelled = false;
    setSelectedAccountEns(undefined);
    async function lookupEns() {
      if (checksummedSelectedAddress) {
        const ens = await doENSReverseLookup(
          checksummedSelectedAddress,
          chainId,
        );
        if (!cancelled) {
          setSelectedAccountEns(ens);
        }
      }
    }
    lookupEns();
    return () => {
      cancelled = true;
    };
  }, [checksummedSelectedAddress, chainId]);

  useEffect(() => {
    if (checksummedSelectedAddress) {
      setAccountName(
        selectedAccountEns || selectedInternalAccount?.metadata.name,
      );
    }
  }, [
    checksummedSelectedAddress,
    selectedAccountEns,
    selectedInternalAccount?.metadata.name,
  ]);

  const selectedAccountBalance =
    checksummedSelectedAddress && accounts?.[checksummedSelectedAddress]
      ? accounts[checksummedSelectedAddress].balance
      : undefined;

  useEffect(() => {
    if (selectedAccountBalance !== undefined) {
      setAccountBalance(
        `${renderFromWei(selectedAccountBalance)} ${getTicker(ticker)}`,
      );
      fromAccountBalanceState(hexToBN(selectedAccountBalance).isZero());
    }
  }, [selectedAccountBalance, ticker, fromAccountBalanceState]);

  const onSelectAccount = async (address: string) => {
    const name = selectedInternalAccount?.metadata.name;
    const balance = `${renderFromWei(accounts[address].balance)} ${getTicker(
      ticker,
    )}`;
    const ens = await doENSReverseLookup(address, chainId);
    const accName = ens || name;
    const balanceIsZero = hexToBN(accounts[address].balance).isZero();
    selectedAssetAction(getEther(ticker as string));
    setAccountAddress(address);
    setAccountName(accName);
    setAccountBalance(balance);
    fromAccountBalanceState(balanceIsZero);
    setFromAddress(address);
  };

  const openAccountSelector = () => {
    navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
      screen: Routes.SHEET.ACCOUNT_SELECTOR,
      params: {
        isSelectOnly: true,
        onSelectAccount,
        disablePrivacyMode: true,
      },
    });
  };

  return (
    <AddressFrom
      onPressIcon={openAccountSelector}
      fromAccountAddress={accountAddress}
      fromAccountName={accountName}
      fromAccountBalance={accountBalance}
    />
  );
};

export default SendFlowAddressFrom;
