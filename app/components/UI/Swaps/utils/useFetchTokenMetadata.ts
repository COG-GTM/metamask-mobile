import { useEffect, useState } from 'react';
import axios, { CancelTokenSource } from 'axios';
import { swapsUtils } from '@metamask/swaps-controller';
import { hasProperty, isObject } from '@metamask/utils';
import { SwapsToken } from './index';

interface TokenMetadataState {
  valid: boolean | null;
  error: boolean;
  metadata: SwapsToken | null;
}

const defaultTokenMetadata: TokenMetadataState = {
  valid: null,
  error: false,
  metadata: null,
};

function useFetchTokenMetadata(
  address: string | null | undefined,
  chainId: string,
): [boolean, TokenMetadataState] {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState(defaultTokenMetadata);

  useEffect(() => {
    if (!address) {
      return;
    }

    let cancelTokenSource: CancelTokenSource | undefined;
    async function fetchTokenMetadata() {
      try {
        // eslint-disable-next-line import/no-named-as-default-member
        const source = axios.CancelToken.source();
        cancelTokenSource = source;
        setTokenMetadata(defaultTokenMetadata);
        setIsLoading(true);
        const { data } = await axios.request({
          url: swapsUtils.getTokenMetadataURL(chainId as `0x${string}`),
          params: {
            address,
          },
          cancelToken: source.token,
        });
        setTokenMetadata({ error: false, valid: true, metadata: data });
      } catch (error) {
        // Address is not an ERC20
        if (
          isObject(error) &&
          hasProperty(error, 'response') &&
          isObject(error.response) &&
          error.response.status === 422
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
