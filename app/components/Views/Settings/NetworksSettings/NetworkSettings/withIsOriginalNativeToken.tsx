import React, { ComponentType, useEffect, useState } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

export interface SafeChainNativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface SafeChain {
  chainId: number;
  name: string;
  nativeCurrency: SafeChainNativeCurrency;
  rpc?: string[];
}

export interface MatchedChainNetwork {
  safeChainsList: SafeChain[];
}

export interface WithIsOriginalNativeTokenProps {
  matchedChainNetwork: MatchedChainNetwork | null;
}

const withIsOriginalNativeToken = <Props extends WithIsOriginalNativeTokenProps>(
  WrappedComponent: ComponentType<Props>,
) => {
  // This is the functional component wrapper that can use hooks
  const WithIsOriginalNativeTokenWrapper = (
    props: Omit<Props, keyof WithIsOriginalNativeTokenProps>,
  ) => {
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
      <WrappedComponent
        {...(props as Props)}
        matchedChainNetwork={matchedChainNetwork}
      />
    );
  };

  return WithIsOriginalNativeTokenWrapper;
};

export default withIsOriginalNativeToken;
