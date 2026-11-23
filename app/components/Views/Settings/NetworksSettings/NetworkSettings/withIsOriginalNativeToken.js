import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUseSafeChainsListValidation } from '../../../../../selectors/preferencesController';
import { getSafeChainsList } from '../../../../../util/networks/safeChainsList';

const withIsOriginalNativeToken = (WrappedComponent) => {
  const WithIsOriginalNativeTokenWrapper = (props) => {
    const useSafeChainsListValidation = useSelector(
      selectUseSafeChainsListValidation,
    );
    const [matchedChainNetwork, setMatchedChainNetwork] = useState(null);

    useEffect(() => {
      if (!useSafeChainsListValidation) {
        return;
      }
      let isMounted = true;
      getSafeChainsList()
        .then((safeChainsList) => {
          if (isMounted) {
            setMatchedChainNetwork({ safeChainsList });
          }
        })
        .catch(() => undefined);
      return () => {
        isMounted = false;
      };
    }, [useSafeChainsListValidation]);

    return (
      <WrappedComponent {...props} matchedChainNetwork={matchedChainNetwork} />
    );
  };

  return WithIsOriginalNativeTokenWrapper;
};

export default withIsOriginalNativeToken;
