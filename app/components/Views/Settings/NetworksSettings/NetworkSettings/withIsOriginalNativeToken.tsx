import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

interface ChainNetwork {
  safeChainsList: Record<string, unknown>[];
}

export interface WithIsOriginalNativeTokenProps {
  matchedChainNetwork: ChainNetwork | null;
}

const withIsOriginalNativeToken = <P extends WithIsOriginalNativeTokenProps>(
  WrappedComponent: React.ComponentType<P>,
): React.FC<Omit<P, keyof WithIsOriginalNativeTokenProps>> => {
  const WithIsOriginalNativeTokenWrapper = (
    props: Omit<P, keyof WithIsOriginalNativeTokenProps>,
  ) => {
    const [matchedChainNetwork, setMatchedChainNetwork] =
      useState<ChainNetwork | null>(null);

    useEffect(() => {
      axios.get(CHAIN_ID_NETWORK_URL).then(({ data: safeChainsList }) => {
        setMatchedChainNetwork({
          safeChainsList: [...safeChainsList],
        });
      });
    }, []);

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
