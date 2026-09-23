import React, { useEffect, useState } from 'react';
import { getSafeChainsList } from './safeChainsList';

const withIsOriginalNativeToken = (WrappedComponent) => {
  // This is the functional component wrapper that can use hooks
  const WithIsOriginalNativeTokenWrapper = (props) => {
    // Use the useSelector hook to access Redux state
    const [matchedChainNetwork, setMatchedChainNetwork] = useState(null);

    useEffect(() => {
      let isMounted = true;
      const { promise, release } = getSafeChainsList();

      promise
        .then((safeChainsList) => {
          if (isMounted) {
            setMatchedChainNetwork({ safeChainsList });
          }
        })
        .catch(() => {
          // network list is unavailable; consumers keep the null default
        })
        .finally(release);

      return () => {
        isMounted = false;
        release();
      };
    }, []);

    // Pass the value from useSelector as a prop to the WrappedComponent
    return (
      <WrappedComponent {...props} matchedChainNetwork={matchedChainNetwork} />
    );
  };

  return WithIsOriginalNativeTokenWrapper;
};

export default withIsOriginalNativeToken;
