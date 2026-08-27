/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, @typescript-eslint/no-explicit-any, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

// @ts-expect-error -- legacy JavaScript UI type boundary
const withIsOriginalNativeToken = (WrappedComponent) => {
  // This is the functional component wrapper that can use hooks
  // @ts-expect-error -- legacy JavaScript UI type boundary
  const WithIsOriginalNativeTokenWrapper = (props): any => {
    // Use the useSelector hook to access Redux state
    const [matchedChainNetwork, setMatchedChainNetwork] = useState(null);

    useEffect(() => {
      axios.get(CHAIN_ID_NETWORK_URL).then(({ data: safeChainsList }) => {
        setMatchedChainNetwork({
          // @ts-expect-error -- legacy JavaScript UI type boundary
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
