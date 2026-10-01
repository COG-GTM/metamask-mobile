import { useEffect, useState } from 'react';
import axios, { CancelTokenSource } from 'axios';
import { swapsUtils } from '@metamask/swaps-controller';
import { Hex } from '@metamask/utils';

export interface TokenMetadataData {
  address?: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  iconUrl?: string;
}

interface TokenMetadata {
  valid: boolean | null;
  error: boolean;
  metadata: TokenMetadataData | null;
}

const defaultTokenMetadata: TokenMetadata = {
  valid: null,
  error: false,
  metadata: null,
};

function useFetchTokenMetadata(
  address?: string | null,
  chainId?: string,
): [boolean, TokenMetadata] {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState(defaultTokenMetadata);

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
        const { data } = await axios.request({
          url: swapsUtils.getTokenMetadataURL(chainId as Hex),
          params: {
            address,
          },
          cancelToken: cancelTokenSource.token,
        });
        setTokenMetadata({ error: false, valid: true, metadata: data });
      } catch (error) {
        // Address is not an ERC20
        if (
          (error as { response?: { status?: number } })?.response?.status ===
          422
        ) {
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
