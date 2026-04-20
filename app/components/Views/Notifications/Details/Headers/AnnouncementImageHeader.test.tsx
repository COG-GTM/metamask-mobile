import React from 'react';
import AnnouncementImageHeader from './AnnouncementImageHeader';
import { ModalHeaderType } from '../../../../../util/notifications/constants/config';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';

const mockInitialState = {
  engine: {
    backgroundState,
  },
};

describe('AnnouncementImageHeader', () => {
  const baseProps = {
    type: ModalHeaderType.ANNOUNCEMENT_IMAGE as const,
    imageUrl: 'https://example.com/announcement.png',
  };

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(
      <AnnouncementImageHeader {...baseProps} />,
      { state: mockInitialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders a truthy tree with the provided imageUrl', () => {
    const { toJSON } = renderWithProvider(
      <AnnouncementImageHeader {...baseProps} />,
      { state: mockInitialState },
    );
    expect(toJSON()).toBeTruthy();
  });
});
