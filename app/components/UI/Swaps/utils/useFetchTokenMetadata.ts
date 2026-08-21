import { useEffect, useState } from 'react';
import axios, { type CancelTokenSource } from 'axios';
import { swapsUtils } from '@metamask/swaps-controller';
import type { Hex } from '@metamask/utils';

export interface TokenMetadata {
  address: string;
  symbol: string;
  decimals: number;
  occurrences?: number;
  aggregators?: string[];
  iconUrl?: string;
  name?: string;
  type?: string;
}

export interface TokenMetadataState {
  valid: boolean | null;
  error: boolean;
  metadata: TokenMetadata | null;
}

const defaultTokenMetadata: TokenMetadataState = {
  valid: null,
  error: false,
  metadata: null,
};

function useFetchTokenMetadata(
  address: string | null | undefined,
  chainId: Hex,
): [boolean, TokenMetadataState] {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenMetadata, setTokenMetadata] =
    useState<TokenMetadataState>(defaultTokenMetadata);

  useEffect(() => {
    if (!address) {
      return;
    }

    let cancelTokenSource: CancelTokenSource | undefined;
    async function fetchTokenMetadata() {
      try {
        cancelTokenSource = axios.CancelToken.source();
        setTokenMetadata(defaultTokenMetadata);
        setIsLoading(true);
        const { data } = await axios.request<TokenMetadata>({
          url: swapsUtils.getTokenMetadataURL(chainId),
          params: {
            address,
          },
          cancelToken: cancelTokenSource.token,
        });
        setTokenMetadata({ error: false, valid: true, metadata: data });
      } catch (error) {
        // Address is not an ERC20
        if (axios.isAxiosError(error) && error.response?.status === 422) {
          setTokenMetadata({ error: false, valid: false, metadata: null });
        } else {
          setTokenMetadata({ ...defaultTokenMetadata, error: true });
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

  return [isLoading, tokenMetadata];
}

export default useFetchTokenMetadata;
