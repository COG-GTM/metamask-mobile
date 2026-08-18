import { useEffect, useState } from 'react';
import axios, { type CancelTokenSource } from 'axios';
import { swapsUtils } from '@metamask/swaps-controller';

interface TokenMetadata {
  valid: boolean | null;
  error: boolean;
  metadata: unknown;
}

const defaultTokenMetadata: TokenMetadata = {
  valid: null,
  error: false,
  metadata: null,
};

function useFetchTokenMetadata(
  address: string | undefined,
  chainId: string,
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
          url: swapsUtils.getTokenMetadataURL(chainId as `0x${string}`),
          params: {
            address,
          },
          cancelToken: cancelTokenSource.token,
        });
        setTokenMetadata({ error: false, valid: true, metadata: data });
      } catch (error) {
        // Address is not an ERC20
        const requestError = error as { response?: { status?: number } };
        if (requestError?.response?.status === 422) {
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
