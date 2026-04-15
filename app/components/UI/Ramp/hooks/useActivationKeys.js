import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addActivationKey,
  getActivationKeys,
  removeActivationKey,
  updateActivationKey } from
'../../../../reducers/fiatOrders';
import { SDK } from '../sdk';






export default function useActivationKeys(options = {}) {
  const { internal = false, provider = false } = options;
  const dispatch = useDispatch();
  const [sdkActivationKeys, setSdkActivationKeys] = useState(() =>
  internal ? SDK.getActivationKeys() : []
  );
  const deviceActivationKeys = useSelector(getActivationKeys);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [providerInitialized, setProviderInitialized] = useState(false);

  useEffect(() => {
    if (!internal) {
      return;
    }
    if (provider && providerInitialized) {
      return;
    }
    (async () => {
      setIsLoadingKeys(true);
      await SDK.setActivationKeys(
        deviceActivationKeys.
        filter(({ active }) => active).
        map(({ key }) => key)
      );
      const sdkKeys = SDK.getActivationKeys();
      setSdkActivationKeys(sdkKeys);
      setIsLoadingKeys(false);
      if (provider) {
        setProviderInitialized(true);
      }
    })();
  }, [deviceActivationKeys, internal, provider, providerInitialized]);

  const activationKeys = useMemo(() => {
    const keys = deviceActivationKeys.map((activationKey) => ({
      ...activationKey,
      active: sdkActivationKeys.includes(activationKey.key)
    }));
    return keys;
  }, [sdkActivationKeys, deviceActivationKeys]);

  const dispatchAddActivationKey =

  useCallback(
    (key, label) => dispatch(addActivationKey(key, label)),
    [dispatch]
  );

  const dispatchRemoveActivationKey =

  useCallback(
    (key) => dispatch(removeActivationKey(key)),
    [dispatch]
  );

  const dispatchUpdateActivationKey =

  useCallback(
    (activationKey, label, active) =>
    dispatch(updateActivationKey(activationKey, label, active)),
    [dispatch]
  );
  return {
    isLoadingKeys,
    activationKeys,
    addActivationKey: dispatchAddActivationKey,
    removeActivationKey: dispatchRemoveActivationKey,
    updateActivationKey: dispatchUpdateActivationKey
  };
}