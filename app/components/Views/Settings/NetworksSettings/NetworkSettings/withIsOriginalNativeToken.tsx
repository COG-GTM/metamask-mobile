import React, { useEffect, useState, ComponentType } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

interface MatchedChainNetwork {
  safeChainsList: Record<string, unknown>[];
}

const withIsOriginalNativeToken = <P extends Record<string, unknown>>(WrappedComponent: ComponentType<P>) => {
  const WithIsOriginalNativeTokenWrapper = (props: Omit<P, 'matchedChainNetwork'>) => {
    const [matchedChainNetwork, setMatchedChainNetwork] = useState<MatchedChainNetwork | null>(null);

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
