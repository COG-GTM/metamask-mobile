import React from 'react';
import { ButtonType, UserInputEventType } from '@metamask/snaps-sdk';
import { TouchableOpacity } from 'react-native';
import { useSnapInterfaceContext } from '../SnapInterfaceContext';
import AnimatedLottieView from 'lottie-react-native';










export const SnapUIButton = ({
  name,
  children,
  form,
  type = ButtonType.Button,
  disabled = false,
  loading = false
}) => {
  const { handleEvent } = useSnapInterfaceContext();

  const handlePress = () => {
    handleEvent({
      event: UserInputEventType.ButtonClickEvent,
      name
    });

    // Since we don't have onSubmit on mobile, the button submits the form.
    if (type === ButtonType.Submit) {
      handleEvent({
        event: UserInputEventType.FormSubmitEvent,
        name: form
      });
    }
  };

  return (
    <TouchableOpacity id={name} onPress={handlePress} disabled={disabled}>
      {loading ?
      <AnimatedLottieView
        source={{ uri: './loading.json' }}
        autoPlay
        loop
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          width: 24,
          height: 24
        }} /> :


      children
      }
    </TouchableOpacity>);

};