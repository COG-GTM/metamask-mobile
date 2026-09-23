import React, { ComponentType, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUseSafeChainsListValidation } from '../../../../../selectors/preferencesController';
import {
  SafeChainsListEntry,
  getSafeChainsList,
} from '../../../../../util/networks/safeChainsList';

export interface MatchedChainNetwork {
  safeChainsList: SafeChainsListEntry[];
}

export interface WithIsOriginalNativeTokenProps {
  matchedChainNetwork: MatchedChainNetwork | null;
}

const withIsOriginalNativeToken = <P extends object>(
  WrappedComponent: ComponentType<P & WithIsOriginalNativeTokenProps>,
) => {
  // This is the functional component wrapper that can use hooks
  const WithIsOriginalNativeTokenWrapper = (props: P) => {
    const [matchedChainNetwork, setMatchedChainNetwork] =
      useState<MatchedChainNetwork | null>(null);
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

    return (
      <WrappedComponent {...props} matchedChainNetwork={matchedChainNetwork} />
    );
  };

  return WithIsOriginalNativeTokenWrapper;
};

export default withIsOriginalNativeToken;
