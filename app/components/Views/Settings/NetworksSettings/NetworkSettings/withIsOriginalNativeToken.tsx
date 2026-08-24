import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

export interface SafeChain {
  chainId: string;
  name: string;
  nativeCurrency: { symbol: string; decimals: number; name: string };
  rpc: string[];
}

export interface MatchedChainNetwork {
  safeChainsList: SafeChain[];
}

export interface WithIsOriginalNativeTokenProps {
  matchedChainNetwork: MatchedChainNetwork | null;
}

const withIsOriginalNativeToken = <P extends object>(
  WrappedComponent: React.ComponentType<P & WithIsOriginalNativeTokenProps>,
) => {
  // This is the functional component wrapper that can use hooks
  const WithIsOriginalNativeTokenWrapper = (props: P) => {
    // Use the useSelector hook to access Redux state
    const [matchedChainNetwork, setMatchedChainNetwork] =
      useState<MatchedChainNetwork | null>(null);

    useEffect(() => {
      axios
        .get<SafeChain[]>(CHAIN_ID_NETWORK_URL)
        .then(({ data: safeChainsList }) => {
          setMatchedChainNetwork({
            safeChainsList: [...safeChainsList],
          });
        });
    }, []);

    // Pass the value from useSelector as a prop to the WrappedComponent
    return (
      <WrappedComponent {...props} matchedChainNetwork={matchedChainNetwork} />
    );
  };

  return WithIsOriginalNativeTokenWrapper;
};

export default withIsOriginalNativeToken;
