import { useEffect } from 'react';
import { getBuildNumber } from 'react-native-device-info';
import { createUpdateNeededNavDetails } from '../../UI/UpdateNeeded/UpdateNeeded';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { InteractionManager } from 'react-native';


import { selectAppMinimumBuild } from '../../../selectors/featureFlagController/minimumAppVersion';

const useMinimumVersions = () => {
  const { automaticSecurityChecksEnabled } = useSelector(
    (state) => state.security
  );

  const appMinimumBuild = useSelector((state) => selectAppMinimumBuild(state));
  const currentBuildNumber = Number(getBuildNumber());
  const navigation = useNavigation();
  const shouldTriggerUpdateFlow =
  automaticSecurityChecksEnabled && appMinimumBuild > currentBuildNumber;

  useEffect(() => {
    if (shouldTriggerUpdateFlow) {
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate(...createUpdateNeededNavDetails());
      });
    }
  }, [navigation, shouldTriggerUpdateFlow]);
};

export default useMinimumVersions;