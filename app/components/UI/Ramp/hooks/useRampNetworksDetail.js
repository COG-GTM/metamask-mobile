import { useCallback, useEffect, useState } from 'react';
import { SDK } from '../sdk';

import Logger from '../../../../util/Logger';


function useRampNetworksDetail() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  const [networksDetails, setNetworksDetails] = useState([]);
  const getNetworksDetail = useCallback(async () => {
    try {
      setError(undefined);
      setIsLoading(true);
      const networkDetails = await SDK.getNetworkDetails();
      setNetworksDetails(networkDetails);
    } catch (requestError) {
      setError(requestError);
      Logger.error(
        requestError,
        'useRampNetworksDetail::getNetworksDetails'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getNetworksDetail();
  }, [getNetworksDetail]);

  return { networksDetails, isLoading, error, getNetworksDetail };
}

export default useRampNetworksDetail;