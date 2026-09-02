import { useEffect, useState } from 'react';
import axios, { CancelTokenSource, isAxiosError } from 'axios';
import { swapsUtils } from '@metamask/swaps-controller';
import { Hex } from '@metamask/utils';

interface TokenMetadata {
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  iconUrl?: string;
}

type TokenMetadataState =
  | { valid: true; error: false; metadata: TokenMetadata }
  | { valid: false; error: false; metadata: null }
  | { valid: null; error: boolean; metadata: null };

const defaultTokenMetadata: TokenMetadataState = {
  valid: null,
  error: false,
  metadata: null,
};

function useFetchTokenMetadata(
  address?: string,
  chainId?: Hex,
): readonly [boolean, TokenMetadataState] {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState(defaultTokenMetadata);

  useEffect(() => {
    if (!address || !chainId) {
      return;
    }
    const tokenChainId = chainId;

    let cancelTokenSource: CancelTokenSource | undefined;
    async function fetchTokenMetadata(): Promise<void> {
      try {
        // eslint-disable-next-line import/no-named-as-default-member
        cancelTokenSource = axios.CancelToken.source();
        setTokenMetadata(defaultTokenMetadata);
        setIsLoading(true);
        const { data } = await axios.request<TokenMetadata>({
          url: swapsUtils.getTokenMetadataURL(tokenChainId),
          params: {
            address,
          },
          cancelToken: cancelTokenSource.token,
        });
        setTokenMetadata({ error: false, valid: true, metadata: data });
      } catch (error: unknown) {
        // Address is not an ERC20
        if (isAxiosError(error) && error.response?.status === 422) {
          setTokenMetadata({ error: false, valid: false, metadata: null });
        } else {
          setTokenMetadata({ valid: null, error: true, metadata: null });
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchTokenMetadata();

    return () => {
      cancelTokenSource?.cancel();
      setIsLoading(false);
      setTokenMetadata(defaultTokenMetadata);
    };
  }, [address, chainId]);

  return [isLoading, tokenMetadata] as const;
}

export default useFetchTokenMetadata;
