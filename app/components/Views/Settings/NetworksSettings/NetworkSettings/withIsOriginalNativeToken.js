import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUseSafeChainsListValidation } from '../../../../../selectors/preferencesController';
import { getSafeChainsList } from '../../../../../util/networks/safeChainsList';

const withIsOriginalNativeToken = (WrappedComponent) => {
  // This is the functional component wrapper that can use hooks
  const WithIsOriginalNativeTokenWrapper = (props) => {
    // Use the useSelector hook to access Redux state
    const [matchedChainNetwork, setMatchedChainNetwork] = useState(null);
    const useSafeChainsListValidation = useSelector(
      selectUseSafeChainsListValidation,
    );

    useEffect(() => {
      // Skip network safety checks if the privacy toggle is off.
      if (!useSafeChainsListValidation) {
        setMatchedChainNetwork(null);
        return undefined;
      }

      let isActive = true;

      getSafeChainsList()
        .then((safeChainsList) => {
          if (isActive) {
            setMatchedChainNetwork({ safeChainsList });
          }
        })
        .catch(() => {
          if (isActive) {
            setMatchedChainNetwork(null);
          }
        });

      return () => {
        isActive = false;
      };
    }, [useSafeChainsListValidation]);

    // Pass the value from useSelector as a prop to the WrappedComponent
    return (
      <WrappedComponent {...props} matchedChainNetwork={matchedChainNetwork} />
    );
  };

  return WithIsOriginalNativeTokenWrapper;
};

export default withIsOriginalNativeToken;
