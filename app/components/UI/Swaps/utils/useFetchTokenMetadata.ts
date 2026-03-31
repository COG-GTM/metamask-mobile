import { useEffect, useState } from 'react';
import axios from 'axios';
import { swapsUtils } from '@metamask/swaps-controller';

const defaultTokenMetadata = {
  valid: null,
  error: false,
  metadata: null,
};

function useFetchTokenMetadata(address: string | null, chainId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState(defaultTokenMetadata);

  useEffect(() => {
    if (!address) {
      return;
    }

    // @ts-expect-error Legacy JS code needs type refinement
    let cancelTokenSource;
    async function fetchTokenMetadata() {
      try {
        cancelTokenSource = axios.CancelToken.source();
        setTokenMetadata(defaultTokenMetadata);
        setIsLoading(true);
        const { data } = await axios.request({
          // @ts-expect-error Legacy JS code needs type refinement
          url: swapsUtils.getTokenMetadataURL(chainId),
          params: {
            address,
          },
          cancelToken: cancelTokenSource.token,
        });
        // @ts-expect-error Legacy JS code needs type refinement
        setTokenMetadata({ error: false, valid: true, metadata: data });
      } catch (error) {
        // Address is not an ERC20
        // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any)?.response?.status === 422) {
          // @ts-expect-error Legacy JS code needs type refinement
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
      // @ts-expect-error Legacy JS code needs type refinement
      cancelTokenSource?.cancel();
      setIsLoading(false);
      setTokenMetadata(defaultTokenMetadata);
    };
  }, [address, chainId]);

  return [isLoading, tokenMetadata];
}

export default useFetchTokenMetadata;
