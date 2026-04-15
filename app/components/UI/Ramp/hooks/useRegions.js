import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { isEqual } from 'lodash';
import Routes from '../../../../constants/navigation/Routes';
import { useRampSDK } from '../sdk';

import useSDKMethod from './useSDKMethod';


const isCountry = (region) =>
region.states !== undefined;

const findDetectedRegion = (regions) => {
  const detectedRegion = regions.find((region) => region.detected);
  if (!detectedRegion) return null;
  if (isCountry(detectedRegion) && detectedRegion.states.length > 0) {
    return findDetectedRegion(detectedRegion.states);
  }
  return detectedRegion;
};

export default function useRegions() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    selectedRegion,
    setSelectedRegion,
    unsupportedRegion,
    setUnsupportedRegion,
    isBuy,
    isSell
  } = useRampSDK();

  const [isDetecting, setisDetecting] = useState(!selectedRegion);

  const [{ data, isFetching, error }, queryGetCountries] =
  useSDKMethod('getCountries');

  const updatedRegion = useMemo(() => {
    if (!selectedRegion || !data) return null;
    const allRegions = data.reduce(
      (acc, region) => [
      ...acc,
      region,
      ...(region.states || [])],

      []
    );
    return allRegions.find((region) => region.id === selectedRegion.id) ?? null;
  }, [data, selectedRegion]);

  const redirectToRegion = useCallback(() => {
    if (
    route.name !== Routes.RAMP.REGION &&
    route.name !== Routes.RAMP.REGION_HAS_STARTED)
    {
      navigation.reset({
        index: 0,
        routes: [
        {
          name: Routes.RAMP.REGION_HAS_STARTED
        }]

      });
    }
  }, [navigation, route.name]);

  useEffect(() => {
    if (!data || selectedRegion || !isDetecting) return;
    const detectedRegion = findDetectedRegion(data);
    if (detectedRegion) {
      setSelectedRegion(detectedRegion);
    }

    setisDetecting(false);
  }, [data, navigation, selectedRegion, setSelectedRegion, isDetecting]);

  useEffect(() => {
    if (!updatedRegion) return;

    if (updatedRegion.unsupported) {
      setSelectedRegion(null);
      setUnsupportedRegion(updatedRegion);
      redirectToRegion();
    } else {
      if (!isEqual(updatedRegion, selectedRegion)) {
        setSelectedRegion(updatedRegion);
      }

      if (
      isBuy && !updatedRegion.support.buy ||
      isSell && !updatedRegion.support.sell)
      {
        setUnsupportedRegion(updatedRegion);
        redirectToRegion();
      }
    }
  }, [
  updatedRegion,
  setSelectedRegion,
  navigation,
  route.name,
  setUnsupportedRegion,
  redirectToRegion,
  isBuy,
  isSell,
  selectedRegion]
  );

  const clearUnsupportedRegion = useCallback(
    () => setUnsupportedRegion(undefined),
    [setUnsupportedRegion]
  );

  return {
    data,
    isFetching,
    isDetecting,
    error,
    query: queryGetCountries,
    selectedRegion,
    unsupportedRegion,
    clearUnsupportedRegion
  };
}