import React, { useEffect, useState, ComponentType } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

interface ChainNetwork {
  safeChainsList: unknown[];
}

interface WithIsOriginalNativeTokenProps {
  matchedChainNetwork: ChainNetwork | null;
}

const withIsOriginalNativeToken = <P extends object>(
  WrappedComponent: ComponentType<P & WithIsOriginalNativeTokenProps>,
) => {
  const WithIsOriginalNativeTokenWrapper = (props: P) => {
    const [matchedChainNetwork, setMatchedChainNetwork] = useState<ChainNetwork | null>(null);

    useEffect(() => {
      axios.get(CHAIN_ID_NETWORK_URL).then(({ data: safeChainsList }) => {
        setMatchedChainNetwork({
          safeChainsList: [...safeChainsList],
        });
      });
    }, []);

    return (
      <WrappedComponent {...props} matchedChainNetwork={matchedChainNetwork} />
    );
  };

  return WithIsOriginalNativeTokenWrapper;
};

export default withIsOriginalNativeToken;
