import { useNavigation } from '@react-navigation/native';

import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import Device from '../../../../../util/device';

import { useConfirmActions } from '../useConfirmActions';
import { useStandaloneConfirmation } from './useStandaloneConfirmation';

const useClearConfirmationOnBackSwipe = () => {
  const navigation =
  useNavigation();
  const { isStandaloneConfirmation } = useStandaloneConfirmation();
  const { onReject } = useConfirmActions();

  useEffect(() => {
    if (isStandaloneConfirmation && Device.isIos()) {
      const unsubscribe = navigation.addListener('gestureEnd', () => {
        onReject();
      });

      return unsubscribe;
    }
  }, [isStandaloneConfirmation, navigation, onReject]);

  useEffect(() => {
    if (isStandaloneConfirmation && Device.isAndroid()) {
      const backHandlerSubscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          onReject();
          return true;
        }
      );

      return () => {
        backHandlerSubscription.remove();
      };
    }
  }, [isStandaloneConfirmation, onReject]);
};

export default useClearConfirmationOnBackSwipe;