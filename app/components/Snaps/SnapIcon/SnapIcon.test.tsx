import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { SnapIcon } from './SnapIcon';
import { selectTargetSubjectMetadata } from '../../../selectors/snaps/permissionController';

jest.mock('../../../selectors/snaps/permissionController', () => ({
  selectTargetSubjectMetadata: jest.fn(),
}));

describe('SnapIcon', () => {
  const snapId = 'npm:@metamask/example-snap';

  beforeEach(() => {
    (selectTargetSubjectMetadata as unknown as jest.Mock).mockReset();
  });

  it('renders an AvatarFavicon when the snap has an icon URL', () => {
    (selectTargetSubjectMetadata as unknown as jest.Mock).mockReturnValue({
      iconUrl: 'https://example.com/icon.png',
      name: 'Example Snap',
    });

    const { toJSON } = renderWithProvider(<SnapIcon snapId={snapId} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('https://example.com/icon.png');
  });

  it('falls back to an initial letter Avatar when no icon URL is present', () => {
    (selectTargetSubjectMetadata as unknown as jest.Mock).mockReturnValue({
      iconUrl: null,
      name: 'Magic Snap',
    });

    const { getByText } = renderWithProvider(<SnapIcon snapId={snapId} />);
    expect(getByText('M')).toBeTruthy();
  });

  it('handles missing snap name gracefully', () => {
    (selectTargetSubjectMetadata as unknown as jest.Mock).mockReturnValue({
      iconUrl: null,
      name: null,
    });

    const { toJSON } = renderWithProvider(<SnapIcon snapId={snapId} />);
    expect(toJSON()).toBeTruthy();
  });

  it('matches the snapshot for the icon-URL branch', () => {
    (selectTargetSubjectMetadata as unknown as jest.Mock).mockReturnValue({
      iconUrl: 'https://example.com/icon.png',
      name: 'Example Snap',
    });
    const { toJSON } = renderWithProvider(<SnapIcon snapId={snapId} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
