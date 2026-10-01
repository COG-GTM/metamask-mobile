import React, { ComponentType, useEffect, useState } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

export interface MatchedChainNetwork {
  safeChainsList: unknown[];
}

export interface WithIsOriginalNativeTokenProps {
  matchedChainNetwork: MatchedChainNetwork | null;
}

const withIsOriginalNativeToken = <P extends WithIsOriginalNativeTokenProps>(
  WrappedComponent: ComponentType<P>,
) => {
  // This is the functional component wrapper that can use hooks
  const WithIsOriginalNativeTokenWrapper = (
    props: Omit<P, keyof WithIsOriginalNativeTokenProps>,
  ) => {
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
      <WrappedComponent
        {...(props as P)}
        matchedChainNetwork={matchedChainNetwork}
      />
    );
  };

  return WithIsOriginalNativeTokenWrapper;
};

export default withIsOriginalNativeToken;
