import React, { ComponentType, useEffect, useState } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

interface MatchedChainNetwork {
  safeChainsList: unknown[];
}

interface InjectedProps {
  matchedChainNetwork: MatchedChainNetwork | null;
}

const withIsOriginalNativeToken = <P extends InjectedProps>(
  WrappedComponent: ComponentType<P>,
) => {
  const WithIsOriginalNativeTokenWrapper = (
    props: Omit<P, keyof InjectedProps>,
  ) => {
    const [matchedChainNetwork, setMatchedChainNetwork] =
      useState<MatchedChainNetwork | null>(null);

    useEffect(() => {
      axios
        .get<unknown[]>(CHAIN_ID_NETWORK_URL)
        .then(({ data: safeChainsList }) => {
          setMatchedChainNetwork({
            safeChainsList: [...safeChainsList],
          });
        });
    }, []);

    const mergedProps = {
      ...(props as P),
      matchedChainNetwork,
    };

    return <WrappedComponent {...mergedProps} />;
  };

  return WithIsOriginalNativeTokenWrapper;
};

export default withIsOriginalNativeToken;
