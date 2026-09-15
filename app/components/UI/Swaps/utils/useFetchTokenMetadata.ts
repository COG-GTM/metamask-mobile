import { useEffect, useState } from 'react';
import axios, { isAxiosError } from 'axios';
import { swapsUtils } from '@metamask/swaps-controller';
import type { Hex } from '@metamask/utils';

// Axios exposes CancelToken on its default export at runtime.
// eslint-disable-next-line import/no-named-as-default-member
const { CancelToken } = axios;

interface TokenMetadata {
  valid: boolean | null;
  error: boolean;
  // The API response shape is supplied by the Swaps controller endpoint.
  metadata: unknown;
}

const defaultTokenMetadata: TokenMetadata = {
  valid: null,
  error: false,
  metadata: null,
};

function useFetchTokenMetadata(
  address: string | null | undefined,
  chainId: Hex,
): [boolean, TokenMetadata] {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState(defaultTokenMetadata);

  useEffect(() => {
    if (!address) {
      return;
    }

    let cancelTokenSource: ReturnType<typeof CancelToken.source> | undefined;
    async function fetchTokenMetadata() {
      try {
        cancelTokenSource = CancelToken.source();
        setTokenMetadata(defaultTokenMetadata);
        setIsLoading(true);
        const { data } = await axios.request({
          url: swapsUtils.getTokenMetadataURL(chainId),
          params: {
            address,
          },
          cancelToken: cancelTokenSource.token,
        });
        setTokenMetadata({ error: false, valid: true, metadata: data });
      } catch (error) {
        // Address is not an ERC20
        if (isAxiosError(error) && error.response?.status === 422) {
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
