
import { getDecimalChainId } from '../../util/networks';
import { useState, useEffect } from 'react';






































const useTokenDescriptions = ({
  address,
  chainId



}) =>





{
  const [data, setData] = useState(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      try {
        const baseUri = `https://token.api.cx.metamask.io`;
        const uri = new URL(
          `${baseUri}/token/${getDecimalChainId(chainId)}/description`
        );
        uri.searchParams.set('address', address);

        const response = await fetch(uri.toString());
        const json = await response.json();
        setData(json);
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrices();
  }, [address, chainId]);

  return { data, isLoading, error };
};

export default useTokenDescriptions;