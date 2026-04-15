import { useState, useRef, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';
import Engine from '../../../core/Engine';
import { selectRecentTokenSearches } from '../../../selectors/tokenSearchDiscoveryController';

import { tokenSearchDiscoveryEnabled } from '../../../selectors/featureFlagController/tokenSearchDiscovery';

const SEARCH_DEBOUNCE_DELAY = 150;
const MINIMUM_QUERY_LENGTH = 2;
export const MAX_RESULTS = '20';

export const useTokenSearchDiscovery = () => {
  const recentSearches = useSelector(selectRecentTokenSearches);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const latestRequestId = useRef(0);
  const tokenSearchEnabled = useSelector(tokenSearchDiscoveryEnabled);


  const searchTokens = useMemo(
    () =>
    debounce(async (query) => {
      setIsLoading(true);
      setError(null);

      if (query.length < MINIMUM_QUERY_LENGTH || !tokenSearchEnabled) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      const requestId = ++latestRequestId.current;

      try {
        const { TokenSearchDiscoveryController } = Engine.context;
        const result = await TokenSearchDiscoveryController.searchSwappableTokens({
          query,
          limit: MAX_RESULTS
        });
        if (requestId === latestRequestId.current) {
          setResults(result);
        }
      } catch (err) {
        if (requestId === latestRequestId.current) {
          setError(err);
        }
      } finally {
        if (requestId === latestRequestId.current) {
          setIsLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_DELAY),
    [tokenSearchEnabled]
  );

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    searchTokens,
    recentSearches,
    isLoading,
    error,
    results,
    reset
  };
};

export default useTokenSearchDiscovery;