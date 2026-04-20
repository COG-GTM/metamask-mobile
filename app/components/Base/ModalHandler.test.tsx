// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

// Internal dependencies.
import ModalHandler from './ModalHandler';

describe('ModalHandler', () => {
  it('passes modal state and handlers to its function child', () => {
    const childSpy = jest.fn(
      ({
        isVisible,
        toggleModal,
      }: {
        isVisible: boolean;
        toggleModal: () => void;
        showModal: () => void;
        hideModal: () => void;
      }) => (
        <RNText onPress={toggleModal}>{isVisible ? 'visible' : 'hidden'}</RNText>
      ),
    );
    const { getByText } = render(<ModalHandler>{childSpy}</ModalHandler>);
    expect(getByText('hidden')).toBeTruthy();
    expect(childSpy).toHaveBeenCalled();
    fireEvent.press(getByText('hidden'));
    expect(getByText('visible')).toBeTruthy();
  });
});
