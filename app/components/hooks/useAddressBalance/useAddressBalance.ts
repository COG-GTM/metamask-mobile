import { ERC1155, ERC721 } from '@metamask/controller-utils';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import BN4 from 'bnjs4';
import { Hex } from '@metamask/utils';

import Engine from '../../../core/Engine';
import { getTicker } from '../../../util/transactions';
import {
  renderFromTokenMinimalUnit,
  renderFromWei,
} from '../../../util/number';
import { safeToChecksumAddress } from '../../../util/address';
import {
  selectEvmChainId,
  selectEvmTicker,
  selectSelectedNetworkClientId,
} from '../../../selectors/networkController';
import { selectAccounts } from '../../../selectors/accountTrackerController';
import {
  selectContractBalances,
  selectTokensBalances,
} from '../../../selectors/tokenBalancesController';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import { Asset } from './useAddressBalance.types';

const useAddressBalance = (
  asset?: Asset,
  address?: string,
  dontWatchAsset?: boolean,
) => {
  const [addressBalance, setAddressBalance] = useState('0');

  const accounts = useSelector(selectAccounts);
  const contractBalances = useSelector(selectContractBalances);
  const selectedAddress = useSelector(
    selectSelectedInternalAccountFormattedAddress,
  );
  const ticker = useSelector(selectEvmTicker);
  const selectedNetworkClientId = useSelector(selectSelectedNetworkClientId);
  const chainId = useSelector(selectEvmChainId);
  const allTokenBalances = useSelector(selectTokensBalances);

  useEffect(() => {
    if (asset && !asset.isETH && !asset.tokenId) {
      const {
        address: rawAddress,
        symbol = 'ERC20',
        decimals,
        image,
        name,
      } = asset;
      const contractAddress = safeToChecksumAddress(rawAddress);
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { TokensController } = Engine.context as any;
      if (!contractAddress || !decimals) {
        return;
      }

      if (!contractBalances[contractAddress] && !dontWatchAsset) {
        TokensController.addToken({
          address: contractAddress,
          symbol,
          decimals,
          image,
          name,
          networkClientId: selectedNetworkClientId,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isNativeOrNftAsset =
    !asset ||
    Boolean(asset.isETH) ||
    Boolean(asset.tokenId) ||
    asset.standard === ERC721 ||
    asset.standard === ERC1155;
  const tokenDecimals = isNativeOrNftAsset ? undefined : asset?.decimals;
  const tokenSymbol = asset?.symbol ?? 'ERC20';
  const checksumAddress = address ? safeToChecksumAddress(address) : undefined;
  const contractAddress =
    tokenDecimals !== undefined && asset?.address
      ? safeToChecksumAddress(asset.address)
      : undefined;
  const nativeBalance =
    isNativeOrNftAsset && checksumAddress
      ? accounts[checksumAddress]?.balance
      : undefined;
  const trackedTokenBalance =
    contractAddress && selectedAddress === address
      ? contractBalances[contractAddress]
      : undefined;
  // Polled balance for the displayed owner, used only as a refresh signal for the RPC branch.
  const ownerTokenBalance =
    contractAddress && address
      ? allTokenBalances?.[address.toLowerCase() as Hex]?.[chainId as Hex]?.[
          contractAddress as Hex
        ]
      : undefined;

  useEffect(() => {
    // on signature request, asset is undefined
    if (!address) {
      return;
    }

    if (isNativeOrNftAsset) {
      if (!checksumAddress) {
        return;
      }
      setAddressBalance(
        `${renderFromWei(nativeBalance ?? '0')} ${getTicker(ticker)}`,
      );
      return;
    }

    if (tokenDecimals === undefined || !contractAddress) {
      return;
    }

    if (trackedTokenBalance) {
      setAddressBalance(
        `${renderFromTokenMinimalUnit(
          trackedTokenBalance,
          tokenDecimals,
        )} ${tokenSymbol}`,
      );
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { AssetsContractController } = Engine.context;
        const balance = await AssetsContractController.getERC20BalanceOf(
          contractAddress,
          address,
        );
        if (cancelled) {
          return;
        }
        setAddressBalance(
          `${renderFromTokenMinimalUnit(
            // This is to work around incompatibility between bn.js v4/v5 - should be removed when migration to v5 is complete
            new BN4(balance?.toString(10) || '0', 10),
            tokenDecimals,
          )} ${tokenSymbol}`,
        );
      } catch (exp) {
        if (!cancelled) {
          console.error(`Error in trying to fetch token balance - ${exp}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    address,
    checksumAddress,
    contractAddress,
    isNativeOrNftAsset,
    nativeBalance,
    ownerTokenBalance,
    selectedNetworkClientId,
    ticker,
    tokenDecimals,
    tokenSymbol,
    trackedTokenBalance,
  ]);
  return { addressBalance };
};

export default useAddressBalance;
