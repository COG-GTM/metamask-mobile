import { useEffect, useState } from 'react';
import axios, { AxiosError, CancelTokenSource } from 'axios';
import { swapsUtils } from '@metamask/swaps-controller';
import { Hex } from '@metamask/utils';

export interface SwapsTokenMetadata {
  address?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  iconUrl?: string;
}

export interface TokenMetadataState {
  valid: boolean | null;
  error: boolean;
  metadata: SwapsTokenMetadata | null;
}

const defaultTokenMetadata: TokenMetadataState = {
  valid: null,
  error: false,
  metadata: null,
};

function useFetchTokenMetadata(address: string | null, chainId: Hex) {
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
        const { data } = await axios.request<SwapsTokenMetadata>({
          url: swapsUtils.getTokenMetadataURL(chainId),
          params: {
            address,
          },
          cancelToken: cancelTokenSource.token,
        });
        setTokenMetadata({ error: false, valid: true, metadata: data });
      } catch (error) {
        // Address is not an ERC20
        if ((error as AxiosError)?.response?.status === 422) {
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

  return [isLoading, tokenMetadata] as const;
}

export default useFetchTokenMetadata;
