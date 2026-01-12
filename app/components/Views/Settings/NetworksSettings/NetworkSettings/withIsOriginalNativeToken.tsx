import React, { useEffect, useState, ComponentType } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

interface ChainInfo {
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpc: string[];
  faucets: string[];
  infoURL: string;
  shortName: string;
  networkId: number;
  slip44?: number;
  ens?: {
    registry: string;
  };
  explorers?: Array<{
    name: string;
    url: string;
    standard: string;
  }>;
}

export interface MatchedChainNetwork {
  safeChainsList: ChainInfo[];
}

export interface WithIsOriginalNativeTokenProps {
  matchedChainNetwork: MatchedChainNetwork | null;
}

const withIsOriginalNativeToken = <P extends WithIsOriginalNativeTokenProps>(
  WrappedComponent: ComponentType<P>,
): ComponentType<Omit<P, keyof WithIsOriginalNativeTokenProps>> => {
  const WithIsOriginalNativeTokenWrapper = (
    props: Omit<P, keyof WithIsOriginalNativeTokenProps>,
  ) => {
    const [matchedChainNetwork, setMatchedChainNetwork] =
      useState<MatchedChainNetwork | null>(null);

    useEffect(() => {
      axios
        .get<ChainInfo[]>(CHAIN_ID_NETWORK_URL)
        .then(({ data: safeChainsList }) => {
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
