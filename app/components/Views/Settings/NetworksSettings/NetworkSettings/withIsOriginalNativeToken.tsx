import React, { useEffect, useState, ComponentType } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

interface ChainData {
  name: string;
  chainId: number;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  [key: string]: unknown;
}

interface MatchedChainNetwork {
  safeChainsList: ChainData[];
}

export interface WithIsOriginalNativeTokenProps {
  matchedChainNetwork: MatchedChainNetwork | null;
}

const withIsOriginalNativeToken = <P extends object>(
  WrappedComponent: ComponentType<P & WithIsOriginalNativeTokenProps>,
) => {
  const WithIsOriginalNativeTokenWrapper = (props: Omit<P, keyof WithIsOriginalNativeTokenProps>) => {
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
