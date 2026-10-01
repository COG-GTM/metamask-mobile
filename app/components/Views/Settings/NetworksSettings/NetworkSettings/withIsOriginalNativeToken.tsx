import React, { ComponentType, useEffect, useState } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

interface SafeChain {
  chainId: string;
  name: string;
  nativeCurrency: { symbol: string; name: string; decimals: number };
  rpc: string[];
  [key: string]: unknown;
}

export interface MatchedChainNetwork {
  safeChainsList: SafeChain[];
}

const withIsOriginalNativeToken = <P extends object>(
  WrappedComponent: ComponentType<
    P & { matchedChainNetwork: MatchedChainNetwork | null }
  >,
) => {
  // This is the functional component wrapper that can use hooks
  const WithIsOriginalNativeTokenWrapper = (props: P) => {
    // Use the useSelector hook to access Redux state
    const [matchedChainNetwork, setMatchedChainNetwork] =
      useState<MatchedChainNetwork | null>(null);

    useEffect(() => {
      axios.get(CHAIN_ID_NETWORK_URL).then(({ data: safeChainsList }) => {
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
