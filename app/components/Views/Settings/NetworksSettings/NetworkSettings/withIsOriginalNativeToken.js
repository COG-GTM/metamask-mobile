import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';
const CHAIN_ID_NETWORK_TIMEOUT = 10000;

let safeChainsListPromise = null;
let safeChainsListAbortController = null;
let safeChainsListSubscribers = 0;

export const resetSafeChainsListCache = () => {
  safeChainsListPromise = null;
  safeChainsListAbortController = null;
};

/**
 * Fetches the safe chains list at most once per app session and shares the
 * parsed result across callers.
 *
 * @returns {{ promise: Promise<object[]>, release: () => void }} The shared
 * request and a cleanup function the caller must invoke when it no longer
 * needs the result. The in-flight request is aborted once every caller has
 * released it.
 */
export const getSafeChainsList = () => {
  if (!safeChainsListPromise) {
    safeChainsListAbortController = new AbortController();
    safeChainsListPromise = axios
      .get(CHAIN_ID_NETWORK_URL, {
        timeout: CHAIN_ID_NETWORK_TIMEOUT,
        signal: safeChainsListAbortController.signal,
      })
      .then(({ data }) => {
        safeChainsListAbortController = null;
        return data;
      })
      .catch((error) => {
        resetSafeChainsListCache();
        throw error;
      });
  }

  safeChainsListSubscribers += 1;
  let released = false;

  return {
    promise: safeChainsListPromise,
    release: () => {
      if (released) {
        return;
      }
      released = true;
      safeChainsListSubscribers -= 1;
      if (safeChainsListSubscribers === 0 && safeChainsListAbortController) {
        safeChainsListAbortController.abort();
        resetSafeChainsListCache();
      }
    },
  };
};

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
