import { useEffect, useState } from 'react';
import axios from 'axios';
import { swapsUtils } from '@metamask/swaps-controller';
import Logger from '../../../../util/Logger';

const defaultTokenMetadata = {
  valid: null,
  error: false,
  metadata: null,
};

function useFetchTokenMetadata(address, chainId) {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState(defaultTokenMetadata);

  useEffect(() => {
    if (!address) {
      return;
    }

    let cancelTokenSource;
    async function fetchTokenMetadata() {
      try {
        cancelTokenSource = axios.CancelToken.source();
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
        if (error?.response?.status === 422) {
          setTokenMetadata({ error: false, valid: false, metadata: null });
        } else if (!axios.isCancel(error)) {
          Logger.error(error, {
            message: 'Swaps: error while fetching token metadata',
            chain_id: chainId,
            status: error?.response?.status,
          });
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
