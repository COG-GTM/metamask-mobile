import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUseSafeChainsListValidation } from '../../../../../selectors/preferencesController';
import { getSafeChainsList } from '../../../../../util/networks/safeChainsList';
import Logger from '../../../../../util/Logger';

const withIsOriginalNativeToken = (WrappedComponent) => {
  const WithIsOriginalNativeTokenWrapper = (props) => {
    const [matchedChainNetwork, setMatchedChainNetwork] = useState(null);
    const useSafeChainsListValidation = useSelector(
      selectUseSafeChainsListValidation,
    );

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
        .catch((error) => {
          Logger.error(
            error,
            'withIsOriginalNativeToken: failed to load safe chains list',
          );
        });
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
